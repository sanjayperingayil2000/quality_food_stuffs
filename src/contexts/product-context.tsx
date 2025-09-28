'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export type ProductCategory = 'bakery' | 'fresh';

export interface PriceHistoryEntry {
  version: number;      // version number
  price: number;        // previous price
  updatedAt: Date;      // timestamp when price was updated
  updatedBy: string;    // user who updated it
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description?: string;
  sku: string;
  unit: string; // e.g., 'piece', 'kg', 'liter'
  minimumQuantity: number;
  maximumQuantity?: number;
  isActive: boolean;
  expiryDays?: number; // For fresh products
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Employee ID who created this product
  updatedBy?: string; // Employee ID who last updated this product
  priceHistory?: PriceHistoryEntry[];
}

interface ProductContextType {
  products: Product[];
  bakeryProducts: Product[];
  freshProducts: Product[];
  getProductById: (id: string) => Product | undefined;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const ProductContext = React.createContext<ProductContextType | undefined>(undefined);

// Sample data - 18 fresh items and 13 bakery items
const initialProducts: Product[] = [
  // Fresh Products (18 items)
  {
    id: 'PRD-001',
    name: 'Fresh Apples',
    category: 'fresh',
    price: 15,
    description: 'Crisp and juicy red apples',
    sku: 'FR-APP-001',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 14,
    supplier: 'Fresh Farm Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 11, updatedAt: new Date('2024-01-01'), updatedBy: 'Admin' },
      { version: 2, price: 12, updatedAt: new Date('2024-02-01'), updatedBy: 'Admin' },
      { version: 3, price: 12.5, updatedAt: new Date('2024-03-01'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-002',
    name: 'Bananas',
    category: 'fresh',
    price: 8.5,
    description: 'Sweet and ripe bananas',
    sku: 'FR-BAN-002',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 7,
    supplier: 'Tropical Fruits Ltd.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 7.5, updatedAt: new Date('2024-01-02'), updatedBy: 'Admin' },
      { version: 2, price: 7.8, updatedAt: new Date('2024-02-01'), updatedBy: 'Admin' },
      { version: 3, price: 8, updatedAt: new Date('2024-02-15'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-003',
    name: 'Orange Juice',
    category: 'fresh',
    price: 12,
    description: 'Freshly squeezed orange juice',
    sku: 'FR-OJ-003',
    unit: 'liter',
    minimumQuantity: 2,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 3,
    supplier: 'Juice Masters',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
      priceHistory: [
      { version: 1, price: 6, updatedAt: new Date('2024-01-03'), updatedBy: 'Admin' },
      { version: 2, price: 6.2, updatedAt: new Date('2024-02-01'), updatedBy: 'Admin' },
      { version: 3, price: 6.5, updatedAt: new Date('2024-02-20'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-004',
    name: 'Strawberries',
    category: 'fresh',
    price: 18.75,
    description: 'Sweet and aromatic strawberries',
    sku: 'FR-STR-004',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 5,
    supplier: 'Berry Farm Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 10, updatedAt: new Date('2024-01-04'), updatedBy: 'Admin' },
      { version: 2, price: 10.5, updatedAt: new Date('2024-02-10'), updatedBy: 'Admin' },
      { version: 3, price: 10.75, updatedAt: new Date('2024-03-05'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-005',
    name: 'Grapes',
    category: 'fresh',
    price: 14.25,
    description: 'Seedless green grapes',
    sku: 'FR-GRP-005',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 10,
    supplier: 'Vineyard Fresh',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 3, updatedAt: new Date('2024-01-05'), updatedBy: 'Admin' },
      { version: 2, price: 3.1, updatedAt: new Date('2024-02-01'), updatedBy: 'Admin' },
      { version: 3, price: 3.25, updatedAt: new Date('2024-03-02'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-006',
    name: 'Mango',
    category: 'fresh',
    price: 22.5,
    description: 'Sweet and juicy mangoes',
    sku: 'FR-MAN-006',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 7,
    supplier: 'Tropical Delights',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 7, updatedAt: new Date('2024-01-06'), updatedBy: 'Admin' },
      { version: 2, price: 7.3, updatedAt: new Date('2024-02-15'), updatedBy: 'Admin' },
      { version: 3, price: 7.5, updatedAt: new Date('2024-03-08'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-007',
    name: 'Pineapple',
    category: 'fresh',
    price: 16,
    description: 'Sweet and tangy pineapple',
    sku: 'FR-PIN-007',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 7,
    supplier: 'Tropical Fruits Ltd.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
    priceHistory: [
      { version: 1, price: 3.5, updatedAt: new Date('2024-01-07'), updatedBy: 'Admin' },
      { version: 2, price: 3.8, updatedAt: new Date('2024-02-20'), updatedBy: 'Admin' },
      { version: 3, price: 4, updatedAt: new Date('2024-03-10'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-008',
    name: 'Watermelon',
    category: 'fresh',
    price: 25,
    description: 'Sweet and refreshing watermelon',
    sku: 'FR-WAT-008',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 10,
    isActive: true,
    expiryDays: 5,
    supplier: 'Fresh Farm Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
    priceHistory: [
      { version: 1, price: 5.5, updatedAt: new Date('2024-01-08'), updatedBy: 'Admin' },
      { version: 2, price: 5.6, updatedAt: new Date('2024-02-25'), updatedBy: 'Admin' },
      { version: 3, price: 5.75, updatedAt: new Date('2024-03-12'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-009',
    name: 'Lettuce',
    category: 'fresh',
    price: 6.5,
    description: 'Fresh green lettuce leaves',
    sku: 'FR-LET-009',
    unit: 'head',
    minimumQuantity: 2,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 7,
    supplier: 'Green Valley Farms',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 3, updatedAt: new Date('2024-01-09'), updatedBy: 'Admin' },
      { version: 2, price: 3.25, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 3.5, updatedAt: new Date('2024-03-15'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-010',
    name: 'Tomatoes',
    category: 'fresh',
    price: 9.75,
    description: 'Fresh red tomatoes',
    sku: 'FR-TOM-010',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 35,
    isActive: true,
    expiryDays: 7,
    supplier: 'Green Valley Farms',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
    priceHistory: [
      { version: 1, price: 2.5, updatedAt: new Date('2024-01-10'), updatedBy: 'Admin' },
      { version: 2, price: 2.65, updatedAt: new Date('2024-03-01'), updatedBy: 'Admin' },
      { version: 3, price: 2.75, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-011',
    name: 'Carrots',
    category: 'fresh',
    price: 7.25,
    description: 'Fresh orange carrots',
    sku: 'FR-CAR-011',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 14,
    supplier: 'Root Vegetables Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
    priceHistory: [
      { version: 1, price: 8.75, updatedAt: new Date('2024-01-11'), updatedBy: 'Admin' },
      { version: 2, price: 9, updatedAt: new Date('2024-02-15'), updatedBy: 'Admin' },
      { version: 3, price: 9.25, updatedAt: new Date('2024-03-20'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-012',
    name: 'Cucumber',
    category: 'fresh',
    price: 5.5,
    description: 'Fresh green cucumbers',
    sku: 'FR-CUC-012',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 7,
    supplier: 'Green Valley Farms',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 10.5, updatedAt: new Date('2024-01-12'), updatedBy: 'Admin' },
      { version: 2, price: 10.75, updatedAt: new Date('2024-02-20'), updatedBy: 'Admin' },
      { version: 3, price: 11, updatedAt: new Date('2024-03-22'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-013',
    name: 'Bell Peppers',
    category: 'fresh',
    price: 11.5,
    description: 'Mixed color bell peppers',
    sku: 'FR-BP-013',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 10,
    supplier: 'Colorful Veggies',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 14, updatedAt: new Date('2024-01-13'), updatedBy: 'Admin' },
      { version: 2, price: 14.5, updatedAt: new Date('2024-02-01'), updatedBy: 'Admin' },
      { version: 3, price: 15, updatedAt: new Date('2024-03-01'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-014',
    name: 'Spinach',
    category: 'fresh',
    price: 8.25,
    description: 'Fresh green spinach leaves',
    sku: 'FR-SPI-014',
    unit: 'bunch',
    minimumQuantity: 2,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 5,
    supplier: 'Leafy Greens Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 8, updatedAt: new Date('2024-01-14'), updatedBy: 'Admin' },
      { version: 2, price: 8.25, updatedAt: new Date('2024-02-05'), updatedBy: 'Admin' },
      { version: 3, price: 8.5, updatedAt: new Date('2024-03-03'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-015',
    name: 'Avocado',
    category: 'fresh',
    price: 19.5,
    description: 'Creamy ripe avocados',
    sku: 'FR-AVO-015',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 5,
    supplier: 'Tropical Delights',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 11, updatedAt: new Date('2024-01-15'), updatedBy: 'Admin' },
      { version: 2, price: 11.5, updatedAt: new Date('2024-02-10'), updatedBy: 'Admin' },
      { version: 3, price: 12, updatedAt: new Date('2024-03-05'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-016',
    name: 'Lemons',
    category: 'fresh',
    price: 6.75,
    description: 'Fresh yellow lemons',
    sku: 'FR-LEM-016',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 14,
    supplier: 'Citrus Grove',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 17, updatedAt: new Date('2024-01-16'), updatedBy: 'Admin' },
      { version: 2, price: 18, updatedAt: new Date('2024-02-15'), updatedBy: 'Admin' },
      { version: 3, price: 18.75, updatedAt: new Date('2024-03-08'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-017',
    name: 'Ginger',
    category: 'fresh',
    price: 12.5,
    description: 'Fresh ginger root',
    sku: 'FR-GIN-017',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 21,
    supplier: 'Spice Roots Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
     priceHistory: [
      { version: 1, price: 13.5, updatedAt: new Date('2024-01-17'), updatedBy: 'Admin' },
      { version: 2, price: 14, updatedAt: new Date('2024-02-20'), updatedBy: 'Admin' },
      { version: 3, price: 14.25, updatedAt: new Date('2024-03-10'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-018',
    name: 'Garlic',
    category: 'fresh',
    price: 9.25,
    description: 'Fresh garlic bulbs',
    sku: 'FR-GAR-018',
    unit: 'kg',
    minimumQuantity: 2,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 30,
    supplier: 'Spice Roots Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-002',
    updatedBy: 'EMP-002',
    priceHistory: [
      { version: 1, price: 21, updatedAt: new Date('2024-01-18'), updatedBy: 'Admin' },
      { version: 2, price: 22, updatedAt: new Date('2024-02-25'), updatedBy: 'Admin' },
      { version: 3, price: 22.5, updatedAt: new Date('2024-03-12'), updatedBy: 'Admin' },
    ],
  },

  // Bakery Products (13 items)
  {
    id: 'PRD-019',
    name: 'Sourdough Bread',
    category: 'bakery',
    price: 12.5,
    description: 'Artisan sourdough bread',
    sku: 'BK-SD-019',
    unit: 'loaf',
    minimumQuantity: 2,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 3,
    supplier: 'Artisan Bakery Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
     priceHistory: [
      { version: 1, price: 15, updatedAt: new Date('2024-01-19'), updatedBy: 'Admin' },
      { version: 2, price: 15.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 16, updatedAt: new Date('2024-03-15'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-020',
    name: 'Blueberry Muffin',
    category: 'bakery',
    price: 8,
    description: 'Fresh blueberry muffins',
    sku: 'BK-BM-020',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 2,
    supplier: 'Sweet Treats Bakery',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-021',
    name: 'Croissant',
    category: 'bakery',
    price: 6.5,
    description: 'Buttery croissants',
    sku: 'BK-CRO-021',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 2,
    supplier: 'French Bakery Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-022',
    name: 'Whole Wheat Loaf',
    category: 'bakery',
    price: 10.75,
    description: 'Healthy whole wheat bread',
    sku: 'BK-WW-022',
    unit: 'loaf',
    minimumQuantity: 2,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 4,
    supplier: 'Health Bread Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-023',
    name: 'Chocolate Chip Cookie',
    category: 'bakery',
    price: 3.25,
    description: 'Soft chocolate chip cookies',
    sku: 'BK-CCC-023',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 100,
    isActive: true,
    expiryDays: 7,
    supplier: 'Sweet Treats Bakery',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-024',
    name: 'Cinnamon Roll',
    category: 'bakery',
    price: 7.5,
    description: 'Sweet cinnamon rolls with glaze',
    sku: 'BK-CR-024',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 3,
    supplier: 'Sweet Treats Bakery',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-025',
    name: 'Bagel',
    category: 'bakery',
    price: 4,
    description: 'Fresh plain bagels',
    sku: 'BK-BAG-025',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 3,
    supplier: 'New York Bakery',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-026',
    name: 'Danish Pastry',
    category: 'bakery',
    price: 5.75,
    description: 'Flaky danish pastries',
    sku: 'BK-DP-026',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 35,
    isActive: true,
    expiryDays: 2,
    supplier: 'French Bakery Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-027',
    name: 'Pretzel',
    category: 'bakery',
    price: 3.5,
    description: 'Soft pretzels with salt',
    sku: 'BK-PRE-027',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 2,
    supplier: 'German Bakery Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-028',
    name: 'Donut',
    category: 'bakery',
    price: 2.75,
    description: 'Glazed donuts',
    sku: 'BK-DON-028',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 60,
    isActive: true,
    expiryDays: 2,
    supplier: 'Sweet Treats Bakery',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-029',
    name: 'Baguette',
    category: 'bakery',
    price: 9.25,
    description: 'Traditional French baguette',
    sku: 'BK-BAG-029',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 1,
    supplier: 'French Bakery Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-030',
    name: 'Focaccia',
    category: 'bakery',
    price: 11,
    description: 'Italian herb focaccia',
    sku: 'BK-FOC-030',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 3,
    supplier: 'Italian Bakery Co.',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
  {
    id: 'PRD-031',
    name: 'Pita Bread',
    category: 'bakery',
    price: 4.5,
    description: 'Soft pita bread',
    sku: 'BK-PIT-031',
    unit: 'piece',
    minimumQuantity: 2,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 3,
    supplier: 'Middle Eastern Bakery',
    createdAt: dayjs().subtract(6, 'month').toDate(),
    updatedAt: dayjs().subtract(1, 'week').toDate(),
    createdBy: 'EMP-003',
    updatedBy: 'EMP-003',
      priceHistory: [
      { version: 1, price: 23.5, updatedAt: new Date('2024-01-20'), updatedBy: 'Admin' },
      { version: 2, price: 24.5, updatedAt: new Date('2024-02-28'), updatedBy: 'Admin' },
      { version: 3, price: 25, updatedAt: new Date('2024-03-18'), updatedBy: 'Admin' },
    ],
  },
];

export function ProductProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);

  const bakeryProducts = React.useMemo(() => 
    products.filter(prod => prod.category === 'bakery' && prod.isActive), 
    [products]
  );

  const freshProducts = React.useMemo(() => 
    products.filter(prod => prod.category === 'fresh' && prod.isActive), 
    [products]
  );

  const getProductById = React.useCallback((id: string): Product | undefined => {
    return products.find(prod => prod.id === id);
  }, [products]);

  const addProduct = React.useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setProducts(prev => [newProduct,...prev ]);
  }, [products.length]);

  const updateProduct = React.useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => 
      prev.map(prod => 
        prod.id === id 
          ? { ...prod, ...updates, updatedAt: new Date() }
          : prod
      )
    );
  }, []);

  const deleteProduct = React.useCallback((id: string) => {
    setProducts(prev => prev.filter(prod => prod.id !== id));
  }, []);

  const value: ProductContextType = {
    products,
    bakeryProducts,
    freshProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts(): ProductContextType {
  const context = React.useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
