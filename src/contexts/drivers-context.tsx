'use client';

import * as React from 'react';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  location: string;
  routeName: string;
}

interface DriversContextType {
  drivers: Driver[];
  addDriver: (driver: Driver) => void;
  updateDriver: (id: string, updates: Partial<Driver>) => void;
  deleteDriver: (id: string) => void;
}

const DriversContext = React.createContext<DriversContextType | undefined>(undefined);

// Sample initial drivers - in a real app, this would come from an API
const initialDrivers: Driver[] = [
  { id: 'DRV-001', name: 'Rahul Kumar', phone: '98765 43210', location: 'Coimbatore', routeName: 'CBE → Pollachi' },
  { id: 'DRV-002', name: 'Vijay Anand', phone: '90909 11223', location: 'Pollachi', routeName: 'Pollachi → Udumalpet' },
  { id: 'DRV-003', name: 'Karthik', phone: '90031 77889', location: 'Udumalpet', routeName: 'Udumalpet → Tiruppur' },
  { id: 'DRV-004', name: 'Senthil', phone: '95001 22334', location: 'Tiruppur', routeName: 'Tiruppur → Erode' },
  { id: 'DRV-005', name: 'Suresh', phone: '96555 33445', location: 'Erode', routeName: 'Erode → Coimbatore' },
];

export function DriversProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = React.useState<Driver[]>(initialDrivers);

  const addDriver = React.useCallback((driver: Driver) => {
    setDrivers(prev => [...prev, driver]);
  }, []);

  const updateDriver = React.useCallback((id: string, updates: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const deleteDriver = React.useCallback((id: string) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
  }, []);

  const value = React.useMemo(() => ({
    drivers,
    addDriver,
    updateDriver,
    deleteDriver,
  }), [drivers, addDriver, updateDriver, deleteDriver]);

  return <DriversContext.Provider value={value}>{children}</DriversContext.Provider>;
}

export function useDrivers(): DriversContextType {
  const context = React.useContext(DriversContext);
  if (context === undefined) {
    throw new Error('useDrivers must be used within a DriversProvider');
  }
  return context;
}
