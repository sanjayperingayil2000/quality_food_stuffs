import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { DailyTrip } from '@/models/daily-trip';
import { History } from '@/models/history';

export interface TripProduct {
  productId: string;
  productName: string;
  category: 'bakery' | 'fresh';
  quantity: number;
  unitPrice: number;
}

export interface TransferredProduct extends TripProduct {
  receivingDriverId: string;
  receivingDriverName: string;
  transferredFromDriverId: string;
  transferredFromDriverName: string;
}

export interface ProductTransfer {
  isProductTransferred: boolean;
  transferredProducts: TransferredProduct[];
}

export interface CreateDailyTripData {
  driverId: string;
  driverName: string;
  date: Date;
  products: TripProduct[];
  transfer: ProductTransfer;
  acceptedProducts?: TripProduct[];
  collectionAmount: number;
  purchaseAmount: number;
  expiry: number;
  discount: number;
  petrol: number;
  balance: number;
  totalAmount: number;
  netTotal: number;
  grandTotal: number;
  expiryAfterTax: number;
  amountToBe: number;
  salesDifference: number;
  profit: number;
  createdBy?: string;
}

export interface UpdateDailyTripData {
  driverId?: string;
  driverName?: string;
  date?: Date;
  products?: TripProduct[];
  transfer?: ProductTransfer;
  acceptedProducts?: TripProduct[];
  collectionAmount?: number;
  purchaseAmount?: number;
  expiry?: number;
  discount?: number;
  petrol?: number;
  balance?: number;
  totalAmount?: number;
  netTotal?: number;
  grandTotal?: number;
  expiryAfterTax?: number;
  amountToBe?: number;
  salesDifference?: number;
  profit?: number;
  updatedBy?: string;
}

export interface DailyTripFilters {
  driverId?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

export async function createDailyTrip(data: CreateDailyTripData) {
  await connectToDatabase();
  
  // Generate unique ID
  const count = await DailyTrip.countDocuments();
  const id = `TRP-${String(count + 1).padStart(3, '0')}`;
  
  const tripData = {
    ...data,
    id,
    acceptedProducts: data.acceptedProducts || [],
  };
  
  const trip = await DailyTrip.create(tripData);
  
  // Log to history
  await History.create({
    collectionName: 'dailyTrips',
    documentId: trip._id,
    action: 'create',
    actor: data.createdBy && Types.ObjectId.isValid(data.createdBy) ? new Types.ObjectId(data.createdBy) : undefined,
    before: null,
    after: trip.toObject(),
    timestamp: new Date(),
  });
  
  return trip.toObject();
}

export async function getDailyTrips(filters: DailyTripFilters = {}) {
  await connectToDatabase();
  
  const queryFilter: Record<string, unknown> = {};
  if (filters.driverId) queryFilter.driverId = filters.driverId;
  if (filters.date) queryFilter.date = filters.date;
  if (filters.startDate && filters.endDate) {
    queryFilter.date = {
      $gte: filters.startDate,
      $lte: filters.endDate
    };
  }
  
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const trips = await DailyTrip.find(queryFilter).sort({ date: -1, createdAt: -1 });
  return trips.map(trip => trip.toObject());
}

export async function getDailyTripById(id: string) {
  await connectToDatabase();
  
  const trip = await DailyTrip.findOne({ id });
  return trip ? trip.toObject() : null;
}

export async function updateDailyTrip(id: string, data: UpdateDailyTripData) {
  await connectToDatabase();
  
  const trip = await DailyTrip.findOne({ id });
  if (!trip) {
    throw new Error('Daily trip not found');
  }
  
  const beforeData = trip.toObject();
  
  const updatedTrip = await DailyTrip.findOneAndUpdate(
    { id },
    data,
    { new: true, runValidators: true }
  );
  
  // Log to history
  await History.create({
    collectionName: 'dailyTrips',
    documentId: trip._id,
    action: 'update',
    actor: data.updatedBy && Types.ObjectId.isValid(data.updatedBy) ? new Types.ObjectId(data.updatedBy) : undefined,
    before: beforeData,
    after: updatedTrip?.toObject(),
    timestamp: new Date(),
  });
  
  return updatedTrip?.toObject();
}

export async function deleteDailyTrip(id: string, deletedBy?: string) {
  await connectToDatabase();
  
  const trip = await DailyTrip.findOne({ id });
  if (!trip) {
    throw new Error('Daily trip not found');
  }
  
  const beforeData = trip.toObject();
  await DailyTrip.findOneAndDelete({ id });
  
  // Log to history
  await History.create({
    collectionName: 'dailyTrips',
    documentId: trip._id,
    action: 'delete',
    actor: deletedBy && Types.ObjectId.isValid(deletedBy) ? new Types.ObjectId(deletedBy) : undefined,
    before: beforeData,
    after: null,
    timestamp: new Date(),
  });
  
  return { message: 'Daily trip deleted successfully' };
}

export async function getTripsByDriver(driverId: string, startDate?: Date, endDate?: Date) {
  await connectToDatabase();
  
  const queryFilter: Record<string, unknown> = { driverId };
  if (startDate && endDate) {
    queryFilter.date = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const trips = await DailyTrip.find(queryFilter).sort({ date: -1 });
  return trips.map(trip => trip.toObject());
}

export async function getTripsByDateRange(startDate: Date, endDate: Date) {
  await connectToDatabase();
  
  const trips = await DailyTrip.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
  
  return trips.map(trip => trip.toObject());
}
