import mongoose, { Schema, Document, Types } from 'mongoose';

export type LedgerEntryType =
  | 'FUNDS_RECEIVED'
  | 'FUNDS_HELD'
  | 'FUNDS_RELEASED'
  | 'FUNDS_REFUNDED';

export interface ILedgerEntry extends Document {
  jobId: Types.ObjectId;
  milestoneId?: Types.ObjectId;
  type: LedgerEntryType;
  amountKobo: number;
  debitAccount: string;
  creditAccount: string;
  reference: string;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone' },
    type: {
      type: String,
      enum: ['FUNDS_RECEIVED', 'FUNDS_HELD', 'FUNDS_RELEASED', 'FUNDS_REFUNDED'],
      required: true,
    },
    amountKobo: { type: Number, required: true },
    debitAccount: { type: String, required: true },
    creditAccount: { type: String, required: true },
    reference: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent any updates — ledger is append-only
LedgerEntrySchema.pre('save', function (next) {
  if (!this.isNew) return next(new Error('LedgerEntry is immutable'));
  next();
});

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
