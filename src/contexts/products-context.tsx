'use client';

import * as React from 'react';

type Category = 'bakery' | 'fresh';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductsContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
}

const ProductsContext = React.createContext<ProductsContextType | undefined>(undefined);

// Sample initial products - in a real app, this would come from an API
const initialProducts: Product[] = [
  // Bakery Items (12 items)
  {
    id: 'PRD-001',
    name: 'Sourdough Bread',
    price: 12.50,
    category: 'bakery',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'PRD-002',
    name: 'Blueberry Muffin',
    price: 8.00,
    category: 'bakery',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'PRD-003',
    name: 'Croissant',
    price: 6.50,
    category: 'bakery',
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
  {
    id: 'PRD-004',
    name: 'Whole Wheat Loaf',
    price: 10.75,
    category: 'bakery',
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
  },
  {
    id: 'PRD-005',
    name: 'Chocolate Chip Cookie',
    price: 3.25,
    category: 'bakery',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: 'PRD-006',
    name: 'Cinnamon Roll',
    price: 7.50,
    category: 'bakery',
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
  },
  {
    id: 'PRD-007',
    name: 'Bagel',
    price: 4.00,
    category: 'bakery',
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
  },
  {
    id: 'PRD-008',
    name: 'Danish Pastry',
    price: 5.75,
    category: 'bakery',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: 'PRD-009',
    name: 'Pretzel',
    price: 3.50,
    category: 'bakery',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
  },
  {
    id: 'PRD-010',
    name: 'Donut',
    price: 2.75,
    category: 'bakery',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'PRD-011',
    name: 'Baguette',
    price: 9.25,
    category: 'bakery',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  {
    id: 'PRD-012',
    name: 'Focaccia',
    price: 11.00,
    category: 'bakery',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  // Fresh Items (8 items)
  {
    id: 'PRD-013',
    name: 'Fresh Apples',
    price: 15.00,
    category: 'fresh',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: 'PRD-014',
    name: 'Bananas',
    price: 8.50,
    category: 'fresh',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'PRD-015',
    name: 'Orange Juice',
    price: 12.00,
    category: 'fresh',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'PRD-016',
    name: 'Strawberries',
    price: 18.75,
    category: 'fresh',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'PRD-017',
    name: 'Grapes',
    price: 14.25,
    category: 'fresh',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: 'PRD-018',
    name: 'Mango',
    price: 22.50,
    category: 'fresh',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'PRD-019',
    name: 'Pineapple',
    price: 16.00,
    category: 'fresh',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'PRD-020',
    name: 'Watermelon',
    price: 25.00,
    category: 'fresh',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);

  // Products are initialized with sample data

  const addProduct = React.useCallback((product: Product) => {
    setProducts(prev => [...prev, product]);
  }, []);

  const updateProduct = React.useCallback((id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = React.useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const value = React.useMemo(() => ({
    products,
    addProduct,
    updateProduct,
    deleteProduct,
  }), [products, addProduct, updateProduct, deleteProduct]);

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = React.useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
