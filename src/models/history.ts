import mongoose, { Schema, Model, Types } from 'mongoose';

export type HistoryAction = 'create' | 'update' | 'delete';

export interface IHistory {
  collectionName: string;
  documentId: Types.ObjectId | string;
  action: HistoryAction;
  actor?: Types.ObjectId;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: Date;
}

export interface IHistoryDocument extends mongoose.Document, IHistory {}

const HistorySchema = new Schema<IHistoryDocument>(
  {
    collectionName: { type: String, required: true, index: true },
    documentId: { type: Schema.Types.Mixed, required: true, index: true },
    action: { type: String, enum: ['create', 'update', 'delete'], required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

HistorySchema.index({ collectionName: 1, documentId: 1, timestamp: -1 });

export const History: Model<IHistoryDocument> =
  mongoose.models.History || mongoose.model<IHistoryDocument>('History', HistorySchema);


