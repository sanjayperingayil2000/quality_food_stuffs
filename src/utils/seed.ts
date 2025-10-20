/* eslint-disable no-console */
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { Setting } from '@/models/Setting';
import { Calculation } from '@/models/Calculation';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

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

async function seedFromFile(filePath: string) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.log('Seed file not found, skipping:', resolved);
    return;
  }
  const raw = fs.readFileSync(resolved, 'utf-8');
  const data = JSON.parse(raw);

  if (Array.isArray(data.settings)) {
    for (const s of data.settings) {
      await Setting.findOneAndUpdate({ key: s.key }, { $set: { value: s.value } }, { upsert: true });
    }
    console.log('Settings seeded');
  }

  if (Array.isArray(data.calculations)) {
    for (const c of data.calculations) {
      await Calculation.findOneAndUpdate(
        { _id: c._id || undefined },
        { $set: { contextName: c.contextName, inputs: c.inputs, results: c.results, metadata: c.metadata } },
        { upsert: true }
      );
    }
    console.log('Calculations seeded');
  }
}

async function main() {
  await connectToDatabase();
  await ensureSuperAdmin();
  const file = process.argv[2] || 'seed_data.json';
  await seedFromFile(file);
  console.log('Seeding complete');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


