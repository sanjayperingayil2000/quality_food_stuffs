import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Calculation } from '@/models/Calculation';
import { History } from '@/models/History';

export async function createCalculation(payload: {
  userId?: string;
  contextName: string;
  inputs: Record<string, unknown>;
  results?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  await connectToDatabase();
  const created = await Calculation.create({
    userId: payload.userId && Types.ObjectId.isValid(payload.userId) ? new Types.ObjectId(payload.userId) : undefined,
    contextName: payload.contextName,
    inputs: payload.inputs,
    results: payload.results,
    metadata: payload.metadata,
  });

  await History.create({
    collectionName: 'calculations',
    documentId: created._id,
    action: 'create',
    actor: payload.userId && Types.ObjectId.isValid(payload.userId) ? new Types.ObjectId(payload.userId) : undefined,
    before: null,
    after: created.toObject(),
    timestamp: new Date(),
  });

  return created.toObject();
}

export async function listCalculations(filters: Partial<{ contextName: string; userId: string }>) {
  await connectToDatabase();
  const query: Record<string, unknown> = {};
  if (filters.contextName) query.contextName = filters.contextName;
  if (filters.userId && Types.ObjectId.isValid(filters.userId)) query.userId = new Types.ObjectId(filters.userId);
  return Calculation.find(query).sort({ createdAt: -1 }).lean();
}

export async function getCalculation(id: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  return Calculation.findById(id).lean();
}

export async function updateCalculation(id: string, updates: Partial<{ inputs: Record<string, unknown>; results: Record<string, unknown>; metadata: Record<string, unknown> }>, actorId?: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  const before = await Calculation.findById(id).lean();
  const updated = await Calculation.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  if (before && updated) {
    await History.create({
      collectionName: 'calculations',
      documentId: id,
      action: 'update',
      actor: actorId && Types.ObjectId.isValid(actorId) ? new Types.ObjectId(actorId) : undefined,
      before,
      after: updated,
      timestamp: new Date(),
    });
  }
  return updated;
}

export async function deleteCalculation(id: string, actorId?: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  const before = await Calculation.findById(id).lean();
  const deleted = await Calculation.findByIdAndDelete(id).lean();
  if (before) {
    await History.create({
      collectionName: 'calculations',
      documentId: id,
      action: 'delete',
      actor: actorId && Types.ObjectId.isValid(actorId) ? new Types.ObjectId(actorId) : undefined,
      before,
      after: null,
      timestamp: new Date(),
    });
  }
  return deleted;
}


