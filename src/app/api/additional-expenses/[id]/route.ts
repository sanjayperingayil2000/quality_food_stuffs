import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/errorHandler';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { connectToDatabase } from '@/lib/db';
import { AdditionalExpense } from '@/models/AdditionalExpense';
import { z as zod } from 'zod';

export async function OPTIONS() {
  return handleCorsPreflight();
}

const updateExpenseSchema = zod.object({
  title: zod.string().min(1).optional(),
  description: zod.string().optional(),
  category: zod.enum(['petrol', 'maintenance', 'variance', 'salary', 'others']).optional(),
  amount: zod.number().min(0).optional(),
  currency: zod.string().optional(),
  date: zod.string().transform((str) => new Date(str)).optional(),
  driverId: zod.string().optional(),
  driverName: zod.string().optional(),
  designation: zod.enum(['driver', 'manager', 'ceo', 'staff']).optional(),
  receiptNumber: zod.string().optional(),
  vendor: zod.string().optional(),
  isReimbursable: zod.boolean().optional(),
  status: zod.enum(['pending', 'approved', 'rejected']).optional(),
  approvedBy: zod.string().optional(),
  approvedAt: zod.string().transform((str) => new Date(str)).optional(),
  rejectedReason: zod.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const expense = await AdditionalExpense.findById(id).lean();
    
    if (!expense) {
      return withCors(NextResponse.json({ error: 'Expense not found' }, { status: 404 }));
    }
    
    return withCors(NextResponse.json({ expense }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);
    
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    const user = getRequestUser(authed);
    if (!user) {
      return withCors(NextResponse.json({ error: 'User not found' }, { status: 401 }));
    }
    
    const expense = await AdditionalExpense.findByIdAndUpdate(
      id,
      {
        ...parsed.data,
        updatedBy: user.sub,
      },
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return withCors(NextResponse.json({ error: 'Expense not found' }, { status: 404 }));
    }
    
    return withCors(NextResponse.json({ expense }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    const { id } = await params;
    
    const expense = await AdditionalExpense.findByIdAndDelete(id);
    
    if (!expense) {
      return withCors(NextResponse.json({ error: 'Expense not found' }, { status: 404 }));
    }
    
    return withCors(NextResponse.json({ success: true }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

