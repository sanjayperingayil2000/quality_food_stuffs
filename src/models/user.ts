import mongoose, { Schema, Model } from 'mongoose';

export type UserRole = 'super_admin' | 'manager';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  roles: UserRole[];
  isActive: boolean;
  settingsAccess?: boolean;
  phone?: string;
  state?: string;
  city?: string;
  profilePhoto?: string;
  resetPasswordOtp?: string;
  resetPasswordOtpExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends mongoose.Document, IUser {}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], enum: ['super_admin', 'manager'], default: ['manager'], index: true },
    isActive: { type: Boolean, default: true },
    settingsAccess: { type: Boolean, default: false },
    phone: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    profilePhoto: { type: String },
    resetPasswordOtp: { type: String },
    resetPasswordOtpExpiry: { type: Date },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);


