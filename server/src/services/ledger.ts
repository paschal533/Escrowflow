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

  // Double-entry: debit CLIENT_WALLET, credit ESCROW_HELD
  await LedgerEntry.create(
    [
      {
        jobId,
        type: 'FUNDS_RECEIVED',
        amountKobo,
        debitAccount: 'CLIENT_WALLET',
        creditAccount: 'ESCROW_HELD',
        reference,
        meta: { source: 'nomba_webhook' },
      },
    ],
    opts
  );

  await Job.findByIdAndUpdate(
    jobId,
    { $inc: { heldAmountKobo: amountKobo }, status: 'FUNDED' },
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
  await LedgerEntry.create(
    [
      {
        jobId,
        milestoneId,
        type: 'FUNDS_RELEASED',
        amountKobo,
        debitAccount: 'ESCROW_HELD',
        creditAccount: 'PROVIDER_WALLET',
        reference,
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
  await LedgerEntry.create(
    [
      {
        jobId,
        type: 'FUNDS_REFUNDED',
        amountKobo,
        debitAccount: 'ESCROW_HELD',
        creditAccount: 'CLIENT_WALLET',
        reference,
        meta: { source: 'refund' },
      },
    ],
    { session }
  );

  await Job.findByIdAndUpdate(
    jobId,
    { $inc: { heldAmountKobo: -amountKobo }, status: 'REFUNDED' },
    { session }
  );
}
