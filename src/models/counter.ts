import mongoose, { Schema } from 'mongoose';

interface ICounterDocument extends mongoose.Document {
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounterDocument>({
  key: { type: String, required: true, unique: true, index: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = (mongoose.models.Counter as mongoose.Model<ICounterDocument>)
  || mongoose.model<ICounterDocument>('Counter', CounterSchema);

export async function getNextSequence(key: string): Promise<number> {
  const result = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
}

// Ensure the counter is at least a minimum value (useful when seeding after existing data)
export async function ensureCounterMinValue(key: string, minValue: number): Promise<void> {
  await Counter.findOneAndUpdate(
    { key },
    {
      $setOnInsert: { key, seq: minValue },
      $max: { seq: minValue },
    },
    { upsert: true, new: false }
  );
}


