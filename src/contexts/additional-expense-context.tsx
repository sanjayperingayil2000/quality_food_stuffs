'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

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
  date: Date;
  driverId?: string; // Optional - if expense is related to a specific driver
  driverName?: string;
  receiptNumber?: string;
  vendor?: string;
  isReimbursable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // Employee ID who approved this expense
  approvedAt?: Date;
  rejectedReason?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Employee ID who created this expense
  updatedBy?: string; // Employee ID who last updated this expense
}

interface AdditionalExpenseContextType {
  expenses: AdditionalExpense[];
  getExpenseById: (id: string) => AdditionalExpense | undefined;
  addExpense: (expense: Omit<AdditionalExpense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExpense: (id: string, updates: Partial<AdditionalExpense>) => void;
  deleteExpense: (id: string) => void;
  getExpensesByDriver: (driverId: string) => AdditionalExpense[];
  getExpensesByCategory: (category: ExpenseCategory) => AdditionalExpense[];
  getExpensesByDateRange: (startDate: Date, endDate: Date) => AdditionalExpense[];
  getTotalExpenses: () => number;
  approveExpense: (id: string, approvedBy: string) => void;
  rejectExpense: (id: string, rejectedBy: string, reason: string) => void;
}

const AdditionalExpenseContext = React.createContext<AdditionalExpenseContextType | undefined>(undefined);

// Sample data - 8 additional expenses
const initialExpenses: AdditionalExpense[] = [
  {
    id: 'EXP-001',
    title: 'Fuel Refill - Route A',
    description: 'Regular fuel refill for Route A vehicle',
    category: 'petrol',
    amount: 150.75,
    currency: 'AED',
    date: dayjs().subtract(1, 'day').toDate(),
    driverId: 'EMP-004',
    driverName: 'Rahul Kumar',
    receiptNumber: 'RCP-001-2024',
    vendor: 'ADNOC Station - Downtown',
    isReimbursable: true,
    status: 'approved',
    approvedBy: 'EMP-002',
    approvedAt: dayjs().subtract(1, 'day').add(2, 'hour').toDate(),
    createdAt: dayjs().subtract(1, 'day').toDate(),
    updatedAt: dayjs().subtract(1, 'day').add(2, 'hour').toDate(),
    createdBy: 'EMP-004',
    updatedBy: 'EMP-002',
  },
  {
    id: 'EXP-002',
    title: 'Vehicle Maintenance',
    description: 'Oil change and brake inspection',
    category: 'maintenance',
    amount: 320.5,
    currency: 'AED',
    date: dayjs().subtract(3, 'day').toDate(),
    driverId: 'EMP-005',
    driverName: 'Ali Ahmed',
    receiptNumber: 'RCP-002-2024',
    vendor: 'AutoCare Center - Marina',
    isReimbursable: true,
    status: 'approved',
    approvedBy: 'EMP-003',
    approvedAt: dayjs().subtract(3, 'day').add(1, 'hour').toDate(),
    createdAt: dayjs().subtract(3, 'day').toDate(),
    updatedAt: dayjs().subtract(3, 'day').add(1, 'hour').toDate(),
    createdBy: 'EMP-005',
    updatedBy: 'EMP-003',
  },
  {
    id: 'EXP-003',
    title: 'Toll Charges',
    description: 'Salik toll charges for the week',
    category: 'salary',
    amount: 45.25,
    currency: 'AED',
    date: dayjs().subtract(5, 'day').toDate(),
    driverId: 'EMP-006',
    driverName: 'David Wilson',
    receiptNumber: 'RCP-003-2024',
    vendor: 'RTA - Salik',
    isReimbursable: true,
    status: 'pending',
    createdAt: dayjs().subtract(5, 'day').toDate(),
    updatedAt: dayjs().subtract(5, 'day').toDate(),
    createdBy: 'EMP-006',
  },
  {
    id: 'EXP-004',
    title: 'Parking Fees',
    description: 'Parking fees at customer locations',
    category: 'variance',
    amount: 25.5,
    currency: 'AED',
    date: dayjs().subtract(2, 'day').toDate(),
    driverId: 'EMP-007',
    driverName: 'Fatima Al-Zahra',
    receiptNumber: 'RCP-004-2024',
    vendor: 'Various Parking Lots',
    isReimbursable: true,
    status: 'approved',
    approvedBy: 'EMP-002',
    approvedAt: dayjs().subtract(2, 'day').add(3, 'hour').toDate(),
    createdAt: dayjs().subtract(2, 'day').toDate(),
    updatedAt: dayjs().subtract(2, 'day').add(3, 'hour').toDate(),
    createdBy: 'EMP-007',
    updatedBy: 'EMP-002',
  },
  {
    id: 'EXP-005',
    title: 'Vehicle Insurance Renewal',
    description: 'Annual vehicle insurance renewal',
    category: 'variance',
    amount: 1200,
    currency: 'AED',
    date: dayjs().subtract(7, 'day').toDate(),
    receiptNumber: 'RCP-005-2024',
    vendor: 'National Insurance Co.',
    isReimbursable: false,
    status: 'approved',
    approvedBy: 'EMP-001',
    approvedAt: dayjs().subtract(7, 'day').add(1, 'hour').toDate(),
    createdAt: dayjs().subtract(7, 'day').toDate(),
    updatedAt: dayjs().subtract(7, 'day').add(1, 'hour').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-001',
  },
  {
    id: 'EXP-006',
    title: 'Emergency Repair',
    description: 'Flat tire repair on the road',
    category: 'maintenance',
    amount: 85.25,
    currency: 'AED',
    date: dayjs().subtract(4, 'day').toDate(),
    driverId: 'EMP-008',
    driverName: 'James Brown',
    receiptNumber: 'RCP-006-2024',
    vendor: 'Quick Fix Garage',
    isReimbursable: true,
    status: 'approved',
    approvedBy: 'EMP-003',
    approvedAt: dayjs().subtract(4, 'day').add(2, 'hour').toDate(),
    createdAt: dayjs().subtract(4, 'day').toDate(),
    updatedAt: dayjs().subtract(4, 'day').add(2, 'hour').toDate(),
    createdBy: 'EMP-008',
    updatedBy: 'EMP-003',
  },
  {
    id: 'EXP-007',
    title: 'Office Supplies',
    description: 'Delivery forms and stationery',
    category: 'others',
    amount: 45.75,
    currency: 'AED',
    date: dayjs().subtract(6, 'day').toDate(),
    receiptNumber: 'RCP-007-2024',
    vendor: 'Office Depot',
    isReimbursable: true,
    status: 'rejected',
    rejectedReason: 'Not related to vehicle operations',
    createdAt: dayjs().subtract(6, 'day').toDate(),
    updatedAt: dayjs().subtract(6, 'day').add(1, 'hour').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-001',
  },
  {
    id: 'EXP-008',
    title: 'Fuel Refill - Route B',
    description: 'Regular fuel refill for Route B vehicle',
    category: 'petrol',
    amount: 165.5,
    currency: 'AED',
    date: dayjs().subtract(1, 'day').toDate(),
    driverId: 'EMP-005',
    driverName: 'Ali Ahmed',
    receiptNumber: 'RCP-008-2024',
    vendor: 'ENOC Station - Marina',
    isReimbursable: true,
    status: 'pending',
    createdAt: dayjs().subtract(1, 'day').toDate(),
    updatedAt: dayjs().subtract(1, 'day').toDate(),
    createdBy: 'EMP-005',
  },
];

export function AdditionalExpenseProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [expenses, setExpenses] = React.useState<AdditionalExpense[]>(initialExpenses);

  const getExpenseById = React.useCallback((id: string): AdditionalExpense | undefined => {
    return expenses.find(expense => expense.id === id);
  }, [expenses]);

  const addExpense = React.useCallback((expenseData: Omit<AdditionalExpense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExpense: AdditionalExpense = {
      ...expenseData,
      id: `EXP-${String(expenses.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setExpenses(prev => [...prev, newExpense]);
  }, [expenses.length]);

  const updateExpense = React.useCallback((id: string, updates: Partial<AdditionalExpense>) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === id 
          ? { ...expense, ...updates, updatedAt: new Date() }
          : expense
      )
    );
  }, []);

  const deleteExpense = React.useCallback((id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  }, []);

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

  const approveExpense = React.useCallback((id: string, approvedBy: string) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === id 
          ? { 
              ...expense, 
              status: 'approved' as const,
              approvedBy,
              approvedAt: new Date(),
              updatedAt: new Date(),
              updatedBy: approvedBy
            }
          : expense
      )
    );
  }, []);

  const rejectExpense = React.useCallback((id: string, rejectedBy: string, reason: string) => {
    setExpenses(prev => 
      prev.map(expense => 
        expense.id === id 
          ? { 
              ...expense, 
              status: 'rejected' as const,
              rejectedReason: reason,
              updatedAt: new Date(),
              updatedBy: rejectedBy
            }
          : expense
      )
    );
  }, []);

  const value: AdditionalExpenseContextType = {
    expenses,
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
