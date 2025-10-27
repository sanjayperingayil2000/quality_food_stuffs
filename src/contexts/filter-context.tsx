'use client';

import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';

export interface FilterState {
  selection: 'company' | 'driver';
  driver: string;
  dateRange: [Dayjs | null, Dayjs | null];
}

interface FilterContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  updateSelection: (selection: 'company' | 'driver') => void;
  updateDriver: (driver: string) => void;
  updateDateRange: (dateRange: [Dayjs | null, Dayjs | null]) => void;
}

const FilterContext = React.createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [filters, setFilters] = React.useState<FilterState>({
    selection: 'company',
    driver: 'All drivers',
    dateRange: [
      dayjs().subtract(1, 'day'), // From = yesterday
      dayjs().subtract(1, 'day'), // To = yesterday
    ],
  });

  const updateSelection = React.useCallback((selection: 'company' | 'driver') => {
    setFilters(prev => ({
      ...prev,
      selection,
      driver: selection === 'driver' ? 'All drivers' : 'All drivers',
    }));
  }, []);

  const updateDriver = React.useCallback((driver: string) => {
    setFilters(prev => ({
      ...prev,
      driver,
    }));
  }, []);

  const updateDateRange = React.useCallback((dateRange: [Dayjs | null, Dayjs | null]) => {
    setFilters(prev => ({
      ...prev,
      dateRange,
    }));
  }, []);

  const value: FilterContextType = {
    filters,
    setFilters,
    updateSelection,
    updateDriver,
    updateDateRange,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextType {
  const context = React.useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

