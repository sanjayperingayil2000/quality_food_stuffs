/* eslint-disable no-console */
import dotenv from 'dotenv';
import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import fs from 'fs';
import path from 'path';
import { User } from './src/models/user';
// import { freshProducts } from './data/fresh-products.ts';
// import { bakeryProducts } from './data/bakery-products.ts';

// Load env: prefer .env.local if present, otherwise .env
const localEnvPath = path.resolve(process.cwd(), '.env.local');
const defaultEnvPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: fs.existsSync(localEnvPath) ? localEnvPath : defaultEnvPath, override: true });

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// ----------------------
// Database Connection
// ----------------------
let isConnected = 0; // 0 = disconnected, 1 = connecting, 2 = connected

async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected === 2) return mongoose;

  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) throw new Error('MONGO_URL is not set in environment variables');

  if (isConnected === 1) return mongoose;

  isConnected = 1;

  mongoose.set('strictQuery', true);
  // Respect DB name from URL if provided; otherwise default to 'qualityfoodstuffs'
  const urlWithoutQuery = mongoUrl.split('?')[0];
  const urlParts = urlWithoutQuery.split('/');
  const hasDatabaseInUrl = urlParts.length > 3 && urlParts[urlParts.length - 1] !== '';
  await mongoose.connect(mongoUrl, hasDatabaseInUrl ? {} : { dbName: 'qualityfoodstuffs' });
  isConnected = 2;

  return mongoose;
}

// ----------------------
// Interfaces
// ----------------------

interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  roles: ('super_admin' | 'manager')[];
  isActive: boolean;
  settingsAccess: boolean;
}

interface ISetting extends Document {
  key: string;
  value: any;
  createdBy?: mongoose.Types.ObjectId;
}

interface ICalculation extends Document {
  userId?: mongoose.Types.ObjectId;
  contextName: string;
  inputs: any;
  results?: any;
  metadata?: any;
}

interface IBalanceHistory {
  id: string;
  previousBalance: number;
  newBalance: number;
  changeAmount: number;
  reason: string;
  date: Date;
  updatedBy: string;
}

interface IEmployee extends Document {
  id: string;
  name: string;
  designation: 'driver' | 'staff' | 'ceo';
  phoneNumber: string;
  email: string;
  address: string;
  routeName?: string;
  location?: string;
  salary?: number;
  balance?: number;
  balanceHistory?: IBalanceHistory[];
  hireDate?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

interface IPriceHistory {
  version: number;
  price: number;
  updatedAt: Date;
  updatedBy: string;
}

interface IProduct extends Document {
  id: string;
  displayNumber?: string;
  name: string;
  category: 'bakery' | 'fresh';
  price: number;
  description?: string;
  sku?: string;
  unit?: string;
  minimumQuantity?: number;
  maximumQuantity?: number;
  isActive?: boolean;
  expiryDays?: number;
  supplier?: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  priceHistory?: IPriceHistory[];
}

interface ITripProduct {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  transferredFromDriverId?: string;
  transferredFromDriverName?: string;
}

interface ITransferredProduct extends ITripProduct {
  receivingDriverId?: string;
  receivingDriverName?: string;
}

interface IDailyTrip extends Document {
  id: string;
  driverId: string;
  driverName: string;
  date: Date;
  products: ITripProduct[];
  transfer?: {
    isProductTransferred: boolean;
    transferredProducts: ITransferredProduct[];
  };
  acceptedProducts?: ITripProduct[];
  collectionAmount?: number;
  purchaseAmount?: number;
  expiry?: number;
  discount?: number;
  petrol?: number;
  balance?: number;
  totalAmount?: number;
  netTotal?: number;
  grandTotal?: number;
  expiryAfterTax?: number;
  amountToBe?: number;
  salesDifference?: number;
  profit?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

interface IAdditionalExpense extends Document {
  title: string;
  description?: string;
  category: 'petrol' | 'maintenance' | 'variance' | 'salary' | 'others';
  amount: number;
  currency: string;
  date: Date;
  driverId?: string;
  driverName?: string;
  designation: 'driver' | 'manager' | 'ceo' | 'staff';
  receiptNumber?: string;
  vendor?: string;
  isReimbursable: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ----------------------
// Schemas
// ----------------------

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const CalculationSchema = new Schema<ICalculation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    contextName: { type: String, required: true, index: true },
    inputs: { type: Schema.Types.Mixed, required: true },
    results: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const EmployeeSchema = new Schema<IEmployee>({
  id: { type: String, unique: true, index: true },
  name: String,
  designation: { type: String, enum: ['driver', 'staff', 'ceo'] },
  phoneNumber: String,
  email: String,
  address: String,
  routeName: String,
  location: String,
  salary: Number,
  balance: Number,
  balanceHistory: [Object],
  hireDate: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
  updatedBy: String,
});

const ProductSchema = new Schema<IProduct>({
  id: { type: String, unique: true, index: true },
  name: String,
  category: { type: String, enum: ['bakery', 'fresh'] },
  price: Number,
  description: String,
  sku: String,
  unit: String,
  minimumQuantity: Number,
  maximumQuantity: Number,
  isActive: Boolean,
  expiryDays: Number,
  supplier: String,
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
  updatedBy: String,
  priceHistory: [Object],
});

const DailyTripSchema = new Schema<IDailyTrip>({
  id: { type: String, unique: true, index: true },
  driverId: String,
  driverName: String,
  date: Date,
  products: [Object],
  transfer: {
    isProductTransferred: Boolean,
    transferredProducts: [Object],
  },
  acceptedProducts: [Object],
  collectionAmount: Number,
  purchaseAmount: Number,
  expiry: Number,
  discount: Number,
  petrol: Number,
  balance: Number,
  totalAmount: Number,
  netTotal: Number,
  grandTotal: Number,
  expiryAfterTax: Number,
  amountToBe: Number,
  salesDifference: Number,
  profit: Number,
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
  updatedBy: String,
});

const AdditionalExpenseSchema = new Schema<IAdditionalExpense>({
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
}, { timestamps: true });

// ----------------------
// Models
// ----------------------

const Setting: Model<ISetting> = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
const Calculation: Model<ICalculation> =
  mongoose.models.Calculation || mongoose.model<ICalculation>('Calculation', CalculationSchema);
const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema, 'employees');
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema, 'products');
const DailyTrip: Model<IDailyTrip> =
  mongoose.models.DailyTrip || mongoose.model<IDailyTrip>('DailyTrip', DailyTripSchema, 'daily_trips');
const AdditionalExpense: Model<IAdditionalExpense> =
  mongoose.models.AdditionalExpense || mongoose.model<IAdditionalExpense>('AdditionalExpense', AdditionalExpenseSchema);

// ----------------------
// Utility functions
// ----------------------

async function ensureSuperAdmin(): Promise<void> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const name = process.env.SEED_SUPER_ADMIN_NAME || 'Satheesh Thalekkara';

  if (!email || !password) {
    console.log('SEED_SUPER_ADMIN_* envs not set, skipping super admin creation');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Super admin already exists, updating password...');
    const passwordHash = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(existing._id, { 
      passwordHash,
      name: 'Satheesh Thalekkara',
      phone: '+971 50 123 4567',
      state: 'Dubai',
      city: 'Dubai',
      profilePhoto: '/assets/avatar.png'
    });
    console.log('Super admin password updated for:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ 
    name: 'Satheesh Thalekkara',
    email, 
    passwordHash, 
    roles: ['super_admin'], 
    isActive: true,
    phone: '+971 50 123 4567',
    state: 'Dubai',
    city: 'Dubai',
    profilePhoto: '/assets/avatar.png'
  });
  console.log('Super admin password hash created for:', email);
  console.log('Super admin created');
}

// ----------------------
// Seeding
// ----------------------

async function seedDefaultData(): Promise<void> {
  // Employees
  const defaultEmployees: Partial<IEmployee>[] = [
   {
       id: 'EMP-001',
       name: 'Satheesh Thalekkara',
       designation: 'ceo',
       phoneNumber: '+971 50 123 4567',
       email: 'satheesh.ceo@company.com',
       address: 'Dubai Marina, UAE',
       salary: 50_000,
       hireDate: dayjs().subtract(2, 'year').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(2, 'year').toDate(),
       updatedAt: dayjs().subtract(1, 'month').toDate(),
     },
   
     // Manager
     {
       id: 'EMP-002',
       name: 'Dinesh',
       designation: 'staff',
       phoneNumber: '+971 50 123 4568',
       email: 'dinesh@company.com',
       address: 'Jumeirah, Dubai, UAE',
       salary: 40_000,
       hireDate: dayjs().subtract(18, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(18, 'month').toDate(),
       updatedAt: dayjs().subtract(2, 'week').toDate(),
       createdBy: 'EMP-001',
       updatedBy: 'EMP-001',
     },
   
     // Drivers
     {
       id: 'EMP-004',
       name: 'IQBAL',
       designation: 'driver',
       phoneNumber: '+971 50 123 4570',
       email: 'iqbal.driver@company.com',
       address: 'Deira, Dubai, UAE',
       routeName: 'Route A - Downtown',
       location: 'Downtown Dubai',
       balance: 5845,
       balanceHistory: [
         {
           id: 'BAL-001',
           previousBalance: 0,
           newBalance: 5845,
           changeAmount: 5845,
           reason: 'initial',
           date: dayjs().subtract(12, 'month').toDate(),
           updatedBy: 'EMP-002',
         }
       ],
       hireDate: dayjs().subtract(12, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(12, 'month').toDate(),
       updatedAt: dayjs().subtract(3, 'day').toDate(),
       createdBy: 'EMP-002',
       updatedBy: 'EMP-002',
     },
     {
       id: 'EMP-005',
       name: 'SEBEH',
       designation: 'driver',
       phoneNumber: '+971 50 123 4571',
       email: 'sebeh.driver@company.com',
       address: 'Bur Dubai, UAE',
       routeName: 'Route B - Marina',
       location: 'Dubai Marina',
       balance: 4233,
       balanceHistory: [
         {
           id: 'BAL-002',
           previousBalance: 0,
           newBalance: 4233,
           changeAmount: 4233,
           reason: 'initial',
           date: dayjs().subtract(10, 'month').toDate(),
           updatedBy: 'EMP-002',
         }
       ],
       hireDate: dayjs().subtract(10, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(10, 'month').toDate(),
       updatedAt: dayjs().subtract(2, 'day').toDate(),
       createdBy: 'EMP-002',
       updatedBy: 'EMP-002',
     },
     {
       id: 'EMP-006',
       name: 'RASHEED',
       designation: 'driver',
       phoneNumber: '+971 50 123 4572',
       email: 'rasheed.driver@company.com',
       address: 'Jumeirah, Dubai, UAE',
       routeName: 'Route C - JBR',
       location: 'Jumeirah Beach Residence',
       balance: 3590,
       balanceHistory: [
         {
           id: 'BAL-003',
           previousBalance: 0,
           newBalance: 3590,
           changeAmount: 3590,
           reason: 'initial',
           date: dayjs().subtract(8, 'month').toDate(),
           updatedBy: 'EMP-003',
         }
       ],
       hireDate: dayjs().subtract(8, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(8, 'month').toDate(),
       updatedAt: dayjs().subtract(1, 'day').toDate(),
       createdBy: 'EMP-003',
       updatedBy: 'EMP-003',
     },
     {
       id: 'EMP-007',
       name: 'SHINOOF',
       designation: 'driver',
       phoneNumber: '+971 50 123 4573',
       email: 'shinoof.driver@company.com',
       address: 'Sharjah, UAE',
       routeName: 'Route D - Sharjah',
       location: 'Sharjah City',
       balance: 6004,
       balanceHistory: [
         {
           id: 'BAL-004',
           previousBalance: 0,
           newBalance: 6004,
           changeAmount: 6004,
           reason: 'initial',
           date: dayjs().subtract(6, 'month').toDate(),
           updatedBy: 'EMP-003',
         }
       ],
       hireDate: dayjs().subtract(6, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(6, 'month').toDate(),
       updatedAt: dayjs().subtract(4, 'hour').toDate(),
       createdBy: 'EMP-003',
       updatedBy: 'EMP-003',
     },
     {
       id: 'EMP-008',
       name: 'ABHIJITH',
       designation: 'driver',
       phoneNumber: '+971 50 123 4574',
       email: 'abhijith.driver@company.com',
       address: 'Abu Dhabi, UAE',
       routeName: 'Route E - Abu Dhabi',
       location: 'Abu Dhabi City',
       balance: 2996,
       balanceHistory: [
         {
           id: 'BAL-005',
           previousBalance: 0,
           newBalance: 2996,
           changeAmount: 2996,
           reason: 'initial',
           date: dayjs().subtract(4, 'month').toDate(),
           updatedBy: 'EMP-002',
         }
       ],
       hireDate: dayjs().subtract(4, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(4, 'month').toDate(),
       updatedAt: dayjs().subtract(2, 'hour').toDate(),
       createdBy: 'EMP-002',
       updatedBy: 'EMP-002',
     },
     {
       id: 'EMP-009',
       name: 'AFSAL',
       designation: 'driver',
       phoneNumber: '+971 50 123 4575',
       email: 'afsal.driver@company.com',
       address: 'Al Quoz, Dubai, UAE',
       routeName: 'Route F - Industrial',
       location: 'Al Quoz Industrial Area',
       balance: 2208,
       balanceHistory: [
         {
           id: 'BAL-006',
           previousBalance: 0,
           newBalance: 2208,
           changeAmount: 2208,
           reason: 'initial',
           date: dayjs().subtract(3, 'month').toDate(),
           updatedBy: 'EMP-002',
         }
       ],
       hireDate: dayjs().subtract(3, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(3, 'month').toDate(),
       updatedAt: dayjs().subtract(1, 'hour').toDate(),
       createdBy: 'EMP-002',
       updatedBy: 'EMP-002',
     },
     {
       id: 'EMP-010',
       name: 'RIJAS',
       designation: 'driver',
       phoneNumber: '+971 50 123 4576',
       email: 'rijas.driver@company.com',
       address: 'Discovery Gardens, Dubai, UAE',
       routeName: 'Route G - Gardens',
       location: 'Discovery Gardens',
       balance: 12_049,
       balanceHistory: [
         {
           id: 'BAL-007',
           previousBalance: 0,
           newBalance: 12_049,
           changeAmount: 12_049,
           reason: 'initial',
           date: dayjs().subtract(2, 'month').toDate(),
           updatedBy: 'EMP-003',
         }
       ],
       hireDate: dayjs().subtract(2, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(2, 'month').toDate(),
       updatedAt: dayjs().subtract(30, 'minute').toDate(),
       createdBy: 'EMP-003',
       updatedBy: 'EMP-003',
     },
     {
       id: 'EMP-011',
       name: 'FAROOK',
       designation: 'driver',
       phoneNumber: '+971 50 123 4577',
       email: 'farook.driver@company.com',
       address: 'International City, Dubai, UAE',
       routeName: 'Route H - International',
       location: 'International City',
       balance: 6687,
       balanceHistory: [
         {
           id: 'BAL-008',
           previousBalance: 0,
           newBalance: 6687,
           changeAmount: 6687,
           reason: 'initial',
           date: dayjs().subtract(1, 'month').toDate(),
           updatedBy: 'EMP-002',
         }
       ],
       hireDate: dayjs().subtract(1, 'month').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(1, 'month').toDate(),
       updatedAt: dayjs().subtract(15, 'minute').toDate(),
       createdBy: 'EMP-002',
       updatedBy: 'EMP-002',
     },
     {
       id: 'EMP-012',
       name: 'SADIQUE',
       designation: 'driver',
       phoneNumber: '+971 50 123 4578',
       email: 'sadique.driver@company.com',
       address: 'Silicon Oasis, Dubai, UAE',
       routeName: 'Route I - Oasis',
       location: 'Dubai Silicon Oasis',
       balance: 18_468,
       balanceHistory: [
         {
           id: 'BAL-009',
           previousBalance: 0,
           newBalance: 18_468,
           changeAmount: 18_468,
           reason: 'initial',
           date: dayjs().subtract(3, 'week').toDate(),
           updatedBy: 'EMP-003',
         }
       ],
       hireDate: dayjs().subtract(3, 'week').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(3, 'week').toDate(),
       updatedAt: dayjs().subtract(10, 'minute').toDate(),
       createdBy: 'EMP-003',
       updatedBy: 'EMP-003',
     },
     {
       id: 'EMP-013',
       name: 'AJMAL',
       designation: 'driver',
       phoneNumber: '+971 50 123 4579',
       email: 'ajmal.driver@company.com',
       address: 'Sports City, Dubai, UAE',
       routeName: 'Route J - Sports',
       location: 'Dubai Sports City',
       balance: 4175,
       balanceHistory: [
         {
           id: 'BAL-010',
           previousBalance: 0,
           newBalance: 4175,
           changeAmount: 4175,
           reason: 'initial',
           date: dayjs().subtract(2, 'week').toDate(),
           updatedBy: 'EMP-002',
         }
       ],
       hireDate: dayjs().subtract(2, 'week').toDate(),
       isActive: true,
       createdAt: dayjs().subtract(2, 'week').toDate(),
       updatedAt: dayjs().subtract(5, 'minute').toDate(),
       createdBy: 'EMP-002',
       updatedBy: 'EMP-002',
     }
  ];

  await Calculation.findOneAndUpdate(
    { contextName: 'employee' },
    {
      $set: {
        inputs: { employees: defaultEmployees },
        metadata: { type: 'employee_data', description: 'Default employee data' },
      },
    },
    { upsert: true }
  );

  for (const emp of defaultEmployees) {
    await Employee.updateOne({ id: emp.id }, { $set: emp }, { upsert: true });
  }

  console.log('Employee data seeded');
  console.log('employees collection seeded');

  // Default settings
  const defaultSettings = [
    { key: 'company_name', value: 'Quality Food Stuffs' },
    { key: 'currency', value: 'AED' },
    { key: 'fresh_reduction_percentage', value: 11.5 },
    { key: 'bakery_reduction_percentage', value: 16 },
    { key: 'fresh_profit_percentage', value: 13.5 },
    { key: 'bakery_profit_percentage', value: 19.5 },
  ];

  for (const setting of defaultSettings) {
    await Setting.findOneAndUpdate({ key: setting.key }, { $set: { value: setting.value } }, { upsert: true });
  }

  console.log('Default settings seeded');

  // Helper function to generate displayNumber from ID
  const generateDisplayNumber = (id: string): string => {
    const match = id.match(/PRD-(FRS|BAK)-(\d+)/);
    if (match) {
      const prefix = match[1] === 'FRS' ? 'F' : 'B';
      const number = match[2];
      return `${prefix}${number}`;
    }
    return id;
  };

  // Products
  const defaultProducts: Partial<IProduct>[] = [
     {
    id: 'PRD-BAK-001',
    name: '8078 WHITE BREAD',
    category: 'bakery',
    price: 4.35,
    description: 'Fresh white bread',
    sku: 'BAK-WBR-001',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 3,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 4.35, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-002',
    name: '8013 BROWN BREAD',
    category: 'bakery',
    price: 4.5,
    description: 'Fresh brown bread',
    sku: 'BAK-BBR-002',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 3,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 4.5, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-003',
    name: '8037 MILK BREAD',
    category: 'bakery',
    price: 6.3,
    description: 'Milk bread',
    sku: 'BAK-MBR-003',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 3,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 6.3, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-004',
    name: '8071 BURGEN BUN',
    category: 'bakery',
    price: 3.43,
    description: 'Burgen bun',
    sku: 'BAK-BBU-004',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 2,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 3.43, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-005',
    name: '8094 BREAD MILK SMALL',
    category: 'bakery',
    price: 2.99,
    description: 'Small milk bread',
    sku: 'BAK-BMS-005',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 3,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.99, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-006',
    name: '8092 BREAD BROWN SMALL',
    category: 'bakery',
    price: 2.57,
    description: 'Small brown bread',
    sku: 'BAK-BBS-006',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 3,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.57, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-007',
    name: '8627 CHEESE PUFF 70 GM',
    category: 'bakery',
    price: 1.73,
    description: 'Cheese puff 70g',
    sku: 'BAK-CPF-007',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 7,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.73, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-008',
    name: '8867 7 DAYS 5+1',
    category: 'bakery',
    price: 8.65,
    description: '7 Days 5+1 product',
    sku: 'BAK-7DY-008',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 7,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 8.65, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-009',
    name: '8707 SWISS ROLL 330 GM',
    category: 'bakery',
    price: 7.8,
    description: 'Swiss roll 330g',
    sku: 'BAK-SWR-009',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 10,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 7.8, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-010',
    name: '8709 HAZZLENUT',
    category: 'bakery',
    price: 2.7,
    description: 'Hazelnut bakery item',
    sku: 'BAK-HZL-010',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 7,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.7, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-011',
    name: '8686 BUTTER JUMBO 85 GM',
    category: 'bakery',
    price: 2.6,
    description: 'Butter jumbo 85g',
    sku: 'BAK-BTJ-011',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 10,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-012',
    name: 'JUMBO BISCUT CREAM BUTTER',
    category: 'bakery',
    price: 2.6,
    description: 'Jumbo biscuit cream butter',
    sku: 'BAK-JBC-012',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 14,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-013',
    name: 'JUMBO DBL STR & VAN',
    category: 'bakery',
    price: 2.6,
    description: 'Jumbo double strawberry and vanilla',
    sku: 'BAK-JDS-013',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 14,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-014',
    name: '8420 CUP CAKE DOUBLE',
    category: 'bakery',
    price: 1.73,
    description: 'Double cup cake',
    sku: 'BAK-CCD-014',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 5,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.73, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-015',
    name: '8793 PUFF MIX',
    category: 'bakery',
    price: 1.73,
    description: 'Mixed puff pastry',
    sku: 'BAK-PFM-015',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 3,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.73, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-016',
    name: 'SANDWICH ROLL',
    category: 'bakery',
    price: 2.7,
    description: 'Sandwich roll',
    sku: 'BAK-SDR-016',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 2,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.7, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-017',
    name: '8409 CUP CAKE SINGLE',
    category: 'bakery',
    price: 8.23,
    description: 'Single cup cake',
    sku: 'BAK-CCS-017',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 5,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 8.23, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-018',
    name: '8655 PIZZA PUFF',
    category: 'bakery',
    price: 2.6,
    description: 'Pizza puff',
    sku: 'BAK-PZP-018',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 5,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-019',
    name: '8656 PUFF TRIPPLE CHEESE',
    category: 'bakery',
    price: 2.6,
    description: 'Triple cheese puff',
    sku: 'BAK-PTC-019',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 5,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-BAK-020',
    name: '8543 TORTILA WRAP PLAIN',
    category: 'bakery',
    price: 8.45,
    description: 'Plain tortilla wrap',
    sku: 'BAK-TWP-020',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 7,
    supplier: 'Bakery Supplier Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 8.45, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
   {
    id: 'PRD-FRS-001',
    name: '1089 LBN 180',
    category: 'fresh',
    price: 1.55,
    description: 'Laban 180ml',
    sku: 'FR-LBN-001',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.55, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-002',
    name: '1073 LBN 360',
    category: 'fresh',
    price: 2.6,
    description: 'Laban 360ml',
    sku: 'FR-LBN-002',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-003',
    name: '1117 STRW LBN 340',
    category: 'fresh',
    price: 2.48,
    description: 'Strawberry Laban 340ml',
    sku: 'FR-SLB-003',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.48, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-004',
    name: '1115 MANG LBN 340',
    category: 'fresh',
    price: 2.6,
    description: 'Mango Laban 340ml',
    sku: 'FR-MLB-004',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-005',
    name: '1107 LBN 2 LTR',
    category: 'fresh',
    price: 11.5,
    description: 'Laban 2 Liter',
    sku: 'FR-LBN-005',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 11.5, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-006',
    name: '2040 MILK 2 LTR',
    category: 'fresh',
    price: 11.5,
    description: 'Milk 2 Liter',
    sku: 'FR-MLK-006',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 11.5, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-007',
    name: '2121 MILK 1 LTR',
    category: 'fresh',
    price: 6.33,
    description: 'Milk 1 Liter',
    sku: 'FR-MLK-007',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 6.33, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-008',
    name: '2123 500 MILK',
    category: 'fresh',
    price: 3.16,
    description: 'Milk 500ml',
    sku: 'FR-MLK-008',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 3.16, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-009',
    name: '2124 500 LOW FAT MILK',
    category: 'fresh',
    price: 3.16,
    description: 'Low Fat Milk 500ml',
    sku: 'FR-LFM-009',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 3.16, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-010',
    name: '2081 MILK 180',
    category: 'fresh',
    price: 1.55,
    description: 'Milk 180ml',
    sku: 'FR-MLK-010',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.55, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-011',
    name: '2206 FLV MILK 225 ML',
    category: 'fresh',
    price: 1.87,
    description: 'Flavored Milk 225ml',
    sku: 'FR-FLM-011',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.87, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-012',
    name: '3193 YGT 1 KG',
    category: 'fresh',
    price: 6.61,
    description: 'Yogurt 1kg',
    sku: 'FR-YGT-012',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 14,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 6.61, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-013',
    name: '3115 YGT 500 GM',
    category: 'fresh',
    price: 3.73,
    description: 'Yogurt 500g',
    sku: 'FR-YGT-013',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 14,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 3.73, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-014',
    name: '3863 YGT 170 ML OUTER',
    category: 'fresh',
    price: 8.65,
    description: 'Yogurt 170ml Outer Pack',
    sku: 'FR-YGT-014',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 14,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 8.65, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-015',
    name: '3469 GHISTA 100 GM',
    category: 'fresh',
    price: 3.22,
    description: 'Ghee 100g',
    sku: 'FR-GHE-015',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 90,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 3.22, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-016',
    name: '3554 LABNAH PREMIUM 180 GM',
    category: 'fresh',
    price: 6.9,
    description: 'Premium Labneh 180g',
    sku: 'FR-LAB-016',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 6.9, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-017',
    name: '3902 PROTIN MILK 400 ML',
    category: 'fresh',
    price: 6.5,
    description: 'Protein Milk 400ml',
    sku: 'FR-PRM-017',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 6.5, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-018',
    name: '2196 MNGO MILK FLV 360 ML',
    category: 'fresh',
    price: 3,
    description: 'Mango Milk Flavor 360ml',
    sku: 'FR-MMF-018',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 3, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-019',
    name: '3521 CUSTRD 85GM',
    category: 'fresh',
    price: 1.03,
    description: 'Custard 85g',
    sku: 'FR-CUS-019',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 14,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.03, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-020',
    name: '3327 CARML 100 GM',
    category: 'fresh',
    price: 1.14,
    description: 'Caramel 100g',
    sku: 'FR-CAR-020',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 14,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.14, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-021',
    name: '3413 VETLAY',
    category: 'fresh',
    price: 1.57,
    description: 'Vetlay Product',
    sku: 'FR-VET-021',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 14,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.57, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-022',
    name: '7037 200 ML JUICE',
    category: 'fresh',
    price: 1.73,
    description: 'Juice 200ml',
    sku: 'FR-JUC-022',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Beverage Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.73, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-023',
    name: '7101 300 ML JUICE',
    category: 'fresh',
    price: 2.6,
    description: 'Juice 300ml',
    sku: 'FR-JUC-023',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Beverage Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 2.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-024',
    name: '7902 1.4 LTR JUICE',
    category: 'fresh',
    price: 11.25,
    description: 'Juice 1.4 Liter',
    sku: 'FR-JUC-024',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Beverage Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 11.25, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-025',
    name: '7778 KIDS JUICE',
    category: 'fresh',
    price: 1.73,
    description: 'Kids Juice',
    sku: 'FR-KJU-025',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Beverage Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.73, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-026',
    name: '1068 FLVD LBN 180 ML',
    category: 'fresh',
    price: 1.55,
    description: 'Flavored Laban 180ml',
    sku: 'FR-FLB-026',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.55, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-027',
    name: '5771 FETTA 400 GM',
    category: 'fresh',
    price: 14.4,
    description: 'Feta Cheese 400g',
    sku: 'FR-FET-027',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 14.4, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-028',
    name: '7977 ICE TEA 240 ML',
    category: 'fresh',
    price: 1.63,
    description: 'Ice Tea 240ml',
    sku: 'FR-ICE-028',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Beverage Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.63, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-029',
    name: '4242 LACTO FREE',
    category: 'fresh',
    price: 7.31,
    description: 'Lactose Free Milk',
    sku: 'FR-LFM-029',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 7,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 7.31, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-030',
    name: '4304 BUTTER GHEE 400 GM',
    category: 'fresh',
    price: 36.2,
    description: 'Butter Ghee 400g',
    sku: 'FR-BGH-030',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 90,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 36.2, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
   {
    id: 'PRD-FRS-031',
    name: '4303 CONDNS MILK 397 GM',
    category: 'fresh',
    price: 14.1,
    description: 'Condensed Milk 397g',
    sku: 'FR-CML-031',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 365,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 14.1, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-032',
    name: '5027 JAR CHEESE BLUE 200 GM',
    category: 'fresh',
    price: 18,
    description: 'Blue Cheese Jar 200g',
    sku: 'FR-BCJ-032',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 60,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 18, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-033',
    name: '5492 FETTA 200 GM',
    category: 'fresh',
    price: 7.6,
    description: 'Feta Cheese 200g',
    sku: 'FR-FET-033',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 7.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-034',
    name: '50044 TRIANGLE 120 GM',
    category: 'fresh',
    price: 11,
    description: 'Triangle Cheese 120g',
    sku: 'FR-TRC-034',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 11, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-035',
    name: '5948 SLICE BURGER',
    category: 'fresh',
    price: 21,
    description: 'Burger Slice Cheese',
    sku: 'FR-BSC-035',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 21, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-036',
    name: '50007 MOZZARILLA 180 GM',
    category: 'fresh',
    price: 13.22,
    description: 'Mozzarella Cheese 180g',
    sku: 'FR-MOZ-036',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 13.22, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-037',
    name: '4317 COOKING CREAM 500 ML',
    category: 'fresh',
    price: 21,
    description: 'Cooking Cream 500ml',
    sku: 'FR-CCR-037',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 21, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-038',
    name: '5817 SANDICH SLICE 200 GM',
    category: 'fresh',
    price: 21,
    description: 'Sandwich Slice Cheese 200g',
    sku: 'FR-SSC-038',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 21, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-039',
    name: '4364 COOKING CREAM 1 LTR',
    category: 'fresh',
    price: 39.22,
    description: 'Cooking Cream 1 Liter',
    sku: 'FR-CCR-039',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 39.22, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-040',
    name: '5015 TEA MILK 180 GM',
    category: 'fresh',
    price: 10.25,
    description: 'Tea Milk 180g',
    sku: 'FR-TML-040',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 10.25, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-041',
    name: '4414 PLFLRA HNY 250 GM',
    category: 'fresh',
    price: 16.38,
    description: 'Plflra Honey 250g',
    sku: 'FR-PLH-041',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 365,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 16.38, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-042',
    name: '5005 HALLOUMI 200GM',
    category: 'fresh',
    price: 13.65,
    description: 'Halloumi Cheese 200g',
    sku: 'FR-HAL-042',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 45,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 13.65, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-043',
    name: '50054 LONG LIFE CREAM',
    category: 'fresh',
    price: 15.26,
    description: 'Long Life Cream',
    sku: 'FR-LLC-043',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 90,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 15.26, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-044',
    name: '4245 UHT MILK 200 ML',
    category: 'fresh',
    price: 1.72,
    description: 'UHT Milk 200ml',
    sku: 'FR-UHT-044',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 180,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.72, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-045',
    name: '5671 CREAM CHEESE PORTION',
    category: 'fresh',
    price: 14.1,
    description: 'Cream Cheese Portion',
    sku: 'FR-CCP-045',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 14.1, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-046',
    name: '5998 BUTTER UNSALT',
    category: 'fresh',
    price: 17.5,
    description: 'Unsalted Butter',
    sku: 'FR-UBT-046',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 60,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 17.5, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-047',
    name: '5901 SLICE CHEDDAR 200 GM',
    category: 'fresh',
    price: 22.2,
    description: 'Cheddar Slice 200g',
    sku: 'FR-CSC-047',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 22.2, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-048',
    name: '4402 MILK POWDER 2.25 KG',
    category: 'fresh',
    price: 48.3,
    description: 'Milk Powder 2.25kg',
    sku: 'FR-MPD-048',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 10,
    isActive: true,
    expiryDays: 365,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 48.3, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-049',
    name: '5642 CREAM CHEESE PORTION',
    category: 'fresh',
    price: 31.5,
    description: 'Cream Cheese Portion Large',
    sku: 'FR-CCL-049',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 31.5, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-050',
    name: '5317 SLICE SANDWICH 200 GM',
    category: 'fresh',
    price: 7,
    description: 'Sandwich Slice 200g',
    sku: 'FR-SSS-050',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 7, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-051',
    name: '5319 SLICE LITE 200 GM',
    category: 'fresh',
    price: 8.23,
    description: 'Lite Slice Cheese 200g',
    sku: 'FR-LSC-051',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 8.23, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-052',
    name: '50006 MOZZARILLA 900 GM',
    category: 'fresh',
    price: 31,
    description: 'Mozzarella Cheese 900g',
    sku: 'FR-MOZ-052',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 10,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 31, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-053',
    name: '4529 NATURAL BUTTER UNSALT',
    category: 'fresh',
    price: 20.8,
    description: 'Natural Unsalted Butter',
    sku: 'FR-NUB-053',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 60,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 20.8, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-054',
    name: '5646 BLUE JAR',
    category: 'fresh',
    price: 51.8,
    description: 'Blue Cheese Jar',
    sku: 'FR-BCJ-054',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 10,
    isActive: true,
    expiryDays: 60,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 51.8, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-055',
    name: '4528 BUTTER UNSALT 200 GM',
    category: 'fresh',
    price: 9.6,
    description: 'Unsalted Butter 200g',
    sku: 'FR-UBT-055',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 60,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 9.6, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-056',
    name: '5656 TIN CHEESE',
    category: 'fresh',
    price: 25.4,
    description: 'Tin Cheese',
    sku: 'FR-TCH-056',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 15,
    isActive: true,
    expiryDays: 90,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 25.4, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-057',
    name: '4224 COOKING CREAM 250 ML',
    category: 'fresh',
    price: 8.5,
    description: 'Cooking Cream 250ml',
    sku: 'FR-CCR-057',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 8.5, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-058',
    name: '4222 WHIPPING CREAM 250 ML',
    category: 'fresh',
    price: 6.45,
    description: 'Whipping Cream 250ml',
    sku: 'FR-WCR-058',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 6.45, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-059',
    name: '5526 JAR CHEESE 120 GM',
    category: 'fresh',
    price: 5.7,
    description: 'Jar Cheese 120g',
    sku: 'FR-JCH-059',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 60,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 5.7, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-060',
    name: '50002 CHEDDAR BLK',
    category: 'fresh',
    price: 9.3,
    description: 'Cheddar Block Cheese',
    sku: 'FR-CBC-060',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 9.3, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-061',
    name: '7975 JUICE MANGO 140 ML',
    category: 'fresh',
    price: 1.25,
    description: 'Mango Juice 140ml',
    sku: 'FR-MJU-061',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Beverage Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 1.25, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-062',
    name: '3867 YGT 100 GM',
    category: 'fresh',
    price: 0.95,
    description: 'Yogurt 100g',
    sku: 'FR-YGT-062',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 50,
    isActive: true,
    expiryDays: 14,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 0.95, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-063',
    name: '5949 SLICE LITE 200 GM',
    category: 'fresh',
    price: 25.98,
    description: 'Lite Slice Cheese 200g',
    sku: 'FR-LSC-063',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 25.98, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-064',
    name: '50005 MOZZARILLA 450 GM',
    category: 'fresh',
    price: 23.58,
    description: 'Mozzarella Cheese 450g',
    sku: 'FR-MOZ-064',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 23.58, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-065',
    name: '4318 WHIPPING CREAM 500 ML',
    category: 'fresh',
    price: 21,
    description: 'Whipping Cream 500ml',
    sku: 'FR-WCR-065',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 20,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 21, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-066',
    name: '50051 HALLOUMI 200 GM',
    category: 'fresh',
    price: 13.65,
    description: 'Halloumi Cheese 200g',
    sku: 'FR-HAL-066',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 25,
    isActive: true,
    expiryDays: 45,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 13.65, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-067',
    name: '5316 SLICE BURGER 200 GM',
    category: 'fresh',
    price: 7,
    description: 'Burger Slice Cheese 200g',
    sku: 'FR-BSC-067',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 30,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 7, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-068',
    name: '4426 UHT MILK NIJOOM 150 ML',
    category: 'fresh',
    price: 7.2,
    description: 'UHT Milk Nijooms 150ml',
    sku: 'FR-UHT-068',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 40,
    isActive: true,
    expiryDays: 180,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 7.2, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-069',
    name: '5917 FETA LITE',
    category: 'fresh',
    price: 5.78,
    description: 'Lite Feta Cheese',
    sku: 'FR-LFC-069',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 5.78, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  },
  {
    id: 'PRD-FRS-070',
    name: '4424 UHT MILK STRAWBERRY',
    category: 'fresh',
    price: 7.2,
    description: 'UHT Milk Strawberry',
    sku: 'FR-UHT-070',
    unit: 'kg',
    minimumQuantity: 1,
    maximumQuantity: 30,
    isActive: true,
    expiryDays: 21,
    supplier: 'Fresh Dairy Co.',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'EMP-001',
    updatedBy: 'EMP-001',
    priceHistory: [
      { version: 1, price: 7.2, updatedAt: new Date(), updatedBy: 'Admin' }
    ]
  }
  ]

  await Calculation.findOneAndUpdate(
    { contextName: 'product' },
    {
      $set: {
        inputs: { products: defaultProducts },
        metadata: { type: 'product_data', description: 'Default product data' },
      },
    },
    { upsert: true }
  );

  // Add displayNumber to all products if not present
  for (const pr of defaultProducts) {
    const productWithDisplayNumber = {
      ...pr,
      displayNumber: pr.displayNumber || generateDisplayNumber(pr.id!),
    };
    await Product.updateOne({ id: pr.id }, { $set: productWithDisplayNumber }, { upsert: true });
  }

  console.log('Product data seeded');
  await DailyTrip.createCollection().catch(() => {});
  console.log('daily_trips collection ensured');

  // Additional Expenses - removed seed data
  console.log('No additional expenses to seed');

  // Daily Trips - removed seed data
  console.log('No daily trips to seed');
}

async function seedDailyTrips(): Promise<void> {
  // Load data from daily_trips.json
  const jsonFilePath = path.join(process.cwd(), 'daily_trips.json');
  
  if (!fs.existsSync(jsonFilePath)) {
    console.log('daily_trips.json not found, skipping...');
    return;
  }
  
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
  
  // Parse JSON data and convert to IDailyTrip format
  for (const tripData of jsonData) {
    // Convert MongoDB date format to Date object
    const tripDate = tripData.date?.$date ? new Date(tripData.date.$date) : new Date(tripData.date);
    const createdAt = tripData.createdAt?.$date ? new Date(tripData.createdAt.$date) : new Date();
    const updatedAt = tripData.updatedAt?.$date ? new Date(tripData.updatedAt.$date) : new Date();
    
    // Clean products array (remove _id field)
    const products = tripData.products.map((p: any) => ({
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
    }));
    
    // Clean transfer data
    const transfer = tripData.transfer || {
      isProductTransferred: false,
      transferredProducts: [],
    };
    
    // Clean acceptedProducts array
    const acceptedProducts = (tripData.acceptedProducts || []).map((p: any) => ({
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
    }));
    
    const trip: Partial<IDailyTrip> = {
      id: tripData.id,
      driverId: tripData.driverId,
      driverName: tripData.driverName,
      date: tripDate,
      products,
      transfer,
      acceptedProducts,
      collectionAmount: tripData.collectionAmount || 0,
      purchaseAmount: tripData.purchaseAmount || 0,
      expiry: tripData.expiry || 0,
      discount: tripData.discount || 0,
      petrol: tripData.petrol || 0,
      totalAmount: tripData.totalAmount || 0,
      netTotal: tripData.netTotal || 0,
      grandTotal: tripData.grandTotal || 0,
      profit: tripData.profit || 0,
      createdAt,
      updatedAt,
      createdBy: tripData.createdBy,
      updatedBy: tripData.updatedBy || tripData.createdBy,
    };
    
    await DailyTrip.create(trip);
  }

  console.log(`Daily trips seeded from JSON (${jsonData.length} trips)`);
}

// ----------------------
// Main
// ----------------------

async function main(): Promise<void> {
  await connectToDatabase();
  await ensureSuperAdmin();
  await seedDefaultData();
  console.log('Seeding complete');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
