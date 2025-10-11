'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { initialEmployees } from './data/employeeList';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export type EmployeeDesignation = 'driver' | 'staff' | 'ceo';

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
  getEmployeeById: (id: string) => Employee | undefined;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

const EmployeeContext = React.createContext<EmployeeContextType | undefined>(undefined);

export function EmployeeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);

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

  const addEmployee = React.useCallback((employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: `EMP-${String(employees.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEmployees(prev => [...prev, newEmployee]);
  }, [employees.length]);

  const updateEmployee = React.useCallback((id: string, updates: Partial<Employee>) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === id
          ? { ...emp, ...updates, updatedAt: new Date() }
          : emp
      )
    );
  }, []);

  const deleteEmployee = React.useCallback((id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
  }, []);

  const value: EmployeeContextType = {
    employees,
    drivers,
    staff,
    ceo,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
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
