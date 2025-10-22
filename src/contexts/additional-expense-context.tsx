'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { apiClient } from '@/lib/api-client';
import { useNotifications } from './notification-context';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export type ExpenseCategory = 'petrol' | 'maintenance' | 'variance' | 'salary' | 'others';

export interface AdditionalExpense {
  id: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  driverId?: string; // Optional - if expense is related to a specific driver
  driverName?: string;
  designation: 'driver' | 'manager' | 'ceo' | 'staff'; // Role of the person who created the expense
  receiptNumber?: string;
  vendor?: string;
  isReimbursable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // Employee ID who approved this expense
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // Employee ID who created this expense
  updatedBy?: string; // Employee ID who last updated this expense
}

interface AdditionalExpenseContextType {
  expenses: AdditionalExpense[];
  isLoading: boolean;
  error: string | null;
  getExpenseById: (id: string) => AdditionalExpense | undefined;
  addExpense: (expense: Omit<AdditionalExpense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<AdditionalExpense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByDriver: (driverId: string) => AdditionalExpense[];
  getExpensesByCategory: (category: ExpenseCategory) => AdditionalExpense[];
  getExpensesByDateRange: (startDate: Date, endDate: Date) => AdditionalExpense[];
  getTotalExpenses: () => number;
  approveExpense: (id: string, approvedBy: string) => Promise<void>;
  rejectExpense: (id: string, rejectedBy: string, reason: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

const AdditionalExpenseContext = React.createContext<AdditionalExpenseContextType | undefined>(undefined);

// Sample data - 8 additional expenses
// const initialExpenses: AdditionalExpense[] = [
//   {
//     id: 'EXP-001',
//     title: 'Fuel Refill - Route A',
//     description: 'Regular fuel refill for Route A vehicle',
//     category: 'petrol',
//     amount: 150.75,
//     currency: 'AED',
//     date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
//     driverId: 'EMP-004',
//     driverName: 'Rahul Kumar',
//     designation: 'driver',
//     receiptNumber: 'RCP-001-2024',
//     vendor: 'ADNOC Station - Downtown',
//     isReimbursable: true,
//     status: 'approved',
//     approvedBy: 'EMP-002',
//     approvedAt: dayjs().subtract(1, 'day').add(2, 'hour').toISOString(),
//     createdAt: dayjs().subtract(1, 'day').toISOString(),
//     updatedAt: dayjs().subtract(1, 'day').add(2, 'hour').toISOString(),
//     createdBy: 'EMP-004',
//     updatedBy: 'EMP-002',
//   },
//   {
//     id: 'EXP-002',
//     title: 'Vehicle Maintenance',
//     description: 'Oil change and brake inspection',
//     category: 'maintenance',
//     amount: 320.5,
//     currency: 'AED',
//     date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
//     driverId: 'EMP-005',
//     driverName: 'Ali Ahmed',
//     designation: 'driver',
//     receiptNumber: 'RCP-002-2024',
//     vendor: 'AutoCare Center - Marina',
//     isReimbursable: true,
//     status: 'approved',
//     approvedBy: 'EMP-003',
//     approvedAt: dayjs().subtract(3, 'day').add(1, 'hour').toISOString(),
//     createdAt: dayjs().subtract(3, 'day').toISOString(),
//     updatedAt: dayjs().subtract(3, 'day').add(1, 'hour').toISOString(),
//     createdBy: 'EMP-005',
//     updatedBy: 'EMP-003',
//   },
//   {
//     id: 'EXP-003',
//     title: 'Toll Charges',
//     description: 'Salik toll charges for the week',
//     category: 'salary',
//     amount: 45.25,
//     currency: 'AED',
//     date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
//     driverId: 'EMP-006',
//     driverName: 'David Wilson',
//     designation: 'driver',
//     receiptNumber: 'RCP-003-2024',
//     vendor: 'RTA - Salik',
//     isReimbursable: true,
//     status: 'pending',
//     createdAt: dayjs().subtract(5, 'day').toISOString(),
//     updatedAt: dayjs().subtract(5, 'day').toISOString(),
//     createdBy: 'EMP-006',
//   },
//   {
//     id: 'EXP-004',
//     title: 'Parking Fees',
//     description: 'Parking fees at customer locations',
//     category: 'variance',
//     amount: 25.5,
//     currency: 'AED',
//     date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
//     driverId: 'EMP-007',
//     driverName: 'Fatima Al-Zahra',
//     designation: 'driver',
//     receiptNumber: 'RCP-004-2024',
//     vendor: 'Various Parking Lots',
//     isReimbursable: true,
//     status: 'approved',
//     approvedBy: 'EMP-002',
//     approvedAt: dayjs().subtract(2, 'day').add(3, 'hour').toISOString(),
//     createdAt: dayjs().subtract(2, 'day').toISOString(),
//     updatedAt: dayjs().subtract(2, 'day').add(3, 'hour').toISOString(),
//     createdBy: 'EMP-007',
//     updatedBy: 'EMP-002',
//   },
//   {
//     id: 'EXP-005',
//     title: 'Vehicle Insurance Renewal',
//     description: 'Annual vehicle insurance renewal',
//     category: 'variance',
//     amount: 1200,
//     currency: 'AED',
//     date: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
//     designation: 'manager', // createdBy EMP-002 (Sarah Johnson, manager)
//     receiptNumber: 'RCP-005-2024',
//     vendor: 'National Insurance Co.',
//     isReimbursable: false,
//     status: 'approved',
//     approvedBy: 'EMP-001',
//     approvedAt: dayjs().subtract(7, 'day').add(1, 'hour').toISOString(),
//     createdAt: dayjs().subtract(7, 'day').toISOString(),
//     updatedAt: dayjs().subtract(7, 'day').add(1, 'hour').toISOString(),
//     createdBy: 'EMP-002',
//     updatedBy: 'EMP-001',
//   },
//   {
//     id: 'EXP-006',
//     title: 'Emergency Repair',
//     description: 'Flat tire repair on the road',
//     category: 'maintenance',
//     amount: 85.25,
//     currency: 'AED',
//     date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'),
//     driverId: 'EMP-008',
//     driverName: 'James Brown',
//     designation: 'driver',
//     receiptNumber: 'RCP-006-2024',
//     vendor: 'Quick Fix Garage',
//     isReimbursable: true,
//     status: 'approved',
//     approvedBy: 'EMP-003',
//     approvedAt: dayjs().subtract(4, 'day').add(2, 'hour').toISOString(),
//     createdAt: dayjs().subtract(4, 'day').toISOString(),
//     updatedAt: dayjs().subtract(4, 'day').add(2, 'hour').toISOString(),
//     createdBy: 'EMP-008',
//     updatedBy: 'EMP-003',
//   },
//   {
//     id: 'EXP-007',
//     title: 'Office Supplies',
//     description: 'Delivery forms and stationery',
//     category: 'others',
//     amount: 45.75,
//     currency: 'AED',
//     date: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
//     designation: 'manager', // createdBy EMP-002 (Sarah Johnson, manager)
//     receiptNumber: 'RCP-007-2024',
//     vendor: 'Office Depot',
//     isReimbursable: true,
//     status: 'rejected',
//     rejectedReason: 'Not related to vehicle operations',
//     createdAt: dayjs().subtract(6, 'day').toISOString(),
//     updatedAt: dayjs().subtract(6, 'day').add(1, 'hour').toISOString(),
//     createdBy: 'EMP-002',
//     updatedBy: 'EMP-001',
//   },
//   {
//     id: 'EXP-008',
//     title: 'Fuel Refill - Route B',
//     description: 'Regular fuel refill for Route B vehicle',
//     category: 'petrol',
//     amount: 165.5,
//     currency: 'AED',
//     date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
//     driverId: 'EMP-005',
//     driverName: 'Ali Ahmed',
//     designation: 'driver',
//     receiptNumber: 'RCP-008-2024',
//     vendor: 'ENOC Station - Marina',
//     isReimbursable: true,
//     status: 'pending',
//     createdAt: dayjs().subtract(1, 'day').toISOString(),
//     updatedAt: dayjs().subtract(1, 'day').toISOString(),
//     createdBy: 'EMP-005',
//   },
// ];

export function AdditionalExpenseProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [expenses, setExpenses] = React.useState<AdditionalExpense[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  const refreshExpenses = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getAdditionalExpenses();
      if (result.error) {
        setError(result.error);
        // Fallback to initial data on error
        // setExpenses(initialExpenses);
        return;
      }

      if (result.data?.expenses && result.data.expenses.length > 0) {
        setExpenses(result.data.expenses);
      } else {
        // If no data in API, use initial data as fallback
        // setExpenses(initialExpenses);
      }
    } catch {
      setError('Failed to fetch expenses');
      // Fallback to initial data on error
      // setExpenses(initialExpenses);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  const getExpenseById = React.useCallback((id: string): AdditionalExpense | undefined => {
    return expenses.find(expense => expense.id === id);
  }, [expenses]);

  const addExpense = React.useCallback(async (expenseData: Omit<AdditionalExpense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Save to backend first
      const result = await apiClient.createAdditionalExpense({
        title: expenseData.title,
        description: expenseData.description,
        category: expenseData.category,
        amount: expenseData.amount,
        currency: expenseData.currency,
        date: expenseData.date,
        driverId: expenseData.driverId,
        driverName: expenseData.driverName,
        designation: expenseData.designation,
        receiptNumber: expenseData.receiptNumber,
        vendor: expenseData.vendor,
        isReimbursable: expenseData.isReimbursable,
        status: expenseData.status,
      });

      if (result.error) {
        setError(result.error);
        showError(`Failed to add expense: ${result.error}`);
        return;
      }

      // Update local state with the created expense
      if (result.data?.expense) {
        setExpenses(prev => [result.data!.expense, ...prev]);
        showSuccess(`Expense "${expenseData.title}" added successfully`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add expense';
      setError(errorMessage);
      showError(`Failed to add expense: ${errorMessage}`);
    }
  }, [showSuccess, showError]);

  const updateExpense = React.useCallback(async (id: string, updates: Partial<AdditionalExpense>) => {
    try {
      // Prepare update data
      const updateData: Record<string, unknown> = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.driverId !== undefined) updateData.driverId = updates.driverId;
      if (updates.driverName !== undefined) updateData.driverName = updates.driverName;
      if (updates.designation !== undefined) updateData.designation = updates.designation;
      if (updates.receiptNumber !== undefined) updateData.receiptNumber = updates.receiptNumber;
      if (updates.vendor !== undefined) updateData.vendor = updates.vendor;
      if (updates.isReimbursable !== undefined) updateData.isReimbursable = updates.isReimbursable;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.approvedBy !== undefined) updateData.approvedBy = updates.approvedBy;
      if (updates.approvedAt !== undefined) updateData.approvedAt = updates.approvedAt;
      if (updates.rejectedReason !== undefined) updateData.rejectedReason = updates.rejectedReason;

      // Save to backend
      const result = await apiClient.updateAdditionalExpense(id, updateData);

      if (result.error) {
        setError(result.error);
        showError(`Failed to update expense: ${result.error}`);
        return;
      }

      if (result.data?.expense) {
        setExpenses(prev => prev.map(exp => exp.id === id ? result.data!.expense : exp));
        const expenseTitle = updates.title || result.data.expense.title || 'Expense';
        showSuccess(`Expense "${expenseTitle}" updated successfully`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update expense';
      setError(errorMessage);
      showError(`Failed to update expense: ${errorMessage}`);
    }
  }, [showSuccess, showError]);

  const deleteExpense = React.useCallback(async (id: string) => {
    try {
      // Get the expense title before deleting for the success message
      const expenseToDelete = expenses.find(exp => exp.id === id);
      const expenseTitle = expenseToDelete?.title || 'Expense';

      // Delete from backend
      const result = await apiClient.deleteAdditionalExpense(id);
      if (result.error) {
        setError(result.error);
        showError(`Failed to delete expense: ${result.error}`);
        return;
      }
      
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      showSuccess(`Expense "${expenseTitle}" deleted successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete expense';
      setError(errorMessage);
      showError(`Failed to delete expense: ${errorMessage}`);
    }
  }, [expenses, showSuccess, showError]);

  const getExpensesByDriver = React.useCallback((driverId: string): AdditionalExpense[] => {
    return expenses.filter(expense => expense.driverId === driverId);
  }, [expenses]);

  const getExpensesByCategory = React.useCallback((category: ExpenseCategory): AdditionalExpense[] => {
    return expenses.filter(expense => expense.category === category);
  }, [expenses]);

  const getExpensesByDateRange = React.useCallback((startDate: Date, endDate: Date): AdditionalExpense[] => {
    return expenses.filter(expense => {
      const expenseDate = dayjs(expense.date);
      return expenseDate.isAfter(dayjs(startDate)) && expenseDate.isBefore(dayjs(endDate));
    });
  }, [expenses]);

  const getTotalExpenses = React.useCallback((): number => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  const approveExpense = React.useCallback(async (id: string, approvedBy: string) => {
    try {
      // Get the expense title before updating for the success message
      const expenseToApprove = expenses.find(exp => exp.id === id);
      const expenseTitle = expenseToApprove?.title || 'Expense';

      // Update expense status to approved
      const result = await apiClient.updateAdditionalExpense(id, {
        status: 'approved',
        approvedBy,
        approvedAt: new Date().toISOString(),
      });

      if (result.error) {
        setError(result.error);
        showError(`Failed to approve expense: ${result.error}`);
        return;
      }

      // Update local state with the updated expense
      if (result.data?.expense) {
        setExpenses(prev => prev.map(exp => exp.id === id ? result.data!.expense : exp));
        showSuccess(`Expense "${expenseTitle}" approved successfully`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to approve expense';
      setError(errorMessage);
      showError(`Failed to approve expense: ${errorMessage}`);
    }
  }, [expenses, showSuccess, showError]);

  const rejectExpense = React.useCallback(async (id: string, rejectedBy: string, reason: string) => {
    try {
      // Get the expense title before updating for the success message
      const expenseToReject = expenses.find(exp => exp.id === id);
      const expenseTitle = expenseToReject?.title || 'Expense';

      // Update expense status to rejected
      const result = await apiClient.updateAdditionalExpense(id, {
        status: 'rejected',
        rejectedReason: reason,
      });

      if (result.error) {
        setError(result.error);
        showError(`Failed to reject expense: ${result.error}`);
        return;
      }

      // Update local state with the updated expense
      if (result.data?.expense) {
        setExpenses(prev => prev.map(exp => exp.id === id ? result.data!.expense : exp));
        showSuccess(`Expense "${expenseTitle}" rejected successfully`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject expense';
      setError(errorMessage);
      showError(`Failed to reject expense: ${errorMessage}`);
    }
  }, [expenses, showSuccess, showError]);

  const value: AdditionalExpenseContextType = {
    expenses,
    isLoading,
    error,
    getExpenseById,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpensesByDriver,
    getExpensesByCategory,
    getExpensesByDateRange,
    getTotalExpenses,
    approveExpense,
    rejectExpense,
    refreshExpenses,
  };

  return (
    <AdditionalExpenseContext.Provider value={value}>
      {children}
    </AdditionalExpenseContext.Provider>
  );
}

export function useAdditionalExpenses(): AdditionalExpenseContextType {
  const context = React.useContext(AdditionalExpenseContext);
  if (context === undefined) {
    throw new Error('useAdditionalExpenses must be used within an AdditionalExpenseProvider');
  }
  return context;
}
