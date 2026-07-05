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
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
