'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { freshProducts } from './data/freshProducts';
import { bakeryProducts } from './data/bakeryProducts';

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

export const initialProducts: Product[] = [...freshProducts,...bakeryProducts];

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
