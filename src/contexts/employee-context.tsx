'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export type EmployeeDesignation = 'driver' | 'manager' | 'ceo';

export interface Employee {
  id: string;
  name: string;
  designation: EmployeeDesignation;
  phoneNumber: string;
  email: string;
  address: string;
  routeName?: string; // For drivers
  location?: string; // For drivers
  salary?: number; // For managers and CEO
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
  managers: Employee[];
  ceo: Employee[];
  getEmployeeById: (id: string) => Employee | undefined;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
}

const EmployeeContext = React.createContext<EmployeeContextType | undefined>(undefined);

// Sample data
const initialEmployees: Employee[] = [
  // CEO
  {
    id: 'EMP-001',
    name: 'Ahmed Al-Rashid',
    designation: 'ceo',
    phoneNumber: '+971 50 123 4567',
    email: 'ahmed.ceo@company.com',
    address: 'Dubai Marina, UAE',
    salary: 50_000,
    hireDate: dayjs().subtract(2, 'year').toDate(),
    isActive: true,
    createdAt: dayjs().subtract(2, 'year').toDate(),
    updatedAt: dayjs().subtract(1, 'month').toDate(),
  },
  
  // Managers
  {
    id: 'EMP-002',
    name: 'Sarah Johnson',
    designation: 'manager',
    phoneNumber: '+971 50 123 4568',
    email: 'sarah.manager@company.com',
    address: 'Jumeirah, Dubai, UAE',
    salary: 25_000,
    hireDate: dayjs().subtract(18, 'month').toDate(),
    isActive: true,
    createdAt: dayjs().subtract(18, 'month').toDate(),
    updatedAt: dayjs().subtract(2, 'week').toDate(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
  },
  {
    id: 'EMP-003',
    name: 'Mohammed Hassan',
    designation: 'manager',
    phoneNumber: '+971 50 123 4569',
    email: 'mohammed.manager@company.com',
    address: 'Downtown Dubai, UAE',
    salary: 25_000,
    hireDate: dayjs().subtract(15, 'month').toDate(),
    isActive: true,
    createdAt: dayjs().subtract(15, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-002',
  },
  
  // Drivers
  {
    id: 'EMP-004',
    name: 'Rahul Kumar',
    designation: 'driver',
    phoneNumber: '+971 50 123 4570',
    email: 'rahul.driver@company.com',
    address: 'Deira, Dubai, UAE',
    routeName: 'Route A - Downtown',
    location: 'Downtown Dubai',
    hireDate: dayjs().subtract(12, 'month').toDate(),
    isActive: true,
    createdAt: dayjs().subtract(12, 'month').toDate(),
    updatedAt: dayjs().subtract(3, 'day').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
  },
  {
    id: 'EMP-005',
    name: 'Ali Ahmed',
    designation: 'driver',
    phoneNumber: '+971 50 123 4571',
    email: 'ali.driver@company.com',
    address: 'Bur Dubai, UAE',
    routeName: 'Route B - Marina',
    location: 'Dubai Marina',
    hireDate: dayjs().subtract(10, 'month').toDate(),
    isActive: true,
    createdAt: dayjs().subtract(10, 'month').toDate(),
    updatedAt: dayjs().subtract(2, 'day').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
  },
  {
    id: 'EMP-006',
    name: 'David Wilson',
    designation: 'driver',
    phoneNumber: '+971 50 123 4572',
    email: 'david.driver@company.com',
    address: 'Jumeirah, Dubai, UAE',
    routeName: 'Route C - JBR',
    location: 'Jumeirah Beach Residence',
    hireDate: dayjs().subtract(8, 'month').toDate(),
    isActive: true,
    createdAt: dayjs().subtract(8, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'day').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
  },
  {
    id: 'EMP-007',
    name: 'Fatima Al-Zahra',
    designation: 'driver',
    phoneNumber: '+971 50 123 4573',
    email: 'fatima.driver@company.com',
    address: 'Sharjah, UAE',
    routeName: 'Route D - Sharjah',
    location: 'Sharjah City',
    hireDate: dayjs().subtract(6, 'month').toDate(),
    isActive: true,
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(4, 'hour').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
  },
  {
    id: 'EMP-008',
    name: 'James Brown',
    designation: 'driver',
    phoneNumber: '+971 50 123 4574',
    email: 'james.driver@company.com',
    address: 'Abu Dhabi, UAE',
    routeName: 'Route E - Abu Dhabi',
    location: 'Abu Dhabi City',
    hireDate: dayjs().subtract(4, 'month').toDate(),
    isActive: true,
    createdAt: dayjs().subtract(4, 'month').toDate(),
    updatedAt: dayjs().subtract(2, 'hour').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
  },
];

export function EmployeeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees);

  const drivers = React.useMemo(() => 
    employees.filter(emp => emp.designation === 'driver' && emp.isActive), 
    [employees]
  );

  const managers = React.useMemo(() => 
    employees.filter(emp => emp.designation === 'manager' && emp.isActive), 
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
    managers,
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
