import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { Product, PriceHistoryEntry } from '@/models/product';
import { History } from '@/models/history';

export interface CreateProductData {
  name: string;
  category: 'bakery' | 'fresh';
  price: number;
  description?: string;
  sku: string;
  unit: string;
  minimumQuantity: number;
  maximumQuantity?: number;
  isActive?: boolean;
  expiryDays?: number;
  supplier?: string;
  createdBy?: string;
}

export interface UpdateProductData {
  name?: string;
  category?: 'bakery' | 'fresh';
  price?: number;
  description?: string;
  sku?: string;
  unit?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  isActive?: boolean;
  expiryDays?: number;
  supplier?: string;
  priceHistory?: PriceHistoryEntry[];
  updatedBy?: string;
}

export interface ProductFilters {
  category?: string;
  isActive?: boolean;
  supplier?: string;
}

export async function createProduct(data: CreateProductData) {
  await connectToDatabase();
  
  // Generate unique ID
  const count = await Product.countDocuments();
  const id = `PRD-${String(count + 1).padStart(3, '0')}`;
  
  const productData = {
    ...data,
    id,
    priceHistory: [{
      version: 1,
      price: data.price,
      updatedAt: new Date(),
      updatedBy: data.createdBy,
    }],
  };
  
  const product = await Product.create(productData);
  
  // Log to history
  await History.create({
    collectionName: 'products',
    documentId: product._id,
    action: 'create',
    actor: data.createdBy && Types.ObjectId.isValid(data.createdBy) ? new Types.ObjectId(data.createdBy) : undefined,
    before: null,
    after: product.toObject(),
    timestamp: new Date(),
  });
  
  return product.toObject();
}

export async function getProducts(filters: ProductFilters = {}) {
  await connectToDatabase();
  
  const queryFilter: Record<string, unknown> = {};
  if (filters.category) queryFilter.category = filters.category;
  if (filters.isActive !== undefined) queryFilter.isActive = filters.isActive;
  if (filters.supplier) queryFilter.supplier = filters.supplier;
  
  // eslint-disable-next-line unicorn/no-array-callback-reference
  const products = await Product.find(queryFilter).sort({ createdAt: -1 });
  return products.map(prod => prod.toObject());
}

export async function getProductById(id: string) {
  await connectToDatabase();
  
  const product = await Product.findOne({ id });
  return product ? product.toObject() : null;
}

export async function updateProduct(id: string, data: UpdateProductData) {
  await connectToDatabase();
  
  const product = await Product.findOne({ id });
  if (!product) {
    throw new Error('Product not found');
  }
  
  const beforeData = product.toObject();
  
  // If price is being updated, add to price history
  if (data.price !== undefined && data.price !== product.price) {
    const currentVersion = product.priceHistory?.length || 0;
    data.priceHistory = [
      ...(product.priceHistory || []),
      {
        version: currentVersion + 1,
        price: data.price,
        updatedAt: new Date(),
        updatedBy: data.updatedBy,
      }
    ];
  }
  
  const updatedProduct = await Product.findOneAndUpdate(
    { id },
    data,
    { new: true, runValidators: true }
  );
  
  // Log to history
  await History.create({
    collectionName: 'products',
    documentId: product._id,
    action: 'update',
    actor: data.updatedBy && Types.ObjectId.isValid(data.updatedBy) ? new Types.ObjectId(data.updatedBy) : undefined,
    before: beforeData,
    after: updatedProduct?.toObject(),
    timestamp: new Date(),
  });
  
  return updatedProduct?.toObject();
}

export async function deleteProduct(id: string, deletedBy?: string) {
  await connectToDatabase();
  
  const product = await Product.findOne({ id });
  if (!product) {
    throw new Error('Product not found');
  }
  
  const beforeData = product.toObject();
  await Product.findOneAndDelete({ id });
  
  // Log to history
  await History.create({
    collectionName: 'products',
    documentId: product._id,
    action: 'delete',
    actor: deletedBy && Types.ObjectId.isValid(deletedBy) ? new Types.ObjectId(deletedBy) : undefined,
    before: beforeData,
    after: null,
    timestamp: new Date(),
  });
  
  return { message: 'Product deleted successfully' };
}
