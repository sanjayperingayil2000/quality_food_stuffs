import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Employee, BalanceHistoryEntry } from '@/models/employee';
import { History } from '@/models/history';

export interface CreateEmployeeData {
  name: string;
  designation: 'driver' | 'staff' | 'ceo';
  phoneNumber: string;
  email: string;
  address: string;
  routeName?: string;
  location?: string;
  salary?: number;
  balance?: number;
  hireDate: Date;
  isActive?: boolean;
  createdBy?: string;
}

export interface UpdateEmployeeData {
  name?: string;
  designation?: 'driver' | 'staff' | 'ceo';
  phoneNumber?: string;
  email?: string;
  address?: string;
  routeName?: string;
  location?: string;
  salary?: number;
  balance?: number;
  balanceHistory?: BalanceHistoryEntry[];
  hireDate?: Date;
  isActive?: boolean;
  updatedBy?: string;
}

export interface EmployeeFilters {
  designation?: string;
  isActive?: boolean;
  routeName?: string;
}

export async function createEmployee(data: CreateEmployeeData) {
  await connectToDatabase();
  
  // Generate unique ID
  const count = await Employee.countDocuments();
  const id = `EMP-${String(count + 1).padStart(3, '0')}`;
  
  const employeeData = {
    ...data,
    id,
    balanceHistory: data.balance ? [{
      version: 1,
      balance: data.balance,
      updatedAt: new Date(),
      updatedBy: data.createdBy,
    }] : [],
  };
  
  const employee = await Employee.create(employeeData);
  
  // Log to history
  await History.create({
    collectionName: 'employees',
    documentId: employee._id,
    action: 'create',
    actor: data.createdBy && Types.ObjectId.isValid(data.createdBy) ? new Types.ObjectId(data.createdBy) : undefined,
    before: null,
    after: employee.toObject(),
    timestamp: new Date(),
  });
  
  return employee.toObject();
}

export async function getEmployees(filters: EmployeeFilters = {}) {
  await connectToDatabase();
  
  const queryFilter: Record<string, unknown> = {};
  if (filters.designation) queryFilter.designation = filters.designation;
  if (filters.isActive !== undefined) queryFilter.isActive = filters.isActive;
  if (filters.routeName) queryFilter.routeName = filters.routeName;
  
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const employees = await Employee.find(queryFilter).sort({ createdAt: -1 });
  return employees.map(emp => emp.toObject());
}

export async function getEmployeeById(id: string) {
  await connectToDatabase();
  
  const employee = await Employee.findOne({ id });
  return employee ? employee.toObject() : null;
}

export async function updateEmployee(id: string, data: UpdateEmployeeData) {
  await connectToDatabase();
  
  const employee = await Employee.findOne({ id });
  if (!employee) {
    throw new Error('Employee not found');
  }
  
  const beforeData = employee.toObject();
  
  // If balance is being updated, add to balance history
  if (data.balance !== undefined && data.balance !== employee.balance) {
    const currentVersion = employee.balanceHistory?.length || 0;
    data.balanceHistory = [
      ...(employee.balanceHistory || []),
      {
        version: currentVersion + 1,
        balance: data.balance,
        updatedAt: new Date(),
        updatedBy: data.updatedBy,
      }
    ];
  }
  
  const updatedEmployee = await Employee.findOneAndUpdate(
    { id },
    data,
    { new: true, runValidators: true }
  );
  
  // Log to history
  await History.create({
    collectionName: 'employees',
    documentId: employee._id,
    action: 'update',
    actor: data.updatedBy && Types.ObjectId.isValid(data.updatedBy) ? new Types.ObjectId(data.updatedBy) : undefined,
    before: beforeData,
    after: updatedEmployee?.toObject(),
    timestamp: new Date(),
  });
  
  return updatedEmployee?.toObject();
}

export async function deleteEmployee(id: string, deletedBy?: string) {
  await connectToDatabase();
  
  const employee = await Employee.findOne({ id });
  if (!employee) {
    throw new Error('Employee not found');
  }
  
  const beforeData = employee.toObject();
  await Employee.findOneAndDelete({ id });
  
  // Log to history
  await History.create({
    collectionName: 'employees',
    documentId: employee._id,
    action: 'delete',
    actor: deletedBy && Types.ObjectId.isValid(deletedBy) ? new Types.ObjectId(deletedBy) : undefined,
    before: beforeData,
    after: null,
    timestamp: new Date(),
  });
  
  return { message: 'Employee deleted successfully' };
}

export async function updateDriverBalance(driverId: string, newBalance: number, reason: string, updatedBy?: string) {
  await connectToDatabase();
  
  const employee = await Employee.findOne({ id: driverId, designation: 'driver' });
  if (!employee) {
    throw new Error('Driver not found');
  }
  
  const beforeData = employee.toObject();
  const currentVersion = employee.balanceHistory?.length || 0;
  
  const updatedEmployee = await Employee.findOneAndUpdate(
    { id: driverId },
    {
      balance: newBalance,
      balanceHistory: [
        ...(employee.balanceHistory || []),
        {
          version: currentVersion + 1,
          balance: newBalance,
          updatedAt: new Date(),
          reason,
          updatedBy,
        }
      ],
      updatedBy,
    },
    { new: true, runValidators: true }
  );
  
  // Log to history
  await History.create({
    collectionName: 'employees',
    documentId: employee._id,
    action: 'update',
    actor: updatedBy && Types.ObjectId.isValid(updatedBy) ? new Types.ObjectId(updatedBy) : undefined,
    before: beforeData,
    after: updatedEmployee?.toObject(),
    timestamp: new Date(),
  });
  
  return updatedEmployee?.toObject();
}
