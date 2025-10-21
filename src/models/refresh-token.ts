import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IRefreshToken {
  userId: Types.ObjectId;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revoked: boolean;
  deviceInfo?: string;
}

export interface IRefreshTokenDocument extends mongoose.Document, IRefreshToken {}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    revoked: { type: Boolean, default: false },
    deviceInfo: { type: String },
  },
  { timestamps: false }
);

RefreshTokenSchema.index({ userId: 1, tokenHash: 1 }, { unique: true });

export const RefreshToken: Model<IRefreshTokenDocument> =
  mongoose.models.RefreshToken || mongoose.model<IRefreshTokenDocument>('RefreshToken', RefreshTokenSchema);


