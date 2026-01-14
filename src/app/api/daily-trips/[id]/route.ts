import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { withCors } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { DailyTrip } from '@/models/daily-trip';
import { Employee } from '@/models/employee';
import { History } from '@/models/history';
import { Types } from 'mongoose';
import { updateEmployee as updateEmployeeService, updateDriverDue } from '@/services/employee-service';

const tripProductSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  category: z.enum(['bakery', 'fresh']),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
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

const dailyTripUpdateSchema = z.object({
  driverId: z.string().min(1).optional(),
  driverName: z.string().min(1).optional(),
  date: z.string().transform(str => new Date(str)).optional(),
  products: z.array(tripProductSchema).optional(),
  transfer: productTransferSchema.optional(),
  acceptedProducts: z.array(tripProductSchema).optional(),
  previousBalance: z.number().min(0).optional(),
  collectionAmount: z.number().min(0).optional(),
  actualCollectionAmount: z.number().min(0).optional(),
  due: z.number().optional(),
  purchaseAmount: z.number().min(0).optional(),
  expiry: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  petrol: z.number().min(0).optional(),
  balance: z.number().optional(),
  totalAmount: z.number().min(0).optional(),
  netTotal: z.number().min(0).optional(),
  grandTotal: z.number().min(0).optional(),
  expiryAfterTax: z.number().min(0).optional(),
  amountToBe: z.number().optional(),
  salesDifference: z.number().optional(),
  profit: z.number().optional(),
}).partial();

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    await connectToDatabase();
    
    const trip = await DailyTrip.findOne({ id });
    if (!trip) {
      return withCors(NextResponse.json({ error: 'Daily trip not found' }, { status: 404 }));
    }
    
    return withCors(NextResponse.json({ trip }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = dailyTripUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const trip = await DailyTrip.findOne({ id });
    if (!trip) {
      return withCors(NextResponse.json({ error: 'Daily trip not found' }, { status: 404 }));
    }
    
    const beforeData = trip.toObject();
    const updateData = {
      ...parsed.data,
      updatedBy: user?.sub,
    };
    
    const updatedTrip = await DailyTrip.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );
    
    // Sync employee balance - only update if this is the latest trip for the driver
    try {
      if (updatedTrip?.balance !== undefined) {
        const driverId = updatedTrip.driverId;
        // Find the latest trip for this driver (by date, then by createdAt)
        const latestTrip = await DailyTrip.findOne({ driverId }).sort({ date: -1, createdAt: -1 });
        
        // Only update balance if this edited trip is the latest one
        if (latestTrip && latestTrip.id === id) {
          const tripDate = updatedTrip.date instanceof Date ? updatedTrip.date : new Date(updatedTrip.date);
          const yyyy = tripDate.getFullYear();
          const mm = String(tripDate.getMonth() + 1).padStart(2, '0');
          const dd = String(tripDate.getDate()).padStart(2, '0');
          const reason = `Daily trip updated on ${yyyy}-${mm}-${dd}`;
          await updateEmployeeService(driverId, {
            balance: updatedTrip.balance,
            updatedBy: user?.sub,
            balanceUpdateReason: reason,
          });
        }
      }
      
      // Update driver due if actualCollectionAmount and due are provided
      if (updatedTrip?.actualCollectionAmount !== undefined && updatedTrip?.actualCollectionAmount !== null && updatedTrip?.due !== undefined && updatedTrip?.due !== null) {
        const tripDate = updatedTrip.date instanceof Date ? updatedTrip.date : new Date(updatedTrip.date);
        // Check if this trip already has a due entry in history
        const employee = await Employee.findOne({ id: updatedTrip.driverId });
        const existingDueEntry = employee?.dueHistory?.find(entry => entry.tripId === id);
        
        // Only add if it doesn't exist, or update if the due value changed
        if (!existingDueEntry || existingDueEntry.due !== updatedTrip.due) {
          // If it exists, we need to recalculate the total due
          if (existingDueEntry) {
            // Remove old due and add new due
            const oldDue = existingDueEntry.due;
            const currentDueTotal = employee?.due || 0;
            const newDueTotal = currentDueTotal - oldDue + updatedTrip.due;
            
            // Update the dueHistory entry
            await Employee.findOneAndUpdate(
              { id: updatedTrip.driverId, 'dueHistory.tripId': id },
              {
                $set: {
                  'dueHistory.$.due': updatedTrip.due,
                  'dueHistory.$.updatedAt': new Date(),
                  due: newDueTotal,
                },
                updatedBy: user?.sub,
              }
            );
          } else {
            // Add new due entry
            await updateDriverDue(
              updatedTrip.driverId,
              updatedTrip.due,
              tripDate,
              id,
              user?.sub
            );
          }
        }
      }
    } catch (balanceUpdateError) {
      console.error('Failed to sync driver balance/due after trip update:', balanceUpdateError);
    }
    
    // Update receiving driver trips if transfer products were updated
    try {
      if (updatedTrip?.transfer?.isProductTransferred && updatedTrip.transfer.transferredProducts && updatedTrip.transfer.transferredProducts.length > 0) {
        const tripDate = updatedTrip.date instanceof Date ? updatedTrip.date : new Date(updatedTrip.date);
        const tripDateStr = tripDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Group transfer products by receiving driver
        const productsByDriver = updatedTrip.transfer.transferredProducts.reduce((acc, product) => {
          if (!acc[product.receivingDriverId]) {
            acc[product.receivingDriverId] = [];
          }
          acc[product.receivingDriverId].push({
            productId: product.productId,
            productName: product.productName,
            category: product.category,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
          });
          return acc;
        }, {} as Record<string, Array<{ productId: string; productName: string; category: string; quantity: number; unitPrice: number }>>);
        
        // Update each receiving driver's trip
        for (const [receivingDriverId, transferProducts] of Object.entries(productsByDriver)) {
          // Find the receiving driver's trip on the same date
          const receivingDriverTrip = await DailyTrip.findOne({
            driverId: receivingDriverId,
            date: {
              $gte: new Date(tripDateStr + 'T00:00:00.000Z'),
              $lt: new Date(tripDateStr + 'T23:59:59.999Z'),
            },
          });
          
          if (receivingDriverTrip) {
            // Get existing accepted products that are NOT from the transferring driver
            const existingAcceptedProducts = (receivingDriverTrip.acceptedProducts || []).filter(
              (ap: { productId: string; quantity: number; unitPrice: number; transferredFromDriverId?: string }) =>
                ap.transferredFromDriverId !== updatedTrip.driverId
            );
            
            // Create a Set of existing product keys for quick lookup (including unitPrice)
            const existingProductKeys = new Set(
              existingAcceptedProducts.map((p: { productId: string; quantity: number; unitPrice: number; transferredFromDriverId?: string }) =>
                `${p.productId}-${p.quantity}-${p.transferredFromDriverId || ''}-${p.unitPrice}`
              )
            );
            
            // Add NEW transfer products from the updated trip
            const newAcceptedProducts = transferProducts
              .filter(product => {
                const productKey = `${product.productId}-${product.quantity}-${updatedTrip.driverId}-${product.unitPrice}`;
                return !existingProductKeys.has(productKey);
              })
              .map(product => ({
                ...product,
                transferredFromDriverId: updatedTrip.driverId,
                transferredFromDriverName: updatedTrip.driverName,
              }));
            
            // Combine and deduplicate
            const combinedAcceptedProducts = [...existingAcceptedProducts, ...newAcceptedProducts];
            const uniqueAcceptedProducts = [...new Map(
              combinedAcceptedProducts.map((p: { productId: string; quantity: number; unitPrice: number; transferredFromDriverId?: string }) => [
                `${p.productId}-${p.quantity}-${p.transferredFromDriverId || ''}-${p.unitPrice}`,
                p
              ])
            ).values()];
            
            // Update the receiving driver's trip
            await DailyTrip.findOneAndUpdate(
              { id: receivingDriverTrip.id },
              {
                acceptedProducts: uniqueAcceptedProducts,
                updatedBy: user?.sub,
              },
              { new: true, runValidators: true }
            );
          }
        }
      }
    } catch (transferUpdateError) {
      console.error('Failed to update receiving driver trips after transfer update:', transferUpdateError);
      // Don't fail the request if this fails
    }
    
    // Log to history
    await History.create({
      collectionName: 'dailyTrips',
      documentId: trip._id,
      action: 'update',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: beforeData,
      after: updatedTrip?.toObject(),
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ trip: updatedTrip }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    console.log('Attempting to delete daily trip with ID:', id);
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const trip = await DailyTrip.findOne({ id });
    console.log('Found trip:', trip);
    if (!trip) {
      console.log('Trip not found for ID:', id);
      return withCors(NextResponse.json({ error: 'Daily trip not found' }, { status: 404 }));
    }
    
    const beforeData = trip.toObject();
    console.log('Before data:', beforeData);
    const deleteResult = await DailyTrip.findOneAndDelete({ id });
    console.log('Delete result:', deleteResult);

    // After deletion, recalculate driver's balance and remove due entry
    try {
      const driverId = trip.driverId;
      const latestRemainingTrip = await DailyTrip.findOne({ driverId }).sort({ date: -1, createdAt: -1 });
      const newBalance = latestRemainingTrip?.balance ?? 0;

      const tripDate = trip.date instanceof Date ? trip.date : new Date(trip.date);
      const yyyy = tripDate.getFullYear();
      const mm = String(tripDate.getMonth() + 1).padStart(2, '0');
      const dd = String(tripDate.getDate()).padStart(2, '0');
      const reason = `Daily trip on ${yyyy}-${mm}-${dd} deleted`;

      // Update balance
      await updateEmployeeService(driverId, {
        balance: newBalance,
        updatedBy: user?.sub,
        balanceUpdateReason: reason,
      });

      // Remove due entry for this trip if it exists
      const employee = await Employee.findOne({ id: driverId });
      if (employee && employee.dueHistory && employee.dueHistory.length > 0) {
        const dueEntryToRemove = employee.dueHistory.find(entry => entry.tripId === id);
        
        if (dueEntryToRemove) {
          // Remove the due entry from history
          const updatedDueHistory = employee.dueHistory.filter(entry => entry.tripId !== id);
          
          // Recalculate total due by summing all remaining due entries
          const newTotalDue = updatedDueHistory.reduce((sum, entry) => sum + (entry.due || 0), 0);
          
          // Update employee with new dueHistory and recalculated total due
          const updatedEmployee = await Employee.findOneAndUpdate(
            { id: driverId },
            {
              due: newTotalDue,
              dueHistory: updatedDueHistory,
              updatedBy: user?.sub,
            },
            { new: true, runValidators: true }
          );

          // Log to history
          await History.create({
            collectionName: 'employees',
            documentId: employee._id,
            action: 'update',
            actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
            before: employee.toObject(),
            after: updatedEmployee?.toObject() || null,
            timestamp: new Date(),
          });
        }
      }
    } catch (balanceUpdateError) {
      console.error('Failed to sync driver balance/due after trip deletion:', balanceUpdateError);
    }
    
    // Log to history
    await History.create({
      collectionName: 'dailyTrips',
      documentId: trip._id,
      action: 'delete',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: beforeData,
      after: null,
      timestamp: new Date(),
    });
    
    console.log('Daily trip deleted successfully');
    return withCors(NextResponse.json({ message: 'Daily trip deleted successfully' }, { status: 200 }));
  } catch (error) {
    console.error('Error deleting daily trip:', error);
    return withCors(jsonError(error, 500));
  }
}
