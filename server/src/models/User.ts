import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN';

export interface IUser extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  roles: UserRole[];
  bankAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  notificationPrefs?: {
    milestoneComplete: { email: boolean; push: boolean };
    milestoneApproved: { email: boolean; push: boolean };
    projectFunded: { email: boolean; push: boolean };
    newInvitation: { email: boolean; push: boolean };
    paymentReleased: { email: boolean; push: boolean };
    paymentReceived: { email: boolean; push: boolean };
    escrowLowBalance: { email: boolean; push: boolean };
    disputeUpdate: { email: boolean; push: boolean };
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], enum: ['CLIENT', 'PROVIDER', 'ADMIN'], default: ['CLIENT'] },
    bankAccountNumber: String,
    bankCode: String,
    bankName: String,
    location: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    avatar: { type: String },
    notificationPrefs: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
