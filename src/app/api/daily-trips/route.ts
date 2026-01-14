import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { withCors } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { DailyTrip } from '@/models/daily-trip';
import { updateEmployee as updateEmployeeService, updateDriverDue } from '@/services/employee-service';
import { History } from '@/models/history';
import { Types } from 'mongoose';

const tripProductSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  category: z.enum(['bakery', 'fresh']),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  displayNumber: z.string().optional(),
});

const transferredProductSchema = tripProductSchema.extend({
  receivingDriverId: z.string().min(1),
  receivingDriverName: z.string().min(1),
  transferredFromDriverId: z.string().min(1),
  transferredFromDriverName: z.string().min(1),
});

const productTransferSchema = z.object({
  isProductTransferred: z.boolean(),
  transferredProducts: z.array(transferredProductSchema),
});

const dailyTripCreateSchema = z.object({
  driverId: z.string().min(1, 'Driver ID is required'),
  driverName: z.string().min(1, 'Driver name is required'),
  date: z.string().transform(str => new Date(str)),
  products: z.array(tripProductSchema),
  transfer: productTransferSchema,
  acceptedProducts: z.array(tripProductSchema).optional().default([]),
  previousBalance: z.number().min(0),
  collectionAmount: z.number().min(0),
  actualCollectionAmount: z.number().min(0).optional(),
  due: z.number().optional(),
  purchaseAmount: z.number().min(0),
  expiry: z.number().min(0),
  discount: z.number().min(0),
  petrol: z.number().min(0),
  balance: z.number(),
  totalAmount: z.number().min(0),
  netTotal: z.number().min(0),
  grandTotal: z.number().min(0),
  expiryAfterTax: z.number().min(0),
  amountToBe: z.number(),
  salesDifference: z.number(),
  profit: z.number(),
});

// Schema for updates (used in [id]/route.ts)
const _dailyTripUpdateSchema = dailyTripCreateSchema.partial();

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    const user = getRequestUser(authed);
    const isDriver = user?.roles?.includes('driver') && !user?.roles?.includes('super_admin') && !user?.roles?.includes('manager');
    
    const url = new URL(req.url);
    const driverId = url.searchParams.get('driverId');
    const date = url.searchParams.get('date');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    const queryFilter: Record<string, unknown> = {};
    
    // If user is a driver, filter by their employeeId
    if (isDriver && user?.employeeId) {
      queryFilter.driverId = user.employeeId;
    } else if (driverId) {
      queryFilter.driverId = driverId;
    }
    
    if (date) queryFilter.date = new Date(date);
    if (startDate && endDate) {
      queryFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // eslint-disable-next-line unicorn/no-array-callback-reference
    const trips = await DailyTrip.find(queryFilter).sort({ date: -1, createdAt: -1 });
    return withCors(NextResponse.json({ trips }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function POST(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const body = await req.json();
    const parsed = dailyTripCreateSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    // Generate unique ID - find the highest existing ID number to avoid duplicates
    // Get all trips and find the highest numeric ID
    const allTrips = await DailyTrip.find({}, { id: 1 }).lean();
    let maxIdNumber = 0;
    for (const trip of allTrips) {
      if (trip.id) {
        const match = trip.id.match(/TRP-(\d+)/);
        if (match) {
          const idNumber = parseInt(match[1], 10);
          if (idNumber > maxIdNumber) {
            maxIdNumber = idNumber;
          }
        }
      }
    }
    const nextIdNumber = maxIdNumber + 1;
    const id = `TRP-${String(nextIdNumber).padStart(3, '0')}`;
    
    const tripData = {
      ...parsed.data,
      id,
      createdBy: user?.sub,
      updatedBy: user?.sub,
    };
    
    const trip = await DailyTrip.create(tripData);

    // After creating the trip, update the driver's current balance in employees
    // Only update if this is the latest trip for the driver
    try {
      const tripDate = parsed.data.date instanceof Date
        ? parsed.data.date
        : new Date(parsed.data.date as unknown as string);
      
      // Find the latest trip for this driver (by date, then by createdAt)
      const latestTrip = await DailyTrip.findOne({ driverId: parsed.data.driverId }).sort({ date: -1, createdAt: -1 });
      
      // Only update balance if this new trip is the latest one
      if (!latestTrip || String(latestTrip._id) === String(trip._id)) {
        const yyyy = tripDate.getFullYear();
        const mm = String(tripDate.getMonth() + 1).padStart(2, '0');
        const dd = String(tripDate.getDate()).padStart(2, '0');
        const reason = `Daily trip on ${yyyy}-${mm}-${dd}`;

        await updateEmployeeService(parsed.data.driverId, {
          balance: parsed.data.balance,
          updatedBy: user?.sub,
          balanceUpdateReason: reason,
        });
      }
      
      // Update driver due if actualCollectionAmount and due are provided
      if (parsed.data.actualCollectionAmount !== undefined && parsed.data.actualCollectionAmount !== null && parsed.data.due !== undefined && parsed.data.due !== null) {
        await updateDriverDue(
          parsed.data.driverId,
          parsed.data.due,
          tripDate,
          id,
          user?.sub
        );
      }
    } catch (balanceUpdateError) {
      // Do not fail trip creation on balance sync error; it will be handled separately
      console.error('Failed to sync driver balance/due after trip creation:', balanceUpdateError);
    }
    
    // Log to history
    await History.create({
      collectionName: 'dailyTrips',
      documentId: trip._id,
      action: 'create',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: null,
      after: trip.toObject(),
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ trip }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}
