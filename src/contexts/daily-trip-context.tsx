'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export type Category = 'bakery' | 'fresh';

export interface TripProduct {
  productId: string;
  productName: string;
  category: Category;
  quantity: number;
  unitPrice: number;
  transferredFromDriverId?: string;
  transferredFromDriverName?: string;
}

export interface TransferredProduct extends TripProduct {
  receivingDriverId: string;
  receivingDriverName: string;
  transferredFromDriverId: string;
  transferredFromDriverName: string;
}

export interface ProductTransfer {
  isProductTransferred: boolean;
  transferredProducts: TransferredProduct[];
}

export interface DailyTrip {
  id: string;
  driverId: string;
  driverName: string;
  date: Date;
  products: TripProduct[]; // Regular products in the trip
  transfer: ProductTransfer; // Product transfer information
  acceptedProducts: TripProduct[]; // Products accepted from other drivers
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
  getTripByDriverAndDate: (driverId: string, date: Date) => DailyTrip | undefined;
  canAddTripForDriver: (driverId: string, date: Date) => boolean;
}

const DailyTripContext = React.createContext<DailyTripContextType | undefined>(undefined);

// Sample data - 2 daily trips with different drivers
const initialTrips: DailyTrip[] = [
  {
    id: 'TRP-001',
    driverId: 'EMP-006', // David Wilson
    driverName: 'David Wilson',
    date: dayjs().utc().toDate(), // Today's date
    products: [
      // Bakery items
      { productId: 'PRD-019', productName: 'Sourdough Bread', category: 'bakery', quantity: 5, unitPrice: 12.5 },
      { productId: 'PRD-020', productName: 'Blueberry Muffin', category: 'bakery', quantity: 8, unitPrice: 8 },
      { productId: 'PRD-021', productName: 'Croissant', category: 'bakery', quantity: 6, unitPrice: 6.5 },
      // Fresh items
      { productId: 'PRD-001', productName: 'Fresh Apples', category: 'fresh', quantity: 10, unitPrice: 15 },
      { productId: 'PRD-002', productName: 'Bananas', category: 'fresh', quantity: 8, unitPrice: 8.5 },
      { productId: 'PRD-003', productName: 'Orange Juice', category: 'fresh', quantity: 6, unitPrice: 12 },
    ],
    transfer: {
      isProductTransferred: true,
      transferredProducts: [
        {
          productId: 'PRD-022',
          productName: 'Whole Wheat Loaf',
          category: 'bakery',
          quantity: 3,
          unitPrice: 10.75,
          receivingDriverId: 'EMP-004',
          receivingDriverName: 'Rahul Kumar',
          transferredFromDriverId: 'EMP-006',
          transferredFromDriverName: 'David Wilson',
        },
      ],
    },
    acceptedProducts: [],
    collectionAmount: 850.5,
    purchaseAmount: 720.25,
    expiry: 25.5,
    discount: 42.75,
    totalAmount: 850.5,
    netTotal: 720.25,
    grandTotal: 756.26,
    createdAt: dayjs().utc().toDate(),
    updatedAt: dayjs().utc().toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
  },
  {
    id: 'TRP-002',
    driverId: 'EMP-004', // Rahul Kumar
    driverName: 'Rahul Kumar',
    date: dayjs().utc().toDate(), // Today's date - same as David Wilson
    products: [
      { productId: 'PRD-024', productName: 'Cinnamon Roll', category: 'bakery', quantity: 6, unitPrice: 7.5 },
      { productId: 'PRD-004', productName: 'Strawberries', category: 'fresh', quantity: 4, unitPrice: 18.75 },
      { productId: 'PRD-005', productName: 'Grapes', category: 'fresh', quantity: 5, unitPrice: 14.25 },
    ],
    transfer: {
      isProductTransferred: false,
      transferredProducts: [],
    },
    acceptedProducts: [
      // Product accepted from David Wilson
      { 
        productId: 'PRD-022', 
        productName: 'Whole Wheat Loaf', 
        category: 'bakery', 
        quantity: 3, 
        unitPrice: 10.75,
        transferredFromDriverId: 'EMP-006',
        transferredFromDriverName: 'David Wilson',
      },
      // Product accepted from Ali Ahmed
      { 
        productId: 'PRD-001', 
        productName: 'Fresh Apples', 
        category: 'fresh', 
        quantity: 5, 
        unitPrice: 15,
        transferredFromDriverId: 'EMP-005',
        transferredFromDriverName: 'Ali Ahmed',
      },
    ],
    collectionAmount: 420.75,
    purchaseAmount: 380.5,
    expiry: 15.25,
    discount: 18.5,
    totalAmount: 420.75,
    netTotal: 380.5,
    grandTotal: 392.52,
    createdAt: dayjs().utc().toDate(),
    updatedAt: dayjs().utc().toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
  },
  {
    id: 'TRP-003',
    driverId: 'EMP-005', // Ali Ahmed
    driverName: 'Ali Ahmed',
    date: dayjs().utc().toDate(), // Today's date - same as others
    products: [
      { productId: 'PRD-006', productName: 'Mango', category: 'fresh', quantity: 3, unitPrice: 22.5 },
      { productId: 'PRD-007', productName: 'Pineapple', category: 'fresh', quantity: 3, unitPrice: 16 },
      { productId: 'PRD-008', productName: 'Watermelon', category: 'fresh', quantity: 2, unitPrice: 25 },
    ],
    transfer: {
      isProductTransferred: true,
      transferredProducts: [
        {
          productId: 'PRD-001',
          productName: 'Fresh Apples',
          category: 'fresh',
          quantity: 5,
          unitPrice: 15,
          receivingDriverId: 'EMP-004',
          receivingDriverName: 'Rahul Kumar',
          transferredFromDriverId: 'EMP-005',
          transferredFromDriverName: 'Ali Ahmed',
        },
      ],
    },
    acceptedProducts: [],
    collectionAmount: 320.5,
    purchaseAmount: 280.25,
    expiry: 15.5,
    discount: 22.75,
    totalAmount: 320.5,
    netTotal: 280.25,
    grandTotal: 294.26,
    createdAt: dayjs().utc().toDate(),
    updatedAt: dayjs().utc().toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
  },
];

// Helper function to calculate totals including transferred products
const calculateTotals = (products: TripProduct[], acceptedProducts: TripProduct[] = [], transferredProducts: TransferredProduct[] = []) => {
  // Combine regular products and accepted products
  const allProducts = [...products, ...acceptedProducts];
  
  // Calculate totals for regular products (including accepted)
  const freshProducts = allProducts.filter(p => p.category === 'fresh');
  const bakeryProducts = allProducts.filter(p => p.category === 'bakery');

  const freshTotal = freshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const bakeryTotal = bakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  // Calculate transferred products totals (to subtract from sender)
  const transferredTotal = transferredProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  const freshNetTotal = freshTotal * (1 - 0.115); // 11.5% reduction
  const bakeryNetTotal = bakeryTotal * (1 - 0.16); // 16% reduction

  const freshGrandTotal = freshNetTotal * 1.05; // 5% addition
  const bakeryGrandTotal = bakeryNetTotal * 1.05; // 5% addition

  return {
    fresh: { total: freshTotal, netTotal: freshNetTotal, grandTotal: freshGrandTotal },
    bakery: { total: bakeryTotal, netTotal: bakeryNetTotal, grandTotal: bakeryGrandTotal },
    transferred: { total: transferredTotal },
    overall: { 
      total: freshTotal + bakeryTotal - transferredTotal, 
      netTotal: freshNetTotal + bakeryNetTotal - (transferredTotal * 0.84), // Apply average reduction
      grandTotal: freshGrandTotal + bakeryGrandTotal - (transferredTotal * 0.84 * 1.05) // Apply average reduction and addition
    },
  };
};

export function DailyTripProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [trips, setTrips] = React.useState<DailyTrip[]>(initialTrips);

  const getTripById = React.useCallback((id: string): DailyTrip | undefined => {
    return trips.find(trip => trip.id === id);
  }, [trips]);

  const addTrip = React.useCallback((tripData: Omit<DailyTrip, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Calculate totals based on products, accepted products, and transferred products
    const totals = calculateTotals(
      tripData.products, 
      tripData.acceptedProducts, 
      tripData.transfer.transferredProducts
    );
    
    const newTrip: DailyTrip = {
      ...tripData,
      id: `TRP-${String(trips.length + 1).padStart(3, '0')}`,
      totalAmount: totals.overall.total,
      netTotal: totals.overall.netTotal,
      grandTotal: totals.overall.grandTotal,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTrips(prev => {
      const updatedTrips = [...prev, newTrip];
      
      // Handle product transfers - add accepted products to receiving drivers
      if (tripData.transfer.isProductTransferred && tripData.transfer.transferredProducts.length > 0) {
        // Group transferred products by receiving driver
        const productsByDriver = tripData.transfer.transferredProducts.reduce((acc, product) => {
          if (!acc[product.receivingDriverId]) {
            acc[product.receivingDriverId] = [];
          }
          acc[product.receivingDriverId].push({
            productId: product.productId,
            productName: product.productName,
            category: product.category,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
          });
          return acc;
        }, {} as Record<string, TripProduct[]>);

        // Add accepted products to each receiving driver's trip for the same date
        for (const [driverId, acceptedProducts] of Object.entries(productsByDriver)) {
          const driverTrip = updatedTrips.find(trip => 
            trip.driverId === driverId && 
            dayjs(trip.date).format('YYYY-MM-DD') === dayjs(newTrip.date).format('YYYY-MM-DD')
          );
          
          if (driverTrip) {
            // Add transfer source information to accepted products
            const enrichedAcceptedProducts = acceptedProducts.map(product => ({
              ...product,
              transferredFromDriverId: newTrip.driverId,
              transferredFromDriverName: newTrip.driverName,
            }));
            
            const updatedDriverTrip = {
              ...driverTrip,
              acceptedProducts: [...(driverTrip.acceptedProducts || []), ...enrichedAcceptedProducts],
            };
            
            // Recalculate totals for the receiving driver
            const driverTotals = calculateTotals(
              updatedDriverTrip.products,
              updatedDriverTrip.acceptedProducts,
              updatedDriverTrip.transfer.transferredProducts
            );
            
            updatedDriverTrip.totalAmount = driverTotals.overall.total;
            updatedDriverTrip.netTotal = driverTotals.overall.netTotal;
            updatedDriverTrip.grandTotal = driverTotals.overall.grandTotal;
            updatedDriverTrip.updatedAt = new Date();
            
            const driverTripIndex = updatedTrips.findIndex(trip => trip.id === driverTrip.id);
            updatedTrips[driverTripIndex] = updatedDriverTrip;
          }
        }
      }

      return updatedTrips;
    });
  }, [trips.length]);

  const updateTrip = React.useCallback((id: string, updates: Partial<DailyTrip>) => {
    setTrips(prev => 
      prev.map(trip => {
        if (trip.id === id) {
          const updatedTrip = { ...trip, ...updates, updatedAt: new Date() };
          
          // Recalculate totals if products, accepted products, or transferred products changed
          if (updates.products || updates.acceptedProducts || updates.transfer) {
            const totals = calculateTotals(
              updatedTrip.products,
              updatedTrip.acceptedProducts,
              updatedTrip.transfer.transferredProducts
            );
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

  const getTripByDriverAndDate = React.useCallback((driverId: string, date: Date): DailyTrip | undefined => {
    return trips.find(trip => 
      trip.driverId === driverId && 
      dayjs(trip.date).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
    );
  }, [trips]);

  const canAddTripForDriver = React.useCallback((driverId: string, date: Date): boolean => {
    const existingTrip = getTripByDriverAndDate(driverId, date);
    return !existingTrip;
  }, [getTripByDriverAndDate]);

  const value: DailyTripContextType = {
    trips,
    getTripById,
    addTrip,
    updateTrip,
    deleteTrip,
    getTripsByDriver,
    getTripsByDateRange,
    getTripByDriverAndDate,
    canAddTripForDriver,
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
