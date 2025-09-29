'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export type Category = 'bakery' | 'fresh';
export type TransferType = 'no_transfer' | 'product_transferred' | 'product_accepted';

export interface TripProduct {
  productId: string;
  productName: string;
  category: Category;
  quantity: number;
  unitPrice: number;
}

export interface ProductTransfer {
  type: TransferType;
  fromDriverId?: string;
  toDriverId?: string;
  products: TripProduct[];
}

export interface DailyTrip {
  id: string;
  driverId: string;
  driverName: string;
  date: Date;
  transfer: ProductTransfer;
  // Financial fields
  collectionAmount: number;
  purchaseAmount: number;
  expiry: number; // Expiry amount in AED
  discount: number; // Discount amount in AED
  // Calculated totals
  totalAmount: number;
  netTotal: number;
  grandTotal: number;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Employee ID who created this trip
  updatedBy?: string; // Employee ID who last updated this trip
}

interface DailyTripContextType {
  trips: DailyTrip[];
  getTripById: (id: string) => DailyTrip | undefined;
  addTrip: (trip: Omit<DailyTrip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTrip: (id: string, updates: Partial<DailyTrip>) => void;
  deleteTrip: (id: string) => void;
  getTripsByDriver: (driverId: string) => DailyTrip[];
  getTripsByDateRange: (startDate: Date, endDate: Date) => DailyTrip[];
}

const DailyTripContext = React.createContext<DailyTripContextType | undefined>(undefined);

// Sample data - 2 daily trips with different drivers
const initialTrips: DailyTrip[] = [
  {
    id: 'TRP-001',
    driverId: 'EMP-004', // Rahul Kumar
    driverName: 'Rahul Kumar',
    date: dayjs().subtract(1, 'day').utc().toDate(),
    transfer: {
      type: 'no_transfer',
      products: [
        // Bakery items
        { productId: 'PRD-019', productName: 'Sourdough Bread', category: 'bakery', quantity: 5, unitPrice: 12.5 },
        { productId: 'PRD-020', productName: 'Blueberry Muffin', category: 'bakery', quantity: 8, unitPrice: 8 },
        { productId: 'PRD-021', productName: 'Croissant', category: 'bakery', quantity: 6, unitPrice: 6.5 },
        { productId: 'PRD-022', productName: 'Whole Wheat Loaf', category: 'bakery', quantity: 4, unitPrice: 10.75 },
        { productId: 'PRD-023', productName: 'Chocolate Chip Cookie', category: 'bakery', quantity: 12, unitPrice: 3.25 },
        { productId: 'PRD-024', productName: 'Cinnamon Roll', category: 'bakery', quantity: 6, unitPrice: 7.5 },
        // Fresh items
        { productId: 'PRD-001', productName: 'Fresh Apples', category: 'fresh', quantity: 10, unitPrice: 15 },
        { productId: 'PRD-002', productName: 'Bananas', category: 'fresh', quantity: 8, unitPrice: 8.5 },
        { productId: 'PRD-003', productName: 'Orange Juice', category: 'fresh', quantity: 6, unitPrice: 12 },
        { productId: 'PRD-004', productName: 'Strawberries', category: 'fresh', quantity: 4, unitPrice: 18.75 },
        { productId: 'PRD-005', productName: 'Grapes', category: 'fresh', quantity: 5, unitPrice: 14.25 },
        { productId: 'PRD-006', productName: 'Mango', category: 'fresh', quantity: 3, unitPrice: 22.5 },
      ],
    },
    collectionAmount: 850.5,
    purchaseAmount: 720.25,
    expiry: 25.5,
    discount: 42.75,
    totalAmount: 850.5,
    netTotal: 720.25,
    grandTotal: 756.26,
    createdAt: dayjs().subtract(1, 'day').utc().toDate(),
    updatedAt: dayjs().subtract(1, 'day').utc().toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
  },
  {
    id: 'TRP-002',
    driverId: 'EMP-005', // Ali Ahmed
    driverName: 'Ali Ahmed',
    date: dayjs().subtract(2, 'day').utc().toDate(),
    transfer: {
      type: 'product_transferred',
      fromDriverId: 'EMP-006', // David Wilson
      toDriverId: 'EMP-005', // Ali Ahmed
      products: [
        // Bakery items transferred
        { productId: 'PRD-025', productName: 'Bagel', category: 'bakery', quantity: 10, unitPrice: 4 },
        { productId: 'PRD-026', productName: 'Danish Pastry', category: 'bakery', quantity: 8, unitPrice: 5.75 },
        { productId: 'PRD-027', productName: 'Pretzel', category: 'bakery', quantity: 15, unitPrice: 3.5 },
        { productId: 'PRD-028', productName: 'Donut', category: 'bakery', quantity: 20, unitPrice: 2.75 },
        // Fresh items transferred
        { productId: 'PRD-007', productName: 'Pineapple', category: 'fresh', quantity: 3, unitPrice: 16 },
        { productId: 'PRD-008', productName: 'Watermelon', category: 'fresh', quantity: 2, unitPrice: 25 },
        { productId: 'PRD-009', productName: 'Lettuce', category: 'fresh', quantity: 8, unitPrice: 6.5 },
        { productId: 'PRD-010', productName: 'Tomatoes', category: 'fresh', quantity: 6, unitPrice: 9.75 },
      ],
    },
    collectionAmount: 420.75,
    purchaseAmount: 380.5,
    expiry: 15.25,
    discount: 18.5,
    totalAmount: 420.75,
    netTotal: 380.5,
    grandTotal: 392.52,
    createdAt: dayjs().subtract(2, 'day').utc().toDate(),
    updatedAt: dayjs().subtract(2, 'day').utc().toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
  },
];

// Helper function to calculate totals (moved from daily-trip page)
const calculateTotals = (products: TripProduct[]) => {
  const freshProducts = products.filter(p => p.category === 'fresh');
  const bakeryProducts = products.filter(p => p.category === 'bakery');

  const freshTotal = freshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const bakeryTotal = bakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  const freshNetTotal = freshTotal * (1 - 0.115); // 11.5% reduction
  const bakeryNetTotal = bakeryTotal * (1 - 0.16); // 16% reduction

  const freshGrandTotal = freshNetTotal * 1.05; // 5% addition
  const bakeryGrandTotal = bakeryNetTotal * 1.05; // 5% addition

  return {
    fresh: { total: freshTotal, netTotal: freshNetTotal, grandTotal: freshGrandTotal },
    bakery: { total: bakeryTotal, netTotal: bakeryNetTotal, grandTotal: bakeryGrandTotal },
    overall: { 
      total: freshTotal + bakeryTotal, 
      netTotal: freshNetTotal + bakeryNetTotal, 
      grandTotal: freshGrandTotal + bakeryGrandTotal 
    },
  };
};

export function DailyTripProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [trips, setTrips] = React.useState<DailyTrip[]>(initialTrips);

  const getTripById = React.useCallback((id: string): DailyTrip | undefined => {
    return trips.find(trip => trip.id === id);
  }, [trips]);

  const addTrip = React.useCallback((tripData: Omit<DailyTrip, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Calculate totals based on products
    const totals = calculateTotals(tripData.transfer.products);
    
    const newTrip: DailyTrip = {
      ...tripData,
      id: `TRP-${String(trips.length + 1).padStart(3, '0')}`,
      totalAmount: totals.overall.total,
      netTotal: totals.overall.netTotal,
      grandTotal: totals.overall.grandTotal,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTrips(prev => [...prev, newTrip]);
  }, [trips.length]);

  const updateTrip = React.useCallback((id: string, updates: Partial<DailyTrip>) => {
    setTrips(prev => 
      prev.map(trip => {
        if (trip.id === id) {
          const updatedTrip = { ...trip, ...updates, updatedAt: new Date() };
          // Recalculate totals if products changed
          if (updates.transfer?.products) {
            const totals = calculateTotals(updates.transfer.products);
            updatedTrip.totalAmount = totals.overall.total;
            updatedTrip.netTotal = totals.overall.netTotal;
            updatedTrip.grandTotal = totals.overall.grandTotal;
          }
          return updatedTrip;
        }
        return trip;
      })
    );
  }, []);

  const deleteTrip = React.useCallback((id: string) => {
    setTrips(prev => prev.filter(trip => trip.id !== id));
  }, []);

  const getTripsByDriver = React.useCallback((driverId: string): DailyTrip[] => {
    return trips.filter(trip => trip.driverId === driverId);
  }, [trips]);

  const getTripsByDateRange = React.useCallback((startDate: Date, endDate: Date): DailyTrip[] => {
    return trips.filter(trip => {
      const tripDate = dayjs(trip.date);
      return tripDate.isAfter(dayjs(startDate)) && tripDate.isBefore(dayjs(endDate));
    });
  }, [trips]);

  const value: DailyTripContextType = {
    trips,
    getTripById,
    addTrip,
    updateTrip,
    deleteTrip,
    getTripsByDriver,
    getTripsByDateRange,
  };

  return (
    <DailyTripContext.Provider value={value}>
      {children}
    </DailyTripContext.Provider>
  );
}

export function useDailyTrips(): DailyTripContextType {
  const context = React.useContext(DailyTripContext);
  if (context === undefined) {
    throw new Error('useDailyTrips must be used within a DailyTripProvider');
  }
  return context;
}
