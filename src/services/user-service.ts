import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';

export async function listUsers() {
  await connectToDatabase();
  return User.find().lean();
}

export async function createUser({ name, email, password, roles }: { name: string; email: string; password: string; roles?: string[] }) {
  await connectToDatabase();
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already in use');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, roles: roles && roles.length > 0 ? roles : ['manager'] });
  return user.toObject();
}

export async function getUserById(id: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  return User.findById(id).lean();
}

export async function updateUser(id: string, updates: Partial<{ name: string; roles: string[]; isActive: boolean }>) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  return User.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
}

export async function deleteUser(id: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  return User.findByIdAndDelete(id).lean();
}


