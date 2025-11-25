'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { apiClient } from '@/lib/api-client';
import { useUser } from '@/hooks/use-user';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export type EmployeeDesignation = 'driver' | 'staff' | 'ceo';

export interface BalanceHistoryEntry {
  version: number;
  balance: number;
  updatedAt: Date;
  reason?: string; // Reason for balance change
  updatedBy?: string; // Employee ID who made the change
}

export interface DueHistoryEntry {
  version: number;
  due: number; // Can be negative or positive
  tripDate: Date; // Date of the trip for which due is calculated
  updatedAt: Date;
  tripId?: string; // ID of the daily trip
}

export interface Employee {
  id: string;
  name: string;
  designation: EmployeeDesignation;
  phoneNumber: string;
  email: string;
  address: string;
  routeName?: string; // For drivers
  location?: string; // For drivers
  salary?: number; // For staff and CEO
  balance?: number; // For drivers only - current balance
  balanceHistory?: BalanceHistoryEntry[]; // For drivers only - history of balance changes
  due?: number; // For drivers only - current total due (sum of all dues from trips)
  dueHistory?: DueHistoryEntry[]; // For drivers only - history of due calculations
  hireDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Employee ID who created this record
  updatedBy?: string; // Employee ID who last updated this record
}

interface EmployeeContextType {
  employees: Employee[];
  drivers: Employee[];
  staff: Employee[];
  ceo: Employee[];
  isLoading: boolean;
  error: string | null;
  getEmployeeById: (id: string) => Employee | undefined;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  updateDriverBalance: (driverId: string, newBalance: number, reason: string, updatedBy?: string) => Promise<void>;
  getDriverBalanceHistory: (driverId: string) => BalanceHistoryEntry[];
  refreshEmployees: () => Promise<void>;
}

const EmployeeContext = React.createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { user, isLoading: userLoading } = useUser();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshEmployees = React.useCallback(async () => {
    // Don't load data if user is not authenticated yet
    if (userLoading || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getEmployees();
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Get the employee data directly
      if (result.data?.employees) {
        const transformedEmployees = result.data.employees.map(emp => ({
          ...emp,
          hireDate: new Date(emp.hireDate),
          createdAt: new Date(emp.createdAt),
          updatedAt: new Date(emp.updatedAt),
          balanceHistory: emp.balanceHistory?.map(entry => ({
            ...entry,
            updatedAt: new Date(entry.updatedAt)
          }))
        }));
        setEmployees(transformedEmployees);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  React.useEffect(() => {
    refreshEmployees();
  }, [refreshEmployees]);

  const drivers = React.useMemo(() =>
    employees.filter(emp => emp.designation === 'driver' && emp.isActive),
    [employees]
  );

  const staff = React.useMemo(() =>
    employees.filter(emp => emp.designation === 'staff' && emp.isActive),
    [employees]
  );

  const ceo = React.useMemo(() =>
    employees.filter(emp => emp.designation === 'ceo' && emp.isActive),
    [employees]
  );

  const getEmployeeById = React.useCallback((id: string): Employee | undefined => {
    return employees.find(emp => emp.id === id);
  }, [employees]);

  const addEmployee = React.useCallback(async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Build payload for API (let backend assign the ID atomically)
      const payload = {
        ...employeeData,
        hireDate: employeeData.hireDate.toISOString(),
      } as unknown as Record<string, unknown>;

      if (Array.isArray(employeeData.balanceHistory)) {
        payload.balanceHistory = employeeData.balanceHistory.map(entry => ({
          ...entry,
          updatedAt: entry.updatedAt.toISOString(),
        }));
      }

      const result = await apiClient.createEmployee(payload as never);

      if (result.error) {
        setError(result.error);
        throw new Error(result.error);
      }

      if (result.data?.employee) {
        const created = result.data.employee;
        const transformed = {
          ...created,
          hireDate: new Date(created.hireDate),
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt),
          balanceHistory: created.balanceHistory?.map(entry => ({
            ...entry,
            updatedAt: new Date(entry.updatedAt as unknown as string),
          }))
        } as unknown as Employee;

        setEmployees(prev => [...prev, transformed]);
      }
    } catch (error_) {
      const message = error_ instanceof Error ? error_.message : 'Failed to add employee';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateEmployee = React.useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      const updatedEmployees = employees.map(emp =>
        emp.id === id
          ? { ...emp, ...updates, updatedAt: new Date() }
          : emp
      );
      
      // Update local state immediately
      setEmployees(updatedEmployees);
      
      // Save to backend - convert Date objects to strings for API
      const apiUpdates = {
        ...updates,
        hireDate: updates.hireDate?.toISOString(),
        createdAt: updates.createdAt?.toISOString(),
        updatedAt: updates.updatedAt?.toISOString(),
        balanceHistory: updates.balanceHistory?.map(entry => ({
          ...entry,
          updatedAt: entry.updatedAt.toISOString()
        }))
      };
      const result = await apiClient.updateEmployee(id, apiUpdates);
      
      if (result.error) {
        // Revert local state on error
        await refreshEmployees();
        setError(result.error);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update employee');
    }
  }, [employees, refreshEmployees]);

  const deleteEmployee = React.useCallback(async (id: string) => {
    try {
      const updatedEmployees = employees.filter(emp => emp.id !== id);
      
      // Update local state immediately
      setEmployees(updatedEmployees);
      
      // Save to backend
      const result = await apiClient.deleteEmployee(id);
      
      if (result.error) {
        // Revert local state on error
        await refreshEmployees();
        setError(result.error);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to delete employee');
    }
  }, [employees, refreshEmployees]);

  const updateDriverBalance = React.useCallback(async (driverId: string, newBalance: number, reason: string, updatedBy?: string) => {
    try {
      console.log('updateDriverBalance called:', { driverId, newBalance, reason, updatedBy });
      
      // Get the current employee to build proper history
      const currentEmployee = employees.find(emp => emp.id === driverId && emp.designation === 'driver');
      if (!currentEmployee) {
        console.error('Driver not found:', driverId);
        throw new Error('Driver not found');
      }

      const roundedNewBalance = Math.round(newBalance);
      
      console.log('Current employee balance:', currentEmployee.balance);
      console.log('New balance:', roundedNewBalance);
      console.log('Balance history length:', currentEmployee.balanceHistory?.length || 0);
      
      // Normalize any existing history entries to the canonical schema (version/balance/updatedAt/reason/updatedBy)
      const normalizeHistory = (entries: unknown[]): BalanceHistoryEntry[] => {
        const safeEntries = Array.isArray(entries) ? entries : [];
        return safeEntries.map((entry, index) => {
          const e = entry as Record<string, unknown>;
          const version = typeof e.version === 'number' ? e.version : index + 1;
          const balance = typeof e.balance === 'number'
            ? e.balance
            : typeof e.newBalance === 'number'
              ? e.newBalance
              : 0;
          const rawDate = (e.updatedAt as Date | string | undefined) ?? (e.date as Date | string | undefined);
          const updatedAt = rawDate instanceof Date ? rawDate : new Date(typeof rawDate === 'string' ? rawDate : Date.now());
          const reasonText = (typeof e.reason === 'string' && e.reason) || (typeof e.id === 'string' ? `Legacy entry ${e.id}` : undefined);
          const updatedById = typeof e.updatedBy === 'string' ? e.updatedBy : undefined;
          return {
            version,
            balance,
            updatedAt,
            reason: reasonText,
            updatedBy: updatedById,
          };
        });
      };

      const existingHistoryNormalized = normalizeHistory(currentEmployee.balanceHistory as unknown as unknown[]);

      const newHistoryEntry: BalanceHistoryEntry = {
        version: (existingHistoryNormalized.length || 0) + 1,
        balance: roundedNewBalance,
        updatedAt: new Date(),
        reason,
        updatedBy,
      };

      const updatedBalanceHistory = [...existingHistoryNormalized, newHistoryEntry];

      // Optimistically update local state so the list reflects the change immediately
      setEmployees(prev => prev.map(emp => {
        if (emp.id !== driverId) return emp;
        return {
          ...emp,
          balance: roundedNewBalance,
          balanceHistory: updatedBalanceHistory,
          updatedAt: new Date(),
        };
      }));

      // Build the update payload with balance history
      const updatePayload = {
        balance: roundedNewBalance,
        balanceHistory: updatedBalanceHistory.map(entry => ({
          version: entry.version,
          balance: entry.balance,
          updatedAt: entry.updatedAt.toISOString(),
          reason: entry.reason,
          updatedBy: entry.updatedBy,
        })),
        updatedBy
      };
      
      // Save to backend with full balance history
      const result = await apiClient.updateEmployee(driverId, updatePayload);
      
      if (result.error) {
        setError(result.error);
        // If server failed, reload from server to revert optimistic update
        await refreshEmployees();
      } else {
        // Refresh to get the latest data from backend (confirms optimistic state)
        await refreshEmployees();
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update driver balance');
      // Refresh on error to get consistent state
      await refreshEmployees();
    }
  }, [employees, refreshEmployees]);

  const getDriverBalanceHistory = React.useCallback((driverId: string): BalanceHistoryEntry[] => {
    const employee = employees.find(emp => emp.id === driverId && emp.designation === 'driver');
    return employee?.balanceHistory || [];
  }, [employees]);

  const value: EmployeeContextType = {
    employees,
    drivers,
    staff,
    ceo,
    isLoading,
    error,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateDriverBalance,
    getDriverBalanceHistory,
    refreshEmployees,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployees(): EmployeeContextType {
  const context = React.useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployees must be used within an EmployeeProvider');
  }
  return context;
}
