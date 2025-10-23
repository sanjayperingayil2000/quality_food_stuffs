'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useEmployees } from './employee-context';
import { apiClient } from '@/lib/api-client';
import { freshProducts } from './data/fresh-products';
import { bakeryProducts } from './data/bakery-products';
import { useUser } from '@/hooks/use-user';

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
  date: string;
  products: TripProduct[]; // Regular products in the trip
  transfer: ProductTransfer; // Product transfer information
  acceptedProducts: TripProduct[]; // Products accepted from other drivers
  // Financial fields
  collectionAmount: number;
  purchaseAmount: number;
  expiry: number; // Expiry amount in AED
  discount: number; // Discount amount in AED
  petrol: number; // Petrol amount in AED
  balance: number; // Balance amount in AED (auto-calculated or set)
  // Calculated totals
  totalAmount: number;
  netTotal: number;
  grandTotal: number;
  // New calculated fields
  expiryAfterTax: number; // ((expiry + 5%) - 13%)
  amountToBe: number; // Purchase amount - Expiry after tax
  salesDifference: number; // Collection amount - Amount to be
  profit: number; // (13.5% of (Net Total of fresh - Expiry after tax)) + (19.5% of net total of bakery) - Discount
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // Employee ID who created this trip
  updatedBy?: string; // Employee ID who last updated this trip
}

interface DailyTripContextType {
  trips: DailyTrip[];
  isLoading: boolean;
  error: string | null;
  getTripById: (id: string) => DailyTrip | undefined;
  addTrip: (trip: Omit<DailyTrip, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTrip: (id: string, updates: Partial<DailyTrip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  getTripsByDriver: (driverId: string) => DailyTrip[];
  getTripsByDateRange: (startDate: Date, endDate: Date) => DailyTrip[];
  getTripByDriverAndDate: (driverId: string, date: string) => DailyTrip | undefined;
  canAddTripForDriver: (driverId: string, date: string) => boolean;
  refreshTrips: () => Promise<void>;
}

const DailyTripContext = React.createContext<DailyTripContextType | undefined>(undefined);

// Helper function to calculate totals including transferred products
const calculateTotals = (products: TripProduct[], acceptedProducts: TripProduct[] = [], transferredProducts: TransferredProduct[] = []) => {
  // Combine regular products and accepted products
  const allProducts = [...products, ...acceptedProducts];
  
  // Calculate totals for regular products (including accepted)
  const freshProducts = allProducts.filter(p => p.category === 'fresh');
  const bakeryProducts = allProducts.filter(p => p.category === 'bakery');

  const freshTotal = freshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const bakeryTotal = bakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  // Calculate accepted products totals by category
  const acceptedFreshProducts = acceptedProducts.filter(p => p.category === 'fresh');
  const acceptedBakeryProducts = acceptedProducts.filter(p => p.category === 'bakery');
  const acceptedFreshTotal = acceptedFreshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const acceptedBakeryTotal = acceptedBakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);

  // Calculate transferred products totals by category (to subtract from sender)
  const transferredFreshProducts = transferredProducts.filter(p => p.category === 'fresh');
  const transferredBakeryProducts = transferredProducts.filter(p => p.category === 'bakery');
  
  const transferredFreshTotal = transferredFreshProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const transferredBakeryTotal = transferredBakeryProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const transferredTotal = transferredFreshTotal + transferredBakeryTotal;

  // Calculate net totals after subtracting transferred products by category
  const freshNetTotal = (freshTotal - transferredFreshTotal) * (1 - 0.115); // 11.5% reduction
  const bakeryNetTotal = (bakeryTotal - transferredBakeryTotal) * (1 - 0.16); // 16% reduction

  const freshGrandTotal = freshNetTotal * 1.05; // 5% addition
  const bakeryGrandTotal = bakeryNetTotal * 1.05; // 5% addition

  return {
    fresh: { 
      total: freshTotal, 
      accepted: acceptedFreshTotal,
      transferred: transferredFreshTotal,
      netTotal: freshNetTotal, 
      grandTotal: freshGrandTotal 
    },
    bakery: { 
      total: bakeryTotal, 
      accepted: acceptedBakeryTotal,
      transferred: transferredBakeryTotal,
      netTotal: bakeryNetTotal, 
      grandTotal: bakeryGrandTotal 
    },
    transferred: { 
      total: transferredTotal,
      fresh: transferredFreshTotal,
      bakery: transferredBakeryTotal
    },
    overall: { 
      total: freshTotal + bakeryTotal - transferredTotal, 
      netTotal: freshNetTotal + bakeryNetTotal,
      grandTotal: freshGrandTotal + bakeryGrandTotal
    },
  };
};

// Helper function to calculate all financial metrics for a trip
interface CalculatedMetrics {
  expiryAfterTax: number;
  amountToBe: number;
  salesDifference: number;
  profit: number;
  balance: number;
}

const calculateFinancialMetrics = (
  expiry: number,
  purchaseAmount: number,
  collectionAmount: number,
  discount: number,
  freshNetTotal: number,
  bakeryNetTotal: number,
  previousBalance: number
): CalculatedMetrics => {
  // 1. Expiry after tax = ((expiry + 5%) - 13%)
  const expiryAfterTaxRaw = expiry * 1.05 * 0.87;
  
  // Floor expiry after tax: always round down (23.23 or 23.97 = 23)
  const expiryAfterTax = Math.floor(expiryAfterTaxRaw);
  
  // 2. Amount to be = Purchase amount - Expiry after tax (using rounded value)
  const amountToBe = purchaseAmount - expiryAfterTax;
  
  // 3. Sales Difference = Collection amount - Amount to be (fixed calculation)
  const salesDifference = collectionAmount - amountToBe;
  
  // 4. Profit = (13.5% of (Net Total of fresh - Expiry after tax)) + (19.5% of net total of bakery) - Discount
  const freshProfit = (freshNetTotal - expiryAfterTax) * 0.135;
  const bakeryProfit = bakeryNetTotal * 0.195;
  const profit = freshProfit + bakeryProfit - discount;
  
  // 5. Balance = previous balance + current profit - current sales difference
  const balance = Math.round(previousBalance + profit - salesDifference);
  
  return {
    expiryAfterTax,
    amountToBe,
    salesDifference,
    profit,
    balance
  };
};

// Helper function to generate products for each driver
const generateDriverProducts = (driverIndex: number, _dayOffset: number): TripProduct[] => {
  const products: TripProduct[] = [];
  
  // Add 35 fresh products
  for (let i = 0; i < 35; i++) {
    const productIndex = (driverIndex * 35 + i) % freshProducts.length;
    const product = freshProducts[productIndex];
    products.push({
      productId: product.id,
      productName: product.name,
      category: 'fresh',
      quantity: Math.floor(Math.random() * 10) + 1, // Random quantity between 1-10
      unitPrice: product.price,
    });
  }
  
  // Add 15 bakery products
  for (let i = 0; i < 15; i++) {
    const productIndex = (driverIndex * 15 + i) % bakeryProducts.length;
    const product = bakeryProducts[productIndex];
    products.push({
      productId: product.id,
      productName: product.name,
      category: 'bakery',
      quantity: Math.floor(Math.random() * 8) + 1, // Random quantity between 1-8
      unitPrice: product.price,
    });
  }
  
  return products;
};

// Generate comprehensive daily trip data for last 10 days
const _generateDailyTrips = (): DailyTrip[] => {
  const trips: DailyTrip[] = [];
  let tripId = 1;

  // Generate trips for last 10 days
  for (let dayOffset = 9; dayOffset >= 0; dayOffset--) {
    const currentDate = dayjs().subtract(dayOffset, 'day').utc().format('YYYY-MM-DD');
    
    // Day-specific scenarios
    // eslint-disable-next-line unicorn/prefer-switch
    if (dayOffset === 0) {
      // Today - Multiple transfers to Rahul
      trips.push(
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-006',
          driverName: 'David Wilson',
          date: currentDate,
          products: [
            { productId: 'PRD-019', productName: 'Sourdough Bread', category: 'bakery', quantity: 5, unitPrice: 12.5 },
            { productId: 'PRD-020', productName: 'Blueberry Muffin', category: 'bakery', quantity: 8, unitPrice: 8 },
            { productId: 'PRD-001', productName: 'Fresh Apples', category: 'fresh', quantity: 10, unitPrice: 15 },
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
          collectionAmount: 650.5,
          purchaseAmount: 580.25,
          expiry: 20.5,
          discount: 35.75,
          petrol: 150,
          balance: 100,
          totalAmount: 650.5,
          netTotal: 580.25,
          grandTotal: 609.26,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-002',
          updatedBy: 'EMP-002',
        },
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-005',
          driverName: 'Ali Ahmed',
          date: currentDate,
          products: [
            { productId: 'PRD-006', productName: 'Mango', category: 'fresh', quantity: 3, unitPrice: 22.5 },
            { productId: 'PRD-007', productName: 'Pineapple', category: 'fresh', quantity: 3, unitPrice: 16 },
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
          collectionAmount: 280.5,
          purchaseAmount: 250.25,
          expiry: 12.5,
          discount: 18.75,
          petrol: 120,
          balance: 80,
          totalAmount: 280.5,
          netTotal: 250.25,
          grandTotal: 262.76,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-002',
          updatedBy: 'EMP-002',
        },
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-004',
          driverName: 'Rahul Kumar',
          date: currentDate,
          products: [
            { productId: 'PRD-024', productName: 'Cinnamon Roll', category: 'bakery', quantity: 6, unitPrice: 7.5 },
            { productId: 'PRD-004', productName: 'Strawberries', category: 'fresh', quantity: 4, unitPrice: 18.75 },
          ],
          transfer: {
            isProductTransferred: false,
            transferredProducts: [],
          },
          acceptedProducts: [
            { 
              productId: 'PRD-022', 
              productName: 'Whole Wheat Loaf', 
              category: 'bakery', 
              quantity: 3, 
              unitPrice: 10.75,
              transferredFromDriverId: 'EMP-006',
              transferredFromDriverName: 'David Wilson',
            },
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
          collectionAmount: 320.75,
          purchaseAmount: 290.5,
          expiry: 12.25,
          discount: 18.5,
          petrol: 130,
          balance: 90,
          totalAmount: 320.75,
          netTotal: 290.5,
          grandTotal: 305.03,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-003',
          updatedBy: 'EMP-003',
        }
      );

    } else if (dayOffset === 1) {
      // Yesterday - Fatima transfers to James, James accepts
      trips.push(
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-007',
          driverName: 'Fatima Al-Zahra',
          date: currentDate,
          products: [
            { productId: 'PRD-011', productName: 'Bread Loaf', category: 'bakery', quantity: 8, unitPrice: 6.5 },
            { productId: 'PRD-012', productName: 'Fresh Oranges', category: 'fresh', quantity: 12, unitPrice: 9.25 },
          ],
          transfer: {
            isProductTransferred: true,
            transferredProducts: [
              {
                productId: 'PRD-025',
                productName: 'Bagel',
                category: 'bakery',
                quantity: 10,
                unitPrice: 4,
                receivingDriverId: 'EMP-008',
                receivingDriverName: 'James Brown',
                transferredFromDriverId: 'EMP-007',
                transferredFromDriverName: 'Fatima Al-Zahra',
              },
            ],
          },
          acceptedProducts: [],
          collectionAmount: 380.5,
          purchaseAmount: 340.25,
          expiry: 15.25,
          discount: 25.5,
          petrol: 140,
          balance: 95,
          totalAmount: 380.5,
          netTotal: 340.25,
          grandTotal: 357.26,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-003',
          updatedBy: 'EMP-003',
        },
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-008',
          driverName: 'James Brown',
          date: currentDate,
          products: [
            { productId: 'PRD-009', productName: 'Lettuce', category: 'fresh', quantity: 6, unitPrice: 6.5 },
            { productId: 'PRD-010', productName: 'Tomatoes', category: 'fresh', quantity: 8, unitPrice: 9.75 },
          ],
          transfer: {
            isProductTransferred: false,
            transferredProducts: [],
          },
          acceptedProducts: [
            { 
              productId: 'PRD-025', 
              productName: 'Bagel', 
              category: 'bakery', 
              quantity: 10, 
              unitPrice: 4,
              transferredFromDriverId: 'EMP-007',
              transferredFromDriverName: 'Fatima Al-Zahra',
            },
          ],
          collectionAmount: 290.5,
          purchaseAmount: 260.25,
          expiry: 10.25,
          discount: 20.5,
          petrol: 125,
          balance: 85,
          totalAmount: 290.5,
          netTotal: 260.25,
          grandTotal: 273.26,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-002',
          updatedBy: 'EMP-002',
        }
      );

    } else if (dayOffset === 2) {
      // 2 days ago - Multiple drivers, no transfers
      trips.push(
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-006',
          driverName: 'David Wilson',
          date: currentDate,
          products: [
            { productId: 'PRD-013', productName: 'Bell Peppers', category: 'fresh', quantity: 5, unitPrice: 11.5 },
            { productId: 'PRD-014', productName: 'Spinach', category: 'fresh', quantity: 4, unitPrice: 8.25 },
          ],
          transfer: {
            isProductTransferred: false,
            transferredProducts: [],
          },
          acceptedProducts: [],
          collectionAmount: 280.5,
          purchaseAmount: 250.25,
          expiry: 12.5,
          discount: 18.75,
          petrol: 118,
          balance: 78,
          totalAmount: 280.5,
          netTotal: 250.25,
          grandTotal: 262.76,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-002',
          updatedBy: 'EMP-002',
        },
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-004',
          driverName: 'Rahul Kumar',
          date: currentDate,
          products: [
            { productId: 'PRD-015', productName: 'Avocado', category: 'fresh', quantity: 3, unitPrice: 19.5 },
            { productId: 'PRD-016', productName: 'Lemons', category: 'fresh', quantity: 4, unitPrice: 6.75 },
          ],
          transfer: {
            isProductTransferred: false,
            transferredProducts: [],
          },
          acceptedProducts: [],
          collectionAmount: 320.25,
          purchaseAmount: 290.5,
          expiry: 15.75,
          discount: 14.5,
          petrol: 135,
          balance: 92,
          totalAmount: 320.25,
          netTotal: 290.5,
          grandTotal: 305.03,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-003',
          updatedBy: 'EMP-003',
        }
      );

    } else if (dayOffset === 3) {
      // 3 days ago - Rahul transfers to David and Ali
      trips.push(
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-004',
          driverName: 'Rahul Kumar',
          date: currentDate,
          products: [
            { productId: 'PRD-017', productName: 'Ginger', category: 'fresh', quantity: 2, unitPrice: 12.5 },
            { productId: 'PRD-018', productName: 'Garlic', category: 'fresh', quantity: 3, unitPrice: 9.25 },
          ],
          transfer: {
            isProductTransferred: true,
            transferredProducts: [
              {
                productId: 'PRD-026',
                productName: 'Danish Pastry',
                category: 'bakery',
                quantity: 8,
                unitPrice: 5.75,
                receivingDriverId: 'EMP-006',
                receivingDriverName: 'David Wilson',
                transferredFromDriverId: 'EMP-004',
                transferredFromDriverName: 'Rahul Kumar',
              },
              {
                productId: 'PRD-027',
                productName: 'Pretzel',
                category: 'bakery',
                quantity: 12,
                unitPrice: 3.5,
                receivingDriverId: 'EMP-005',
                receivingDriverName: 'Ali Ahmed',
                transferredFromDriverId: 'EMP-004',
                transferredFromDriverName: 'Rahul Kumar',
              },
            ],
          },
          acceptedProducts: [],
          collectionAmount: 220.5,
          purchaseAmount: 200.25,
          expiry: 8.5,
          discount: 12.75,
          petrol: 110,
          balance: 70,
          totalAmount: 220.5,
          netTotal: 200.25,
          grandTotal: 210.26,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-003',
          updatedBy: 'EMP-003',
        },
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-006',
          driverName: 'David Wilson',
          date: currentDate,
          products: [
            { productId: 'PRD-028', productName: 'Donut', category: 'bakery', quantity: 15, unitPrice: 2.75 },
          ],
          transfer: {
            isProductTransferred: false,
            transferredProducts: [],
          },
          acceptedProducts: [
            { 
              productId: 'PRD-026', 
              productName: 'Danish Pastry', 
              category: 'bakery', 
              quantity: 8, 
              unitPrice: 5.75,
              transferredFromDriverId: 'EMP-004',
              transferredFromDriverName: 'Rahul Kumar',
            },
          ],
          collectionAmount: 180.25,
          purchaseAmount: 160.5,
          expiry: 8.25,
          discount: 11.75,
          petrol: 105,
          balance: 65,
          totalAmount: 180.25,
          netTotal: 160.5,
          grandTotal: 168.53,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-002',
          updatedBy: 'EMP-002',
        },
        {
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId: 'EMP-005',
          driverName: 'Ali Ahmed',
          date: currentDate,
          products: [
            { productId: 'PRD-029', productName: 'Baguette', category: 'bakery', quantity: 4, unitPrice: 9.25 },
          ],
          transfer: {
            isProductTransferred: false,
            transferredProducts: [],
          },
          acceptedProducts: [
            { 
              productId: 'PRD-027', 
              productName: 'Pretzel', 
              category: 'bakery', 
              quantity: 12, 
              unitPrice: 3.5,
              transferredFromDriverId: 'EMP-004',
              transferredFromDriverName: 'Rahul Kumar',
            },
          ],
          collectionAmount: 160.25,
          purchaseAmount: 140.5,
          expiry: 8.75,
          discount: 11.5,
          petrol: 100,
          balance: 60,
          totalAmount: 160.25,
          netTotal: 140.5,
          grandTotal: 147.53,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-002',
          updatedBy: 'EMP-002',
        }
      );

    } else if (dayOffset >= 5) {
      // Days 5-9 (older days) - Use the new product generation for all drivers
      const drivers = ['EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008', 'EMP-009', 'EMP-010', 'EMP-011', 'EMP-012', 'EMP-013'];
      const driverNames = ['IQBAL', 'SEBEH', 'RASHEED', 'SHINOOF', 'ABHIJITH', 'AFSAL', 'RIJAS', 'FAROOK', 'SADIQUE', 'AJMAL'];
      
      // All drivers for these days
      for (const [index, driverId] of drivers.entries()) {
        const hasTransfer = Math.random() > 0.7; // 30% chance of transfer
        const receivingDriverIndex = Math.floor(Math.random() * drivers.length);
        
        trips.push({
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId,
          driverName: driverNames[index],
          date: currentDate,
          products: generateDriverProducts(index, dayOffset),
          transfer: {
            isProductTransferred: hasTransfer,
            transferredProducts: hasTransfer ? [
              {
                productId: `PRD-${String(dayOffset * 10 + index * 2 + 3).padStart(3, '0')}`,
                productName: `Transfer Product ${dayOffset}-${index}`,
                category: 'bakery',
                quantity: Math.floor(Math.random() * 5) + 1,
                unitPrice: Math.floor(Math.random() * 15) + 5,
                receivingDriverId: drivers[receivingDriverIndex],
                receivingDriverName: driverNames[receivingDriverIndex],
                transferredFromDriverId: driverId,
                transferredFromDriverName: driverNames[index],
              },
            ] : [],
          },
          acceptedProducts: [],
          collectionAmount: Math.floor(Math.random() * 500) + 200,
          purchaseAmount: Math.floor(Math.random() * 400) + 150,
          expiry: Math.floor(Math.random() * 50) + 10,
          discount: Math.floor(Math.random() * 30) + 5,
          petrol: Math.floor(Math.random() * 100) + 80,
          balance: Math.floor(Math.random() * 80) + 40,
          totalAmount: 0,
          netTotal: 0,
          grandTotal: 0,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-002',
          updatedBy: 'EMP-002',
        });
      }
    } else {
      // Days 3-4 - Various scenarios (keep original logic)
      const drivers = ['EMP-004', 'EMP-005', 'EMP-006', 'EMP-007', 'EMP-008'];
      const driverNames = ['Rahul Kumar', 'Ali Ahmed', 'David Wilson', 'Fatima Al-Zahra', 'James Brown'];
      
      // Randomly select 2-3 drivers for each day
      const numDrivers = Math.floor(Math.random() * 2) + 2; // 2-3 drivers
      const selectedDrivers = drivers.slice(0, numDrivers);
      const selectedNames = driverNames.slice(0, numDrivers);
      
      for (const [index, driverId] of selectedDrivers.entries()) {
        const hasTransfer = Math.random() > 0.7; // 30% chance of transfer
        const receivingDriverIndex = Math.floor(Math.random() * selectedDrivers.length);
        
        trips.push({
          id: `TRP-${String(tripId++).padStart(3, '0')}`,
          driverId,
          driverName: selectedNames[index],
          date: currentDate,
          products: [
            { productId: `PRD-${String(dayOffset * 10 + index * 2 + 1).padStart(3, '0')}`, productName: `Product ${dayOffset}-${index}-1`, category: 'bakery', quantity: Math.floor(Math.random() * 10) + 1, unitPrice: Math.floor(Math.random() * 20) + 5 },
            { productId: `PRD-${String(dayOffset * 10 + index * 2 + 2).padStart(3, '0')}`, productName: `Product ${dayOffset}-${index}-2`, category: 'fresh', quantity: Math.floor(Math.random() * 8) + 1, unitPrice: Math.floor(Math.random() * 25) + 8 },
          ],
          transfer: {
            isProductTransferred: hasTransfer,
            transferredProducts: hasTransfer ? [
              {
                productId: `PRD-${String(dayOffset * 10 + index * 2 + 3).padStart(3, '0')}`,
                productName: `Transfer Product ${dayOffset}-${index}`,
                category: 'bakery',
                quantity: Math.floor(Math.random() * 5) + 1,
                unitPrice: Math.floor(Math.random() * 15) + 5,
                receivingDriverId: selectedDrivers[receivingDriverIndex],
                receivingDriverName: selectedNames[receivingDriverIndex],
                transferredFromDriverId: driverId,
                transferredFromDriverName: selectedNames[index],
              },
            ] : [],
          },
          acceptedProducts: [],
          collectionAmount: Math.floor(Math.random() * 500) + 200,
          purchaseAmount: Math.floor(Math.random() * 400) + 150,
          expiry: Math.floor(Math.random() * 50) + 10,
          discount: Math.floor(Math.random() * 30) + 5,
          petrol: Math.floor(Math.random() * 100) + 80,
          balance: Math.floor(Math.random() * 80) + 40,
          totalAmount: 0,
          netTotal: 0,
          grandTotal: 0,
          expiryAfterTax: 0, // Will be calculated later
          amountToBe: 0, // Will be calculated later
          salesDifference: 0, // Will be calculated later
          profit: 0, // Will be calculated later
          createdAt: currentDate,
          updatedAt: currentDate,
          createdBy: 'EMP-002',
          updatedBy: 'EMP-002',
        });
      }
    }
  }

  // Post-process all trips to calculate financial metrics
  // Sort trips by date (oldest first) to ensure balance calculations are sequential
  trips.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  
  // Track previous balances for each driver
  const driverBalances: Record<string, number> = {};
  
  for (const trip of trips) {
    // Calculate totals for this trip
    const totals = calculateTotals(
      trip.products,
      trip.acceptedProducts || [],
      trip.transfer?.transferredProducts || []
    );
    
    // Get or initialize previous balance for this driver
    let previousBalance = driverBalances[trip.driverId];
    if (previousBalance === undefined) {
      // First trip for this driver, assign random balance between 100-200
      previousBalance = Math.round(Math.floor(Math.random() * 101) + 100);
    }
    
    // Calculate financial metrics
    const financialMetrics = calculateFinancialMetrics(
      trip.expiry,
      trip.purchaseAmount,
      trip.collectionAmount,
      trip.discount,
      totals.fresh.netTotal,
      totals.bakery.netTotal,
      previousBalance
    );
    
    // Update trip with calculated fields
    trip.expiryAfterTax = financialMetrics.expiryAfterTax;
    trip.amountToBe = financialMetrics.amountToBe;
    trip.salesDifference = financialMetrics.salesDifference;
    trip.profit = financialMetrics.profit;
    trip.balance = financialMetrics.balance;
    
    // Store the balance for this driver for next trip
    driverBalances[trip.driverId] = financialMetrics.balance;
  }

  return trips;
};

// Initialize empty; data will be fetched from API
const _initialTrips: DailyTrip[] = [];

export function DailyTripProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { user, isLoading: userLoading } = useUser();
  const [trips, setTrips] = React.useState<DailyTrip[]>([]);
  const [_isLoading, setIsLoading] = React.useState(true);
  const [_error, setError] = React.useState<string | null>(null);
  const [pendingTransfers, setPendingTransfers] = React.useState<Array<{
    id: string;
    date: string;
    receivingDriverId: string;
    products: TripProduct[];
    transferredFromDriverId: string;
    transferredFromDriverName: string;
  }>>([]);
  
  // Ref to track balance updates that need to be processed after state changes
  const balanceUpdatesRef = React.useRef<Array<{
    driverId: string;
    balance: number;
    reason: string;
    updatedBy: string;
  }>>([]);

  const refreshTrips = React.useCallback(async () => {
    // Don't load data if user is not authenticated yet
    if (userLoading || !user) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getDailyTrips();
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Get the daily trip data directly
      if (result.data?.trips) {
        setTrips(result.data.trips);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to fetch trips');
    } finally {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  React.useEffect(() => {
    refreshTrips();
  }, [refreshTrips]);

  // Get employee context to access driver balance
  const { getEmployeeById, updateDriverBalance } = useEmployees();

  // Process balance updates after state changes to avoid setState during render
  React.useEffect(() => {
    if (balanceUpdatesRef.current.length > 0) {
      const updates = [...balanceUpdatesRef.current];
      balanceUpdatesRef.current = []; // Clear the ref
      
      // Process each balance update
      for (const update of updates) {
        updateDriverBalance(update.driverId, update.balance, update.reason, update.updatedBy);
      }
    }
  }, [trips, updateDriverBalance]);

  // Helper to get previous balance for a driver
  const getPreviousBalance = React.useCallback((driverId: string, currentDate: Date, allTrips: DailyTrip[]): number => {
    // First, try to get the current balance from employee data
    const employee = getEmployeeById(driverId);
    if (employee && employee.designation === 'driver' && employee.balance !== undefined) {
      return employee.balance;
    }

    // Fallback: Get all trips for this driver before the current date, sorted by date descending
    const previousTrips = allTrips
      .filter(trip => 
        trip.driverId === driverId && 
        dayjs(trip.date).isBefore(dayjs(currentDate), 'day')
      )
      .sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    
    // If there are previous trips, return the balance from the most recent one
    if (previousTrips.length > 0) {
      return previousTrips[0].balance;
    }
    
    // For first trip, return a random balance between 100 and 200
    return Math.round(Math.floor(Math.random() * 101) + 100); // 100 to 200
  }, [getEmployeeById]);

  const getTripById = React.useCallback((id: string): DailyTrip | undefined => {
    return trips.find(trip => trip.id === id);
  }, [trips]);

  const addTrip = React.useCallback(async (tripData: Omit<DailyTrip, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Check for pending transfers for this driver and date
    const tripDate = dayjs(tripData.date).format('YYYY-MM-DD');
    const pendingForThisDriver = pendingTransfers.filter(
      transfer => transfer.receivingDriverId === tripData.driverId && transfer.date === tripDate
    );
    
    // Add pending transfers to accepted products
    const allAcceptedProducts = [
      ...(tripData.acceptedProducts || []),
      ...pendingForThisDriver.flatMap(transfer => 
        transfer.products.map(product => ({
          ...product,
          transferredFromDriverId: transfer.transferredFromDriverId,
          transferredFromDriverName: transfer.transferredFromDriverName,
        }))
      )
    ];
    
    // Calculate totals based on products, accepted products, and transferred products
    const totals = calculateTotals(
      tripData.products, 
      allAcceptedProducts, 
      tripData.transfer.transferredProducts
    );
    
    // Get previous balance for this driver
    const previousBalance = getPreviousBalance(tripData.driverId, new Date(tripData.date), trips);
    
    // Calculate all financial metrics
    const financialMetrics = calculateFinancialMetrics(
      tripData.expiry,
      tripData.purchaseAmount,
      tripData.collectionAmount,
      tripData.discount,
      totals.fresh.netTotal,
      totals.bakery.netTotal,
      previousBalance
    );
    
    const newTrip: DailyTrip = {
      ...tripData,
      acceptedProducts: allAcceptedProducts,
      id: `TRP-${String(trips.length + 1).padStart(3, '0')}`,
      totalAmount: totals.overall.total,
      netTotal: totals.overall.netTotal,
      grandTotal: totals.overall.grandTotal,
      expiryAfterTax: financialMetrics.expiryAfterTax,
      amountToBe: financialMetrics.amountToBe,
      salesDifference: financialMetrics.salesDifference,
      profit: financialMetrics.profit,
      balance: financialMetrics.balance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTrips(prev => {
      const updatedTrips = [...prev, newTrip];
      
      // Remove applied pending transfers
      if (pendingForThisDriver.length > 0) {
        setPendingTransfers(prev => 
          prev.filter(transfer => 
            !(transfer.receivingDriverId === tripData.driverId && transfer.date === tripDate)
          )
        );
      }
      
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
            
            // Get previous balance for the receiving driver
            const driverPreviousBalance = getPreviousBalance(driverId, new Date(updatedDriverTrip.date), updatedTrips);
            
            // Recalculate financial metrics for the receiving driver
            const driverFinancialMetrics = calculateFinancialMetrics(
              updatedDriverTrip.expiry,
              updatedDriverTrip.purchaseAmount,
              updatedDriverTrip.collectionAmount,
              updatedDriverTrip.discount,
              driverTotals.fresh.netTotal,
              driverTotals.bakery.netTotal,
              driverPreviousBalance
            );
            
            updatedDriverTrip.totalAmount = driverTotals.overall.total;
            updatedDriverTrip.netTotal = driverTotals.overall.netTotal;
            updatedDriverTrip.grandTotal = driverTotals.overall.grandTotal;
            updatedDriverTrip.expiryAfterTax = driverFinancialMetrics.expiryAfterTax;
            updatedDriverTrip.amountToBe = driverFinancialMetrics.amountToBe;
            updatedDriverTrip.salesDifference = driverFinancialMetrics.salesDifference;
            updatedDriverTrip.profit = driverFinancialMetrics.profit;
            updatedDriverTrip.balance = driverFinancialMetrics.balance;
            updatedDriverTrip.updatedAt = new Date().toISOString();
            
            const driverTripIndex = updatedTrips.findIndex(trip => trip.id === driverTrip.id);
            updatedTrips[driverTripIndex] = updatedDriverTrip;
          } else {
            // Store as pending transfer if receiving driver doesn't have a trip yet
            const enrichedAcceptedProducts = acceptedProducts.map(product => ({
              ...product,
              transferredFromDriverId: newTrip.driverId,
              transferredFromDriverName: newTrip.driverName,
            }));
            
            setPendingTransfers(prev => [
              ...prev,
              {
                id: `PENDING-${Date.now()}-${Math.random()}`,
                date: tripDate,
                receivingDriverId: driverId,
                products: enrichedAcceptedProducts,
                transferredFromDriverId: newTrip.driverId,
                transferredFromDriverName: newTrip.driverName,
              }
            ]);
          }
        }
      }

      return updatedTrips;
    });

    // Save to backend
    try {
      const result = await apiClient.createDailyTrip({
        ...newTrip,
        date: newTrip.date,
        createdAt: newTrip.createdAt,
        updatedAt: newTrip.updatedAt,
      });
      
      if (result.error) {
        console.error('Failed to save trip to backend:', result.error);
        // Revert local state on error
        setTrips(prev => prev.filter(trip => trip.id !== newTrip.id));
        setError(result.error);
        return;
      }
    } catch (error_) {
      console.error('Error saving trip to backend:', error_);
      // Revert local state on error
      setTrips(prev => prev.filter(trip => trip.id !== newTrip.id));
      setError(error_ instanceof Error ? error_.message : 'Failed to save trip');
      return;
    }

    // Track balance update to be processed after state change
    balanceUpdatesRef.current.push({
      driverId: tripData.driverId,
      balance: Math.round(financialMetrics.balance),
      reason: 'trip_update',
      updatedBy: 'EMP-001'
    });
  }, [trips, pendingTransfers, getPreviousBalance]);

  const updateTrip = React.useCallback(async (id: string, updates: Partial<DailyTrip>) => {
    setTrips(prev => 
      prev.map(trip => {
        if (trip.id === id) {
          const updatedTrip = { ...trip, ...updates, updatedAt: new Date().toISOString() };
          
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
            
            // Get previous balance for this driver
            const previousBalance = getPreviousBalance(updatedTrip.driverId, new Date(updatedTrip.date), prev);
            
            // Recalculate financial metrics
            const financialMetrics = calculateFinancialMetrics(
              updatedTrip.expiry,
              updatedTrip.purchaseAmount,
              updatedTrip.collectionAmount,
              updatedTrip.discount,
              totals.fresh.netTotal,
              totals.bakery.netTotal,
              previousBalance
            );
            
            updatedTrip.expiryAfterTax = financialMetrics.expiryAfterTax;
            updatedTrip.amountToBe = financialMetrics.amountToBe;
            updatedTrip.salesDifference = financialMetrics.salesDifference;
            updatedTrip.profit = financialMetrics.profit;
            updatedTrip.balance = financialMetrics.balance;
          } else if (updates.collectionAmount !== undefined || updates.purchaseAmount !== undefined || 
                     updates.expiry !== undefined || updates.discount !== undefined) {
            // Recalculate financial metrics if any financial field changed
            const totals = calculateTotals(
              updatedTrip.products,
              updatedTrip.acceptedProducts,
              updatedTrip.transfer.transferredProducts
            );
            
            const previousBalance = getPreviousBalance(updatedTrip.driverId,  new Date(updatedTrip.date), prev);
            
            const financialMetrics = calculateFinancialMetrics(
              updatedTrip.expiry,
              updatedTrip.purchaseAmount,
              updatedTrip.collectionAmount,
              updatedTrip.discount,
              totals.fresh.netTotal,
              totals.bakery.netTotal,
              previousBalance
            );
            
            updatedTrip.expiryAfterTax = financialMetrics.expiryAfterTax;
            updatedTrip.amountToBe = financialMetrics.amountToBe;
            updatedTrip.salesDifference = financialMetrics.salesDifference;
            updatedTrip.profit = financialMetrics.profit;
            updatedTrip.balance = financialMetrics.balance;
          }
          
          // Track balance changes to update after state change
          if (updatedTrip.balance !== trip.balance) {
            // Store the balance update to be processed after state update
            balanceUpdatesRef.current.push({
              driverId: updatedTrip.driverId,
              balance: updatedTrip.balance,
              reason: 'trip_update',
              updatedBy: 'EMP-001'
            });
          }
          
          return updatedTrip;
        }
        return trip;
      })
    );
  }, [getPreviousBalance]);

  const deleteTrip = React.useCallback(async (id: string) => {
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

  const getTripByDriverAndDate = React.useCallback((driverId: string, date: string): DailyTrip | undefined => {
    return trips.find(trip => 
      trip.driverId === driverId && 
      dayjs(trip.date).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
    );
  }, [trips]);

  const canAddTripForDriver = React.useCallback((driverId: string, date: string): boolean => {
    const existingTrip = getTripByDriverAndDate(driverId, date);
    return !existingTrip;
  }, [getTripByDriverAndDate]);

  const value: DailyTripContextType = {
    trips,
    isLoading: false,
    error: null,
    getTripById,
    addTrip,
    updateTrip,
    deleteTrip,
    getTripsByDriver,
    getTripsByDateRange,
    getTripByDriverAndDate,
    canAddTripForDriver,
    refreshTrips,
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
