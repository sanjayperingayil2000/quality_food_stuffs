import mongoose, { Schema, Model } from 'mongoose';

export type EmployeeDesignation = 'driver' | 'staff' | 'ceo';

export interface BalanceHistoryEntry {
  version: number;
  balance: number;
  updatedAt: Date;
  reason?: string; // Reason for balance change
  updatedBy?: string; // Employee ID who made the change
}

export interface IEmployee {
  id: string;
  name: string;
  designation: EmployeeDesignation;
  phoneNumber: string;
  email: string;
  address: string;
  routeName?: string; // For drivers
  location?: string; // For drivers
  salary?: number; // For staff and CEO
  balance?: number; // For drivers only - current balance
  balanceHistory?: BalanceHistoryEntry[]; // For drivers only - history of balance changes
  hireDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Employee ID who created this record
  updatedBy?: string; // Employee ID who last updated this record
}

export interface IEmployeeDocument extends mongoose.Document, Omit<IEmployee, 'id'> {
  id: string;
}

const EmployeeSchema = new Schema<IEmployeeDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    designation: { 
      type: String, 
      enum: ['driver', 'staff', 'ceo'], 
      required: true,
      index: true 
    },
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    routeName: { type: String, trim: true },
    location: { type: String, trim: true },
    salary: { type: Number, min: 0 },
    balance: { type: Number, default: 0 },
    balanceHistory: [{
      version: { type: Number, required: true },
      balance: { type: Number, required: true },
      updatedAt: { type: Date, required: true },
      reason: { type: String, trim: true },
      updatedBy: { type: String, trim: true }
    }],
    hireDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes for better query performance
EmployeeSchema.index({ designation: 1, isActive: 1 });
EmployeeSchema.index({ routeName: 1 });
EmployeeSchema.index({ createdBy: 1 });
EmployeeSchema.index({ updatedBy: 1 });

export const Employee: Model<IEmployeeDocument> =
  mongoose.models.Employee || mongoose.model<IEmployeeDocument>('Employee', EmployeeSchema);
