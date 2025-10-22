import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ICalculation {
  userId?: Types.ObjectId;
  contextName: string;
  inputs: Record<string, unknown>;
  results?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICalculationDocument extends mongoose.Document, ICalculation {}

const CalculationSchema = new Schema<ICalculationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    contextName: { type: String, required: true, index: true },
    inputs: { type: Schema.Types.Mixed, required: true },
    results: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

CalculationSchema.index({ contextName: 1, createdAt: -1 });

export const Calculation: Model<ICalculationDocument> =
  mongoose.models.Calculation || mongoose.model<ICalculationDocument>('Calculation', CalculationSchema);


