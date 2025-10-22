import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ISetting {
  key: string;
  value: unknown;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISettingDocument extends mongoose.Document, ISetting {}

const SettingSchema = new Schema<ISettingDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

SettingSchema.index({ key: 1 }, { unique: true });

export const Setting: Model<ISettingDocument> =
  mongoose.models.Setting || mongoose.model<ISettingDocument>('Setting', SettingSchema);


