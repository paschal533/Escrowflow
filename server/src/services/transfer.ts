import mongoose from 'mongoose';
import { Milestone } from '../models/Milestone.js';
import { Transfer } from '../models/Transfer.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { debitHeldFundsForRelease } from './ledger.js';
import { initiateTransfer } from './nomba.js';
import { AppError } from '../middleware/errorHandler.js'
import { safeEmail, sendMilestoneApprovedEmail } from './email.js';

export async function releaseMilestonePayout(milestoneId: string): Promise<void> {
  // Idempotency guard — check milestone status before touching money
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) throw new AppError(404, 'Milestone not found');
  if (['TRANSFER_INITIATED', 'TRANSFER_SUCCESS', 'APPROVED'].includes(milestone.status)) return;

  const job = await Job.findById(milestone.jobId);
  if (!job) throw new AppError(404, 'Job not found');

  // Check bank details BEFORE opening a transaction — graceful degradation if missing
  const provider = await User.findById(job.providerId).select('bankAccountNumber bankCode name email');
  if (!provider?.bankAccountNumber || !provider?.bankCode) {
    // Bank details not yet collected (added in Task 13) — hold at APPROVED, no money moved
    await Milestone.findByIdAndUpdate(milestoneId, { status: 'APPROVED' });
    return;
  }

  const idempotencyKey = `transfer-${milestoneId}`;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Milestone.findByIdAndUpdate(
        milestoneId,
        { status: 'TRANSFER_INITIATED', approvedAt: new Date() },
        { session }
      );

      await Transfer.create(
        [
          {
            milestoneId,
            jobId: job._id,
            amountKobo: milestone.amountKobo,
            idempotencyKey,
            status: 'INITIATED',
          },
        ],
        { session }
      );

      await debitHeldFundsForRelease(
        String(job._id),
        milestoneId,
        milestone.amountKobo,
        idempotencyKey,
        session
      );
      // ponytail: ledger.debitHeldFundsForRelease already updates heldAmountKobo/releasedAmountKobo on Job
    });
  } finally {
    session.endSession();
  }

  // External network call outside transaction — can retry independently
  try {
    const result = await initiateTransfer({
      idempotencyKey,
      amountKobo: milestone.amountKobo,
      destinationAccountNumber: provider.bankAccountNumber,
      destinationBankCode: provider.bankCode,
      narration: `EscrowFlow: ${job.title} - ${milestone.title}`,
    });

    // H2: guard against error envelopes or unexpected shapes from Nomba
    if (!result || !result.status) {
      throw new AppError(502, 'Payment provider error: unexpected response shape');
    }

    await Transfer.findOneAndUpdate(
      { idempotencyKey },
      {
        status: result.status === 'success' ? 'SUCCESS' : 'INITIATED',
        bankReference: result.reference,
      }
    );

    if (result.status === 'success') {
      await Milestone.findByIdAndUpdate(milestoneId, { status: 'TRANSFER_SUCCESS' });
      if (provider.email) {
        safeEmail(() => sendMilestoneApprovedEmail(provider.email!, milestone.title, milestone.amountKobo));
      }
      // Close job when all milestones are paid out
      const remaining = await Milestone.countDocuments({
        jobId: job._id,
        status: { $nin: ['TRANSFER_SUCCESS', 'REFUNDED'] },
      });
      if (remaining === 0) {
        await Job.findByIdAndUpdate(job._id, { status: 'COMPLETED' });
      }
    }
  } catch (err) {
    console.error('[Payout] Transfer failed:', err);
    await Transfer.findOneAndUpdate(
      { idempotencyKey },
      { status: 'FAILED', failureReason: String(err) }
    );
    await Milestone.findByIdAndUpdate(milestoneId, { status: 'TRANSFER_FAILED' });
    throw err;
  }
}
