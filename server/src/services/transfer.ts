import mongoose from 'mongoose';
import { Milestone } from '../models/Milestone.js';
import { Transfer } from '../models/Transfer.js';
import { Job } from '../models/Job.js';
import { User } from '../models/User.js';
import { debitHeldFundsForRelease } from './ledger.js';
import { initiateTransfer } from './nomba.js';
import { AppError } from '../middleware/errorHandler.js';

export async function releaseMilestonePayout(milestoneId: string): Promise<void> {
  const milestone = await Milestone.findById(milestoneId);
  if (!milestone) throw new AppError(404, 'Milestone not found');

  const job = await Job.findById(milestone.jobId);
  if (!job) throw new AppError(404, 'Job not found');

  const idempotencyKey = `transfer-${milestoneId}`;

  // Idempotency guard — prevent double-payout
  const existing = await Transfer.findOne({ idempotencyKey });
  if (existing) {
    if (existing.status === 'SUCCESS') return;
    if (existing.status === 'INITIATED') throw new AppError(409, 'Transfer already in progress');
  }

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
    });
  } finally {
    session.endSession();
  }

  // External network call outside transaction — can retry independently
  try {
    const provider = await User.findById(job.providerId).select('bankAccountNumber bankCode name');

    if (provider?.bankAccountNumber && provider?.bankCode) {
      const result = await initiateTransfer({
        idempotencyKey,
        amountKobo: milestone.amountKobo,
        destinationAccountNumber: provider.bankAccountNumber,
        destinationBankCode: provider.bankCode,
        narration: `EscrowFlow: ${job.title} - ${milestone.title}`,
      });

      await Transfer.findOneAndUpdate(
        { idempotencyKey },
        {
          status: result.status === 'success' ? 'SUCCESS' : 'INITIATED',
          bankReference: result.reference,
        }
      );

      if (result.status === 'success') {
        await Milestone.findByIdAndUpdate(milestoneId, { status: 'TRANSFER_SUCCESS' });
        // Close job when all milestones are paid out
        const remaining = await Milestone.countDocuments({
          jobId: job._id,
          status: { $nin: ['TRANSFER_SUCCESS', 'REFUNDED'] },
        });
        if (remaining === 0) {
          await Job.findByIdAndUpdate(job._id, { status: 'COMPLETED' });
        }
      }
    } else {
      // Bank details not yet collected (added in Task 13) — hold at APPROVED
      await Milestone.findByIdAndUpdate(milestoneId, { status: 'APPROVED' });
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
