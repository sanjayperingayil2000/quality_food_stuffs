'use client';

import * as React from 'react';
import { EmployeeProvider } from './employee-context';
import { ProductProvider } from './product-context';
import { DailyTripProvider } from './daily-trip-context';
import { AdditionalExpenseProvider } from './additional-expense-context';

interface AppContextProviderProps {
  children: React.ReactNode;
}

export function AppContextProvider({ children }: AppContextProviderProps): React.JSX.Element {
  return (
    <EmployeeProvider>
      <ProductProvider>
        <DailyTripProvider>
          <AdditionalExpenseProvider>
            {children}
          </AdditionalExpenseProvider>
        </DailyTripProvider>
      </ProductProvider>
    </EmployeeProvider>
  );
}
