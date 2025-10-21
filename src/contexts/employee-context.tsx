'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { apiClient } from '@/lib/api-client';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export type EmployeeDesignation = 'driver' | 'staff' | 'ceo';

export interface BalanceHistoryEntry {
  id: string;
  previousBalance: number;
  newBalance: number;
  changeAmount: number;
  reason: string; // 'initial', 'trip_update', 'manual_adjustment'
  date: Date;
  updatedBy?: string; // Employee ID who made the change
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
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshEmployees = React.useCallback(async () => {
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
        setEmployees(result.data.employees);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      const newEmployee: Employee = {
        ...employeeData,
        id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Update local state immediately for better UX
      setEmployees(prev => [...prev, newEmployee]);
      
      // Save to backend
      const result = await apiClient.createEmployee(newEmployee);
      
      if (result.error) {
        // Revert local state on error
        setEmployees(prev => prev.filter(emp => emp.id !== newEmployee.id));
        setError(result.error);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to add employee');
    }
  }, [employees]);

  const updateEmployee = React.useCallback(async (id: string, updates: Partial<Employee>) => {
    try {
      const updatedEmployees = employees.map(emp =>
        emp.id === id
          ? { ...emp, ...updates, updatedAt: new Date() }
          : emp
      );
      
      // Update local state immediately
      setEmployees(updatedEmployees);
      
      // Save to backend
      const result = await apiClient.updateEmployee(id, updates);
      
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
      const updatedEmployees = employees.map(emp => {
        if (emp.id === driverId && emp.designation === 'driver') {
          const previousBalance = emp.balance || 0;
          const roundedNewBalance = Math.round(newBalance);
          const changeAmount = roundedNewBalance - previousBalance;
          
          const newHistoryEntry: BalanceHistoryEntry = {
            id: `BAL-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            previousBalance,
            newBalance: roundedNewBalance,
            changeAmount,
            reason,
            date: new Date(),
            updatedBy,
          };

          const updatedBalanceHistory = [...(emp.balanceHistory || []), newHistoryEntry];

          return {
            ...emp,
            balance: roundedNewBalance,
            balanceHistory: updatedBalanceHistory,
            updatedAt: new Date(),
            updatedBy,
          };
        }
        return emp;
      });
      
      // Update local state immediately
      setEmployees(updatedEmployees);
      
      // Save to backend
      const result = await apiClient.updateEmployee(driverId, { balance: newBalance });
      
      if (result.error) {
        // Revert local state on error
        await refreshEmployees();
        setError(result.error);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update driver balance');
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
