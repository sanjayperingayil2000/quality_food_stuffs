import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { Employee } from '@/models/employee';
import { History } from '@/models/history';
import { Types } from 'mongoose';

const employeeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  designation: z.enum(['driver', 'staff', 'ceo']).optional(),
  phoneNumber: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  routeName: z.string().optional(),
  location: z.string().optional(),
  salary: z.number().min(0).optional(),
  balance: z.number().min(0).optional(),
  hireDate: z.string().transform(str => new Date(str)).optional(),
  isActive: z.boolean().optional(),
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
    
    const employee = await Employee.findOne({ id });
    if (!employee) {
      return withCors(NextResponse.json({ error: 'Employee not found' }, { status: 404 }));
    }
    
    return withCors(NextResponse.json({ employee }, { status: 200 }));
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
    const parsed = employeeUpdateSchema.safeParse(body);
    
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const employee = await Employee.findOne({ id });
    if (!employee) {
      return withCors(NextResponse.json({ error: 'Employee not found' }, { status: 404 }));
    }
    
    const beforeData = employee.toObject();
    const updateData = {
      ...parsed.data,
      updatedBy: user?.sub,
    };
    
    const updatedEmployee = await Employee.findOneAndUpdate(
      { id },
      updateData,
      { new: true, runValidators: true }
    );
    
    // Log to history
    await History.create({
      collectionName: 'employees',
      documentId: employee._id,
      action: 'update',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: beforeData,
      after: updatedEmployee?.toObject(),
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ employee: updatedEmployee }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = getRequestUser(authed);
    
    const employee = await Employee.findOne({ id });
    if (!employee) {
      return withCors(NextResponse.json({ error: 'Employee not found' }, { status: 404 }));
    }
    
    const beforeData = employee.toObject();
    await Employee.findOneAndDelete({ id });
    
    // Log to history
    await History.create({
      collectionName: 'employees',
      documentId: employee._id,
      action: 'delete',
      actor: user?.sub && Types.ObjectId.isValid(user.sub) ? new Types.ObjectId(user.sub) : undefined,
      before: beforeData,
      after: null,
      timestamp: new Date(),
    });
    
    return withCors(NextResponse.json({ message: 'Employee deleted successfully' }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}
