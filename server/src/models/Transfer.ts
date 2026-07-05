import mongoose, { Schema, Document, Types } from 'mongoose';

export type TransferStatus = 'INITIATED' | 'SUCCESS' | 'FAILED';

export interface ITransfer extends Document {
  milestoneId: Types.ObjectId;
  jobId: Types.ObjectId;
  amountKobo: number;
  idempotencyKey: string;
  status: TransferStatus;
  bankReference?: string;
  failureReason?: string;
  initiatedAt: Date;
  settledAt?: Date;
}

const TransferSchema = new Schema<ITransfer>(
  {
    milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    amountKobo: { type: Number, required: true },
    idempotencyKey: { type: String, required: true, unique: true },
    status: { type: String, enum: ['INITIATED', 'SUCCESS', 'FAILED'], default: 'INITIATED' },
    bankReference: String,
    failureReason: String,
    initiatedAt: { type: Date, default: Date.now },
    settledAt: Date,
  },
  { timestamps: true }
);

export const Transfer = mongoose.model<ITransfer>('Transfer', TransferSchema);
