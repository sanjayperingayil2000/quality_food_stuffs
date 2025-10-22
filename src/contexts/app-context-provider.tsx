'use client';

import * as React from 'react';
import { EmployeeProvider } from './employee-context';
import { ProductProvider } from './product-context';
import { DailyTripProvider } from './daily-trip-context';
import { AdditionalExpenseProvider } from './additional-expense-context';
import { NotificationProvider } from './notification-context';
import { NotificationContainer } from '@/components/notifications/notification-container';

interface AppContextProviderProps {
  children: React.ReactNode;
}

export function AppContextProvider({ children }: AppContextProviderProps): React.JSX.Element {
  return (
    <NotificationProvider>
      <EmployeeProvider>
        <ProductProvider>
          <DailyTripProvider>
            <AdditionalExpenseProvider>
              {children}
              <NotificationContainer />
            </AdditionalExpenseProvider>
          </DailyTripProvider>
        </ProductProvider>
      </EmployeeProvider>
    </NotificationProvider>
  );
}
