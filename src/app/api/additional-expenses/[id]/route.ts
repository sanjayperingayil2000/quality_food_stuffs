import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { withCors } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { AdditionalExpense } from '@/models/additional-expense';
import { History } from '@/models/history';
import { Types } from 'mongoose';

const additionalExpenseUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(['petrol', 'maintenance', 'variance', 'salary', 'others']).optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().optional(),
  date: z.string().transform(str => new Date(str)).optional(),
  driverId: z.string().optional(),
  driverName: z.string().optional(),
  designation: z.enum(['driver', 'manager', 'ceo', 'staff']).optional(),
  receiptNumber: z.string().optional(),
  vendor: z.string().optional(),
  isReimbursable: z.boolean().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().transform(str => new Date(str)).optional(),
  rejectedReason: z.string().optional(),
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
    
    const expense = await AdditionalExpense.findById(id);
    if (!expense) {
      return withCors(NextResponse.json({ error: 'Additional expense not found' }, { status: 404 }));
    }
    
    const transformedExpense = {
      ...expense.toObject(),
      id: (expense._id as unknown as string).toString(),
    };
    
    return withCors(NextResponse.json({ expense: transformedExpense }, { status: 200 }));
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
    const parsed = additionalExpenseUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const expense = await AdditionalExpense.findById(id);
    if (!expense) {
      return withCors(NextResponse.json({ error: 'Additional expense not found' }, { status: 404 }));
    }
    
    const beforeData = expense.toObject();
    const updateData = {
      ...parsed.data,
      updatedBy: user?.sub,
    };
    
    const updatedExpense = await AdditionalExpense.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Log to history
    await History.create({
      collectionName: 'additionalExpenses',
      documentId: expense._id,
      action: 'update',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: beforeData,
      after: updatedExpense?.toObject(),
      timestamp: new Date(),
    });
    
    const transformedExpense = {
      ...updatedExpense?.toObject(),
      id: (updatedExpense?._id as unknown as string).toString(),
    };
    
    return withCors(NextResponse.json({ expense: transformedExpense }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    console.log('Received DELETE request for additional expense with id:', id);
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const expense = await AdditionalExpense.findById(id);
    if (!expense) {
      return withCors(NextResponse.json({ error: 'Additional expense not found' }, { status: 404 }));
    }
    
    const beforeData = expense.toObject();
    await AdditionalExpense.findByIdAndDelete(id);
    
    // Log to history
    await History.create({
      collectionName: 'additionalExpenses',
      documentId: expense._id,
      action: 'delete',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: beforeData,
      after: null,
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ message: 'Additional expense deleted successfully' }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}