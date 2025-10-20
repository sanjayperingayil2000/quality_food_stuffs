import mongoose, { Schema, Model } from 'mongoose';

export type UserRole = 'super_admin' | 'manager';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  roles: UserRole[];
  isActive: boolean;
  settingsAccess?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends mongoose.Document, IUser {}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], enum: ['super_admin', 'manager'], default: ['manager'], index: true },
    isActive: { type: Boolean, default: true },
    settingsAccess: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);


