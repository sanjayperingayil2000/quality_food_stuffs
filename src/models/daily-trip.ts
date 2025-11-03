import mongoose, { Schema, Model } from 'mongoose';

export interface TripProduct {
  productId: string;
  productName: string;
  category: 'bakery' | 'fresh';
  quantity: number;
  unitPrice: number;
  displayNumber?: string; // Display number for the product (F001, B001, etc.)
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

export interface IDailyTrip {
  id: string;
  driverId: string;
  driverName: string;
  date: Date;
  products: TripProduct[]; // Regular products in the trip
  transfer: ProductTransfer; // Product transfer information
  acceptedProducts: TripProduct[]; // Products accepted from other drivers
  // Financial fields
  previousBalance: number; // Previous balance carried into this trip
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
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Employee ID who created this trip
  updatedBy?: string; // Employee ID who last updated this trip
}

export interface IDailyTripDocument extends mongoose.Document, Omit<IDailyTrip, 'id'> {
  id: string;
}

const DailyTripSchema = new Schema<IDailyTripDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    driverId: { type: String, required: true, index: true },
    driverName: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    products: [{
      productId: { type: String, required: true },
      productName: { type: String, required: true },
      category: { type: String, enum: ['bakery', 'fresh'], required: true },
      quantity: { type: Number, required: true, min: 0 },
      unitPrice: { type: Number, required: true, min: 0 },
      displayNumber: { type: String }
    }],
    transfer: {
      isProductTransferred: { type: Boolean, default: false },
      transferredProducts: [{
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        category: { type: String, enum: ['bakery', 'fresh'], required: true },
        quantity: { type: Number, required: true, min: 0 },
        unitPrice: { type: Number, required: true, min: 0 },
        displayNumber: { type: String },
        receivingDriverId: { type: String, required: true },
        receivingDriverName: { type: String, required: true },
        transferredFromDriverId: { type: String, required: true },
        transferredFromDriverName: { type: String, required: true }
      }]
    },
    acceptedProducts: [{
      productId: { type: String, required: true },
      productName: { type: String, required: true },
      category: { type: String, enum: ['bakery', 'fresh'], required: true },
      quantity: { type: Number, required: true, min: 0 },
      unitPrice: { type: Number, required: true, min: 0 },
      displayNumber: { type: String }
    }],
    // Financial fields
    previousBalance: { type: Number, required: true, min: 0 },
    collectionAmount: { type: Number, required: true, min: 0 },
    purchaseAmount: { type: Number, required: true, min: 0 },
    expiry: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    petrol: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true },
    // Calculated totals
    totalAmount: { type: Number, required: true, min: 0 },
    netTotal: { type: Number, required: true, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    // Calculated fields
    expiryAfterTax: { type: Number, required: true, min: 0 },
    amountToBe: { type: Number, required: true },
    salesDifference: { type: Number, required: true },
    profit: { type: Number, required: true },
    // Metadata
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes for better query performance
DailyTripSchema.index({ driverId: 1, date: -1 });
DailyTripSchema.index({ date: -1 });
DailyTripSchema.index({ createdBy: 1 });
DailyTripSchema.index({ updatedBy: 1 });

export const DailyTrip: Model<IDailyTripDocument> =
  mongoose.models.DailyTrip || mongoose.model<IDailyTripDocument>('DailyTrip', DailyTripSchema, 'daily_trips');
