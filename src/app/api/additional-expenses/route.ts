import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { withCors } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { AdditionalExpense } from '@/models/additional-expense';
import { History } from '@/models/history';
import { Types } from 'mongoose';

const additionalExpenseCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.enum(['petrol', 'maintenance', 'variance', 'salary', 'others']),
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: z.string().default('AED'),
  date: z.string().transform(str => new Date(str)),
  driverId: z.string().optional(),
  driverName: z.string().optional(),
  designation: z.enum(['driver', 'manager', 'ceo', 'staff']),
  receiptNumber: z.string().optional(),
  vendor: z.string().optional(),
  isReimbursable: z.boolean().default(true),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  approvedBy: z.string().optional(),
  approvedAt: z.string().transform(str => new Date(str)).optional(),
  rejectedReason: z.string().optional(),
});

// Schema for updates (used in [id]/route.ts)
const _additionalExpenseUpdateSchema = additionalExpenseCreateSchema.partial();

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const driverId = url.searchParams.get('driverId');
    const designation = url.searchParams.get('designation');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
    const queryFilter: Record<string, unknown> = {};
    if (category) queryFilter.category = category;
    if (status) queryFilter.status = status;
    if (driverId) queryFilter.driverId = driverId;
    if (designation) queryFilter.designation = designation;
    if (startDate && endDate) {
      queryFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // eslint-disable-next-line unicorn/no-array-callback-reference
    const expenses = await AdditionalExpense.find(queryFilter).sort({ date: -1, createdAt: -1 });
    const transformedExpenses = expenses.map(expense => ({
      ...expense.toObject(),
      id: (expense._id as unknown as string).toString(),
    }));
    return withCors(NextResponse.json({ expenses: transformedExpenses }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function POST(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const body = await req.json();
    const parsed = additionalExpenseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const expenseData = {
      ...parsed.data,
      createdBy: user?.sub,
      updatedBy: user?.sub,
    };
    
    const expense = await AdditionalExpense.create(expenseData);
    
    // Log to history
    await History.create({
      collectionName: 'additionalExpenses',
      documentId: expense._id,
      action: 'create',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: null,
      after: expense.toObject(),
      timestamp: new Date(),
    });
    
    const transformedExpense = {
      ...expense.toObject(),
      id: (expense._id as unknown as string).toString(),
    };
    
    return withCors(NextResponse.json({ expense: transformedExpense }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}