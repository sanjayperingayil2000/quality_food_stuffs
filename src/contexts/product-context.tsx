'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { apiClient } from '@/lib/api-client';

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
  isLoading: boolean;
  error: string | null;
  getProductById: (id: string) => Product | undefined;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductContext = React.createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refreshProducts = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getCalculations({ contextName: 'product' });
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Get the product calculation data
      const productCalc = result.data?.items.find(item => item.contextName === 'product');
      if (productCalc?.inputs?.products) {
        setProducts(productCalc.inputs.products);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

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

  const addProduct = React.useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newProduct: Product = {
        ...productData,
        id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Update local state immediately
      setProducts(prev => [newProduct, ...prev]);
      
      // Save to backend
      const result = await apiClient.createCalculation({
        contextName: 'product',
        inputs: { products: [newProduct, ...products] },
        metadata: { type: 'product_update', action: 'add', productId: newProduct.id }
      });
      
      if (result.error) {
        // Revert local state on error
        setProducts(prev => prev.filter(prod => prod.id !== newProduct.id));
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product');
    }
  }, [products]);

  const updateProduct = React.useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const updatedProducts = products.map(prod => 
        prod.id === id 
          ? { ...prod, ...updates, updatedAt: new Date() }
          : prod
      );
      
      // Update local state immediately
      setProducts(updatedProducts);
      
      // Save to backend
      const result = await apiClient.createCalculation({
        contextName: 'product',
        inputs: { products: updatedProducts },
        metadata: { type: 'product_update', action: 'update', productId: id }
      });
      
      if (result.error) {
        // Revert local state on error
        await refreshProducts();
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    }
  }, [products, refreshProducts]);

  const deleteProduct = React.useCallback(async (id: string) => {
    try {
      const updatedProducts = products.filter(prod => prod.id !== id);
      
      // Update local state immediately
      setProducts(updatedProducts);
      
      // Save to backend
      const result = await apiClient.createCalculation({
        contextName: 'product',
        inputs: { products: updatedProducts },
        metadata: { type: 'product_update', action: 'delete', productId: id }
      });
      
      if (result.error) {
        // Revert local state on error
        await refreshProducts();
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }, [products, refreshProducts]);

  const value: ProductContextType = {
    products,
    bakeryProducts,
    freshProducts,
    isLoading,
    error,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    refreshProducts,
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
