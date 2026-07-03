import mongoose from 'mongoose';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { Job } from '../models/Job.js';

export async function creditHeldFunds(
  jobId: string,
  amountKobo: number,
  reference: string,
  session?: mongoose.ClientSession
): Promise<void> {
  const opts = session ? { session } : {};

  // Double-entry: two rows per movement
  await LedgerEntry.create(
    [
      {
        jobId,
        type: 'FUNDS_RECEIVED',
        amountKobo,
        debitAccount: 'CLIENT',
        creditAccount: 'ESCROW',
        reference: `nomba-credit-${jobId}`,
        meta: { source: 'nomba_webhook' },
      },
      {
        jobId,
        type: 'FUNDS_HELD',
        amountKobo,
        debitAccount: 'ESCROW',
        creditAccount: 'HELD_FUNDS',
        reference: `nomba-hold-${jobId}`,
        meta: { source: 'nomba_webhook' },
      },
    ],
    opts
  );

  await Job.findByIdAndUpdate(
    jobId,
    { $inc: { heldAmountKobo: amountKobo }, $set: { status: 'FUNDED' } },
    opts
  );
}

export async function debitHeldFundsForRelease(
  jobId: string,
  milestoneId: string,
  amountKobo: number,
  reference: string,
  session: mongoose.ClientSession
): Promise<void> {
  // Double-entry: two rows per movement
  await LedgerEntry.create(
    [
      {
        jobId,
        milestoneId,
        type: 'FUNDS_RELEASED',
        amountKobo,
        debitAccount: 'HELD_FUNDS',
        creditAccount: 'PROVIDER',
        reference: `release-debit-${reference}`,
        meta: { source: 'milestone_approval' },
      },
      {
        jobId,
        milestoneId,
        type: 'FUNDS_RELEASED',
        amountKobo,
        debitAccount: 'PROVIDER',
        creditAccount: 'PROVIDER_WALLET',
        reference: `release-credit-${reference}`,
        meta: { source: 'milestone_approval' },
      },
    ],
    { session }
  );

  await Job.findByIdAndUpdate(
    jobId,
    { $inc: { heldAmountKobo: -amountKobo, releasedAmountKobo: amountKobo } },
    { session }
  );
}

export async function debitHeldFundsForRefund(
  jobId: string,
  amountKobo: number,
  reference: string,
  session: mongoose.ClientSession
): Promise<void> {
  // Double-entry: two rows per movement
  await LedgerEntry.create(
    [
      {
        jobId,
        type: 'FUNDS_REFUNDED',
        amountKobo,
        debitAccount: 'HELD_FUNDS',
        creditAccount: 'CLIENT',
        reference: `refund-debit-${reference}`,
        meta: { source: 'refund' },
      },
      {
        jobId,
        type: 'FUNDS_REFUNDED',
        amountKobo,
        debitAccount: 'CLIENT',
        creditAccount: 'CLIENT_WALLET',
        reference: `refund-credit-${reference}`,
        meta: { source: 'refund' },
      },
    ],
    { session }
  );

  await Job.findByIdAndUpdate(
    jobId,
    { $inc: { heldAmountKobo: -amountKobo }, $set: { status: 'REFUNDED' } },
    { session }
  );
}
