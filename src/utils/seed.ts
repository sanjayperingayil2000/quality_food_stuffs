import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import { Setting } from '@/models/setting';
import { Calculation } from '@/models/calculation';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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

  // Seed default product data (fresh products)
  const defaultFreshProducts = [
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
    }
  ];

  // Seed default product data (bakery products)
  const defaultBakeryProducts = [
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
    }
  ];

  const allProducts = [...defaultFreshProducts, ...defaultBakeryProducts];

  // Seed product calculation
  await Calculation.findOneAndUpdate(
    { contextName: 'product' },
    { 
      $set: { 
        inputs: { products: allProducts },
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
  
  // Optionally seed from file if provided
  const file = process.argv[2];
  if (file && fs.existsSync(file)) {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);

    if (Array.isArray(data.settings)) {
      for (const s of data.settings) {
        await Setting.findOneAndUpdate({ key: s.key }, { $set: { value: s.value } }, { upsert: true });
      }
      console.log('Additional settings from file seeded');
    }

    if (Array.isArray(data.calculations)) {
      for (const c of data.calculations) {
        await Calculation.findOneAndUpdate(
          { contextName: c.contextName },
          { $set: { inputs: c.inputs, results: c.results, metadata: c.metadata } },
          { upsert: true }
        );
      }
      console.log('Additional calculations from file seeded');
    }
  }
  
  console.log('Seeding complete');
  return;
}

try {
  await main();
} catch (error) {
  console.error(error);
  throw error;
}


