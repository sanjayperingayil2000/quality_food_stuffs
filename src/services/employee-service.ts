import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Employee, BalanceHistoryEntry } from '@/models/employee';
import { History } from '@/models/history';
import { getNextSequence } from '@/models/counter';

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
  balanceUpdateReason?: string;
}

export interface EmployeeFilters {
  designation?: string;
  isActive?: boolean;
  routeName?: string;
}

export async function createEmployee(data: CreateEmployeeData) {
  await connectToDatabase();
  
  // Generate unique ID using atomic counter
  const seq = await getNextSequence('employee');
  const id = `EMP-${String(seq).padStart(3, '0')}`;
  
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

  // --- Normalize and enforce balance & balanceHistory updates (handles legacy shapes) ---
  const isDriver = (employee.designation === 'driver') || (data.designation === 'driver');

  // Work on a mutable copy to satisfy type-safety for deletes below
  const patch: UpdateEmployeeData = { ...data };

  if (isDriver) {
    // Normalize provided balanceHistory if present (accept legacy shape)
    if (Array.isArray(patch.balanceHistory)) {
      interface LegacyBalanceHistory {
        version?: number;
        balance?: number;
        newBalance?: number;
        updatedAt?: Date | string;
        date?: Date | string;
        reason?: string;
        updatedBy?: string;
        id?: string;
      }

      patch.balanceHistory = patch.balanceHistory.map((entry, index) => {
        const legacy = entry as unknown as LegacyBalanceHistory;
        const version = typeof legacy.version === 'number' ? legacy.version : index + 1;
        const computedBalance =
          typeof legacy.balance === 'number'
            ? legacy.balance
            : typeof legacy.newBalance === 'number'
              ? legacy.newBalance
              : employee.balance || 0;
        const rawDate = legacy.updatedAt ?? legacy.date;
        const updatedAt = rawDate instanceof Date ? rawDate : new Date(typeof rawDate === 'string' ? rawDate : Date.now());
        const reason = typeof legacy.reason === 'string' ? legacy.reason : 'Balance updated';
        const updatedBy = typeof legacy.updatedBy === 'string' ? legacy.updatedBy : patch.updatedBy;
        const normalized: BalanceHistoryEntry = { version, balance: computedBalance, updatedAt, reason, updatedBy };
        return normalized;
      });

      // Ensure "balance" aligns with the latest history entry
      const latest = patch.balanceHistory.at(-1);
      if (latest && typeof latest.balance === 'number') {
        patch.balance = latest.balance;
      }
    } else if (patch.balance !== undefined && patch.balance !== employee.balance) {
      // If only balance provided, append a history entry automatically
      interface LegacyBalanceHistory {
        version?: number;
        balance?: number;
        newBalance?: number;
        updatedAt?: Date | string;
        date?: Date | string;
        reason?: string;
        updatedBy?: string;
        id?: string;
      }

      const normalizedExisting: BalanceHistoryEntry[] = (employee.balanceHistory || []).map((entry, index) => {
        const legacy = entry as unknown as LegacyBalanceHistory;
        const version = typeof legacy.version === 'number' ? legacy.version : index + 1;
        const computedBalance =
          typeof legacy.balance === 'number'
            ? legacy.balance
            : typeof legacy.newBalance === 'number'
              ? legacy.newBalance
              : employee.balance || 0;
        const rawDate = legacy.updatedAt ?? legacy.date;
        const updatedAt = rawDate instanceof Date ? rawDate : new Date(typeof rawDate === 'string' ? rawDate : Date.now());
        const reason = typeof legacy.reason === 'string' ? legacy.reason : 'Balance updated';
        const updatedBy = typeof legacy.updatedBy === 'string' ? legacy.updatedBy : patch.updatedBy;
        return { version, balance: computedBalance, updatedAt, reason, updatedBy };
      });

      const currentVersion = normalizedExisting.length;
      patch.balanceHistory = [
        ...normalizedExisting,
        {
          version: currentVersion + 1,
          balance: patch.balance,
          updatedAt: new Date(),
          reason: patch.balanceUpdateReason || 'Balance updated',
          updatedBy: patch.updatedBy,
        }
      ];
    }
  } else {
    // Not a driver: strip driver-only fields to avoid accidental writes
    delete (patch as Partial<UpdateEmployeeData>).balance;
    delete (patch as Partial<UpdateEmployeeData>).balanceHistory;
  }
  
  const updatedEmployee = await Employee.findOneAndUpdate(
    { id },
    patch,
    { new: true, runValidators: true }
  );
  
  // Log to history
  await History.create({
    collectionName: 'employees',
    documentId: employee._id,
    action: 'update',
    actor: patch.updatedBy && Types.ObjectId.isValid(patch.updatedBy) ? new Types.ObjectId(patch.updatedBy) : undefined,
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
