import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { withCors } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { Employee } from '@/models/employee';
import { History } from '@/models/history';
import { Types } from 'mongoose';
import { getNextSequence } from '@/models/counter';

const employeeCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.enum(['driver', 'staff', 'ceo']),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email format'),
  address: z.string().min(1, 'Address is required'),
  routeName: z.string().optional(),
  location: z.string().optional(),
  salary: z.number().min(0).optional(),
  balance: z.number().min(0).optional(),
  hireDate: z.string().transform(str => new Date(str)),
  isActive: z.boolean().default(true),
});

// Schema for updates (used in [id]/route.ts)
const _employeeUpdateSchema = employeeCreateSchema.partial();

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const designation = url.searchParams.get('designation');
    const isActive = url.searchParams.get('isActive');
    
    const queryFilter: Record<string, unknown> = {};
    if (designation) queryFilter.designation = designation;
    if (isActive !== null) queryFilter.isActive = isActive === 'true';
    
    // eslint-disable-next-line unicorn/no-array-callback-reference
    const employees = await Employee.find(queryFilter).sort({ createdAt: -1 });
    return withCors(NextResponse.json({ employees }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function POST(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const body = await req.json();
    const parsed = employeeCreateSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    // Generate unique sequential ID using counters collection (atomic)
    const seq = await getNextSequence('employee');
    const id = `EMP-${String(seq).padStart(3, '0')}`;
    
    const employeeData = {
      ...parsed.data,
      id,
      createdBy: user?.sub,
      updatedBy: user?.sub,
    };
    
    const employee = await Employee.create(employeeData);
    
    // Log to history
    await History.create({
      collectionName: 'employees',
      documentId: employee._id,
      action: 'create',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: null,
      after: employee.toObject(),
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ employee }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}
