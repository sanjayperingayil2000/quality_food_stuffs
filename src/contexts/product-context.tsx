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
      const result = await apiClient.getProducts();
      if (result.error) {
        setError(result.error);
        return;
      }
      
      // Get the product data directly
      if (result.data?.products) {
        const transformedProducts = result.data.products.map(product => ({
          ...product,
          createdAt: new Date(product.createdAt),
          updatedAt: new Date(product.updatedAt),
          priceHistory: product.priceHistory?.map(entry => ({
            ...entry,
            updatedAt: new Date(entry.updatedAt),
            updatedBy: entry.updatedBy || 'Unknown'
          }))
        }));
        setProducts(transformedProducts);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to fetch products');
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
      
      // Save to backend - convert Date objects to strings for API
      const apiProduct = {
        ...newProduct,
        createdAt: newProduct.createdAt.toISOString(),
        updatedAt: newProduct.updatedAt.toISOString(),
        priceHistory: newProduct.priceHistory?.map(entry => ({
          ...entry,
          updatedAt: entry.updatedAt.toISOString()
        }))
      };
      const result = await apiClient.createProduct(apiProduct);
      
      if (result.error) {
        // Revert local state on error
        setProducts(prev => prev.filter(prod => prod.id !== newProduct.id));
        setError(result.error);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to add product');
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
      
      // Save to backend - convert Date objects to strings for API
      const apiUpdates = {
        ...updates,
        createdAt: updates.createdAt?.toISOString(),
        updatedAt: updates.updatedAt?.toISOString(),
        priceHistory: updates.priceHistory?.map(entry => ({
          ...entry,
          updatedAt: entry.updatedAt.toISOString()
        }))
      };
      const result = await apiClient.updateProduct(id, apiUpdates);
      
      if (result.error) {
        // Revert local state on error
        await refreshProducts();
        setError(result.error);
      } else {
        // Refresh products to get updated price history from backend
        await refreshProducts();
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to update product');
    }
  }, [products, refreshProducts]);

  const deleteProduct = React.useCallback(async (id: string) => {
    try {
      const updatedProducts = products.filter(prod => prod.id !== id);
      
      // Update local state immediately
      setProducts(updatedProducts);
      
      // Save to backend
      const result = await apiClient.deleteProduct(id);
      
      if (result.error) {
        // Revert local state on error
        await refreshProducts();
        setError(result.error);
      }
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Failed to delete product');
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
