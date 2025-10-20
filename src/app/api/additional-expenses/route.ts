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

const additionalExpenseSchema = zod.object({
  title: zod.string().min(1, 'Title is required'),
  description: zod.string().optional(),
  category: zod.enum(['petrol', 'maintenance', 'variance', 'salary', 'others']),
  amount: zod.number().min(0, 'Amount must be positive'),
  currency: zod.string().default('AED'),
  date: zod.string().transform((str) => new Date(str)),
  driverId: zod.string().optional(),
  driverName: zod.string().optional(),
  designation: zod.enum(['driver', 'manager', 'ceo', 'staff']),
  receiptNumber: zod.string().optional(),
  vendor: zod.string().optional(),
  isReimbursable: zod.boolean().default(true),
  status: zod.enum(['pending', 'approved', 'rejected']).default('pending'),
  approvedBy: zod.string().optional(),
  approvedAt: zod.string().transform((str) => new Date(str)).optional(),
  rejectedReason: zod.string().optional(),
});

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    
    const url = new URL(req.url);
    const driverId = url.searchParams.get('driverId');
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    const query: any = {};
    
    if (driverId) query.driverId = driverId;
    if (category) query.category = category;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const expenses = await AdditionalExpense.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    return withCors(NextResponse.json({ expenses }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function POST(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const parsed = additionalExpenseSchema.safeParse(body);
    
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    const user = getRequestUser(authed);
    if (!user) {
      return withCors(NextResponse.json({ error: 'User not found' }, { status: 401 }));
    }
    
    const expense = await AdditionalExpense.create({
      ...parsed.data,
      createdBy: user.sub,
      updatedBy: user.sub,
    });
    
    return withCors(NextResponse.json({ expense }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

