import { connectToDatabase } from '@/lib/db';
import { History } from '@/models/history';
import { IUserDocument } from '@/models/user';

export type HistoryFilters = Partial<{
  collectionName: string;
  documentId: string;
  action: string;
}>;

export interface HistoryItem {
  _id: string;
  collectionName: string;
  documentId?: string;
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  actor: string; // populated actor name
  timestamp: Date;
}

/**
 * Fetch history items with optional filters and populate actor field.
 */
export async function listHistory(filters: HistoryFilters): Promise<HistoryItem[]> {
  await connectToDatabase();

  const query: HistoryFilters = {};
  if (filters.collectionName) query.collectionName = filters.collectionName;
  if (filters.documentId) query.documentId = filters.documentId;
  if (filters.action) query.action = filters.action;

  // Fetch from MongoDB and populate actor
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const rawItems = await History.find(query)
    .sort({ timestamp: -1 })
    .populate<{ actor: IUserDocument }>('actor', 'name email')
    .lean(); // returns unknown[]

  // Map to strict HistoryItem[]
  const items: HistoryItem[] = rawItems.map((item: unknown) => {
    const typedItem = item as Record<string, unknown>;
    return {
      _id: (typedItem._id as string).toString(),
      collectionName: typedItem.collectionName as string,
      documentId: typedItem.documentId as string,
      action: typedItem.action as string,
      before: typedItem.before as Record<string, unknown>,
      after: typedItem.after as Record<string, unknown>,
      actor:
        typedItem.actor && typeof typedItem.actor === 'object' && 'name' in typedItem.actor
          ? (typedItem.actor as { name: string }).name
          : 'Unknown',
      timestamp: typedItem.timestamp as Date,
    };
  });

  return items;
}

/**
 * Fetch history items for a specific document.
 */
export async function listHistoryForDocument(
  collectionName: string,
  documentId: string
): Promise<HistoryItem[]> {
  await connectToDatabase();

  const rawItems = await History.find({ collectionName, documentId })
    .sort({ timestamp: -1 })
    .populate<{ actor: IUserDocument }>('actor', 'name email')
    .lean(); // returns unknown[]

  const items: HistoryItem[] = rawItems.map((item: unknown) => {
    const typedItem = item as Record<string, unknown>;
    return {
      _id: (typedItem._id as string).toString(),
      collectionName: typedItem.collectionName as string,
      documentId: typedItem.documentId as string,
      action: typedItem.action as string,
      before: typedItem.before as Record<string, unknown>,
      after: typedItem.after as Record<string, unknown>,
      actor:
        typedItem.actor && typeof typedItem.actor === 'object' && 'name' in typedItem.actor
          ? (typedItem.actor as { name: string }).name
          : 'Unknown',
      timestamp: typedItem.timestamp as Date,
    };
  });

  return items;
}
