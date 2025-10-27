import { connectToDatabase } from '@/lib/db';
import { History } from '@/models/history';
import { IUserDocument } from '@/models/user';
import { getUserById } from './user-service';

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

  // Map to strict HistoryItem[] and manually fetch user names if needed
  const items: HistoryItem[] = await Promise.all(rawItems.map(async (item: unknown) => {
    const typedItem = item as Record<string, unknown>;
    
    let actorName = 'Unknown';
    
    // Try to get actor name from populated field first
    if (typedItem.actor && typeof typedItem.actor === 'object' && 'name' in typedItem.actor) {
      actorName = (typedItem.actor as { name: string }).name;
    } else if (typedItem.actor && typeof typedItem.actor === 'string') {
      // If actor is a string (ObjectId), try to fetch user name manually
      try {
        const user = await getUserById(typedItem.actor);
        if (user) {
          actorName = user.name;
        }
      } catch (error) {
        console.warn('Failed to fetch user name for actor:', typedItem.actor, error);
      }
    }
    
    return {
      _id: (typedItem._id as string).toString(),
      collectionName: typedItem.collectionName as string,
      documentId: typedItem.documentId as string,
      action: typedItem.action as string,
      before: typedItem.before as Record<string, unknown>,
      after: typedItem.after as Record<string, unknown>,
      actor: actorName,
      timestamp: typedItem.timestamp as Date,
    };
  }));

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

  const items: HistoryItem[] = await Promise.all(rawItems.map(async (item: unknown) => {
    const typedItem = item as Record<string, unknown>;
    
    let actorName = 'Unknown';
    
    // Try to get actor name from populated field first
    if (typedItem.actor && typeof typedItem.actor === 'object' && 'name' in typedItem.actor) {
      actorName = (typedItem.actor as { name: string }).name;
    } else if (typedItem.actor && typeof typedItem.actor === 'string') {
      // If actor is a string (ObjectId), try to fetch user name manually
      try {
        const user = await getUserById(typedItem.actor);
        if (user) {
          actorName = user.name;
        }
      } catch (error) {
        console.warn('Failed to fetch user name for actor:', typedItem.actor, error);
      }
    }
    
    return {
      _id: (typedItem._id as string).toString(),
      collectionName: typedItem.collectionName as string,
      documentId: typedItem.documentId as string,
      action: typedItem.action as string,
      before: typedItem.before as Record<string, unknown>,
      after: typedItem.after as Record<string, unknown>,
      actor: actorName,
      timestamp: typedItem.timestamp as Date,
    };
  }));

  return items;
}
