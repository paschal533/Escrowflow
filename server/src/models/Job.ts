import mongoose, { Schema, Document, Types } from 'mongoose';

export type JobStatus =
  | 'CREATED'
  | 'FUNDING_PENDING'
  | 'FUNDED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'CANCELLED';

export interface IJob extends Document {
  title: string;
  description: string;
  clientId: Types.ObjectId;
  providerId: Types.ObjectId;
  totalAmountKobo: number;
  heldAmountKobo: number;
  releasedAmountKobo: number;
  status: JobStatus;
  virtualAccountNumber?: string;
  virtualAccountBank?: string;
  virtualAccountReference?: string;
  category?: 'CONSTRUCTION' | 'DESIGN' | 'PHOTOGRAPHY' | 'TECHNOLOGY' | 'INTERIOR' | 'OTHER';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalAmountKobo: { type: Number, required: true, min: 1 },
    heldAmountKobo: { type: Number, default: 0 },
    releasedAmountKobo: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        'CREATED',
        'FUNDING_PENDING',
        'FUNDED',
        'IN_PROGRESS',
        'COMPLETED',
        'DISPUTED',
        'REFUND_PENDING',
        'REFUNDED',
        'CANCELLED',
      ],
      default: 'CREATED',
    },
    virtualAccountNumber: String,
    virtualAccountBank: String,
    virtualAccountReference: String,
    category: { type: String, enum: ['CONSTRUCTION', 'DESIGN', 'PHOTOGRAPHY', 'TECHNOLOGY', 'INTERIOR', 'OTHER'] },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const Job = mongoose.model<IJob>('Job', JobSchema);
