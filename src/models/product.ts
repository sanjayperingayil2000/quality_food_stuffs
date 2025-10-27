import mongoose, { Schema, Model } from 'mongoose';

export type ProductCategory = 'bakery' | 'fresh';

export interface PriceHistoryEntry {
  version: number;
  price: number;
  updatedAt: Date;
  reason?: string; // Reason for price change
  updatedBy?: string; // Employee ID who updated it
}

export interface IProduct {
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

export interface IProductDocument extends mongoose.Document, Omit<IProduct, 'id'> {
  id: string;
}

const ProductSchema = new Schema<IProductDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      enum: ['bakery', 'fresh'], 
      required: true,
      index: true 
    },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    sku: { type: String, required: true, trim: true, index: true },
    unit: { type: String, required: true, trim: true },
    minimumQuantity: { type: Number, required: true, min: 0 },
    maximumQuantity: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    expiryDays: { type: Number, min: 0 },
    supplier: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
    priceHistory: [{
      version: { type: Number, required: true },
      price: { type: Number, required: true },
      updatedAt: { type: Date, required: true },
      reason: { type: String, trim: true },
      updatedBy: { type: String, trim: true }
    }],
  },
  { timestamps: true }
);

// Indexes for better query performance
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ supplier: 1 });
ProductSchema.index({ createdBy: 1 });
ProductSchema.index({ updatedBy: 1 });

export const Product: Model<IProductDocument> =
  mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);
