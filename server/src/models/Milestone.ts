import mongoose, { Schema, Document, Types } from 'mongoose';

export type MilestoneStatus =
  | 'PENDING'
  | 'PROVIDER_MARKED_COMPLETE'
  | 'APPROVED'
  | 'TRANSFER_INITIATED'
  | 'TRANSFER_SUCCESS'
  | 'TRANSFER_FAILED'
  | 'DISPUTED'
  | 'REFUNDED';

export interface IMilestone extends Document {
  jobId: Types.ObjectId;
  title: string;
  description: string;
  amountKobo: number;
  order: number;
  status: MilestoneStatus;
  evidenceUrls: string[];
  approvedAt?: Date;
  completedAt?: Date;
  autoReleaseAt?: Date;
}

const MilestoneSchema = new Schema<IMilestone>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    amountKobo: { type: Number, required: true, min: 1 },
    order: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        'PENDING',
        'PROVIDER_MARKED_COMPLETE',
        'APPROVED',
        'TRANSFER_INITIATED',
        'TRANSFER_SUCCESS',
        'TRANSFER_FAILED',
        'DISPUTED',
        'REFUNDED',
      ],
      default: 'PENDING',
    },
    evidenceUrls: { type: [String], default: [] },
    approvedAt: Date,
    completedAt: Date,
    autoReleaseAt: Date,
  },
  { timestamps: true }
);

export const Milestone = mongoose.model<IMilestone>('Milestone', MilestoneSchema);
