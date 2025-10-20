import mongoose, { Schema, Model } from 'mongoose';

export type ExpenseCategory = 'petrol' | 'maintenance' | 'variance' | 'salary' | 'others';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';
export type Designation = 'driver' | 'manager' | 'ceo' | 'staff';

export interface IAdditionalExpense {
  title: string;
  description?: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: Date;
  driverId?: string; // Optional - if expense is related to a specific driver
  driverName?: string;
  designation: Designation; // Role of the person who created the expense
  receiptNumber?: string;
  vendor?: string;
  isReimbursable: boolean;
  status: ExpenseStatus;
  approvedBy?: string; // Employee ID who approved this expense
  approvedAt?: Date;
  rejectedReason?: string;
  createdBy?: string; // Employee ID who created this expense
  updatedBy?: string; // Employee ID who last updated this expense
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdditionalExpenseDocument extends mongoose.Document, IAdditionalExpense {}

const AdditionalExpenseSchema = new Schema<IAdditionalExpenseDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { 
      type: String, 
      enum: ['petrol', 'maintenance', 'variance', 'salary', 'others'], 
      required: true 
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'AED' },
    date: { type: Date, required: true },
    driverId: { type: String, trim: true },
    driverName: { type: String, trim: true },
    designation: { 
      type: String, 
      enum: ['driver', 'manager', 'ceo', 'staff'], 
      required: true 
    },
    receiptNumber: { type: String, trim: true },
    vendor: { type: String, trim: true },
    isReimbursable: { type: Boolean, default: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    approvedBy: { type: String, trim: true },
    approvedAt: { type: Date },
    rejectedReason: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes for better query performance
AdditionalExpenseSchema.index({ driverId: 1 });
AdditionalExpenseSchema.index({ category: 1 });
AdditionalExpenseSchema.index({ status: 1 });
AdditionalExpenseSchema.index({ date: 1 });
AdditionalExpenseSchema.index({ createdBy: 1 });

export const AdditionalExpense: Model<IAdditionalExpenseDocument> =
  mongoose.models.AdditionalExpense || mongoose.model<IAdditionalExpenseDocument>('AdditionalExpense', AdditionalExpenseSchema);

