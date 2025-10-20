/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

let isConnected = 0; // 0 = disconnected, 1 = connecting, 2 = connected

async function connectToDatabase() {
  if (isConnected === 2) {
    return mongoose;
  }

  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL is not set in environment variables');
  }

  if (isConnected === 1) {
    // connection in progress
    return mongoose;
  }

  isConnected = 1;

  mongoose.set('strictQuery', true);

  await mongoose.connect(process.env.MONGO_URL, {
    dbName: 'qualityfoodstuffs',
  });

  isConnected = 2;
  return mongoose;
}

// Define schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  roles: { type: [String], enum: ['super_admin', 'manager'], default: ['manager'], index: true },
  isActive: { type: Boolean, default: true },
  settingsAccess: { type: Boolean, default: false },
}, { timestamps: true });

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const CalculationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contextName: { type: String, required: true, index: true },
  inputs: { type: mongoose.Schema.Types.Mixed, required: true },
  results: { type: mongoose.Schema.Types.Mixed },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
const Calculation = mongoose.models.Calculation || mongoose.model('Calculation', CalculationSchema);

async function ensureSuperAdmin() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  const name = process.env.SEED_SUPER_ADMIN_NAME || 'Super Admin';
  if (!email || !password) {
    console.log('SEED_SUPER_ADMIN_* envs not set, skipping super admin creation');
    return;
  }
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Super admin already exists');
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email, passwordHash, roles: ['super_admin'], isActive: true });
  console.log('Super admin created');
}

async function seedDefaultData() {
  // Seed default employee data
  const defaultEmployees = [
    // CEO
    {
      id: 'EMP-001',
      name: 'Ahmed Al-Rashid',
      designation: 'ceo',
      phoneNumber: '+971 50 123 4567',
      email: 'ahmed.ceo@company.com',
      address: 'Dubai Marina, UAE',
      salary: 50_000,
      hireDate: dayjs().subtract(2, 'year').toDate(),
      isActive: true,
      createdAt: dayjs().subtract(2, 'year').toDate(),
      updatedAt: dayjs().subtract(1, 'month').toDate(),
    },
    // Staff
    {
      id: 'EMP-002',
      name: 'Sarah Johnson',
      designation: 'staff',
      phoneNumber: '+971 50 123 4568',
      email: 'sarah.staff@company.com',
      address: 'Jumeirah, Dubai, UAE',
      salary: 25_000,
      hireDate: dayjs().subtract(18, 'month').toDate(),
      isActive: true,
      createdAt: dayjs().subtract(18, 'month').toDate(),
      updatedAt: dayjs().subtract(2, 'week').toDate(),
      createdBy: 'EMP-001',
      updatedBy: 'EMP-001',
    },
    {
      id: 'EMP-003',
      name: 'Mohammed Hassan',
      designation: 'staff',
      phoneNumber: '+971 50 123 4569',
      email: 'mohammed.staff@company.com',
      address: 'Downtown Dubai, UAE',
      salary: 25_000,
      hireDate: dayjs().subtract(15, 'month').toDate(),
      isActive: true,
      createdAt: dayjs().subtract(15, 'month').toDate(),
      updatedAt: dayjs().subtract(1, 'week').toDate(),
      createdBy: 'EMP-001',
      updatedBy: 'EMP-002',
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
    }
  ];

  // Seed employee calculation
  await Calculation.findOneAndUpdate(
    { contextName: 'employee' },
    { 
      $set: { 
        inputs: { employees: defaultEmployees },
        metadata: { type: 'employee_data', description: 'Default employee data' }
      } 
    },
    { upsert: true }
  );
  console.log('Employee data seeded');

  // Seed default settings
  const defaultSettings = [
    { key: 'company_name', value: 'Quality Food Stuffs' },
    { key: 'currency', value: 'AED' },
    { key: 'fresh_reduction_percentage', value: 11.5 },
    { key: 'bakery_reduction_percentage', value: 16 },
    { key: 'fresh_profit_percentage', value: 13.5 },
    { key: 'bakery_profit_percentage', value: 19.5 },
  ];

  for (const setting of defaultSettings) {
    await Setting.findOneAndUpdate(
      { key: setting.key },
      { $set: { value: setting.value } },
      { upsert: true }
    );
  }
  console.log('Default settings seeded');

  // Seed default product data
  const defaultProducts = [
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
    }
  ];

  // Seed product calculation
  await Calculation.findOneAndUpdate(
    { contextName: 'product' },
    { 
      $set: { 
        inputs: { products: defaultProducts },
        metadata: { type: 'product_data', description: 'Default product data' }
      } 
    },
    { upsert: true }
  );
  console.log('Product data seeded');
}

async function main() {
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
