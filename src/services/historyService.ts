import { connectToDatabase } from '@/lib/db';
import { History } from '@/models/History';

export async function listHistory(filters: Partial<{ collectionName: string; documentId: string; action: string }>) {
  await connectToDatabase();
  const query: Record<string, unknown> = {};
  if (filters.collectionName) query.collectionName = filters.collectionName;
  if (filters.documentId) query.documentId = filters.documentId;
  if (filters.action) query.action = filters.action;
  return History.find(query).sort({ timestamp: -1 }).lean();
}

export async function listHistoryForDocument(collectionName: string, documentId: string) {
  await connectToDatabase();
  return History.find({ collectionName, documentId }).sort({ timestamp: -1 }).lean();
}


