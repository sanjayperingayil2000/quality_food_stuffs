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

export async function updateUser(id: string, updates: Partial<{ name: string; email?: string; roles: string[]; isActive: boolean; phone?: string; state?: string; city?: string; profilePhoto?: string; password?: string }>) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  
  // If email is being updated, check if it's already in use by another user
  if (updates.email) {
    const existing = await User.findOne({ email: updates.email, _id: { $ne: id } });
    if (existing) throw new Error('Email already in use');
  }
  
  // Prepare update data
  const updateData: Partial<{ name: string; email: string; roles: string[]; isActive: boolean; phone?: string; state?: string; city?: string; profilePhoto?: string; passwordHash: string }> = {};
  
  // Copy all fields except password
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.roles !== undefined) updateData.roles = updates.roles;
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.state !== undefined) updateData.state = updates.state;
  if (updates.city !== undefined) updateData.city = updates.city;
  if (updates.profilePhoto !== undefined) updateData.profilePhoto = updates.profilePhoto;
  
  // If password is provided, hash it
  if (updates.password) {
    updateData.passwordHash = await bcrypt.hash(updates.password, 12);
  }
  
  return User.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
}

export async function deleteUser(id: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  return User.findByIdAndDelete(id).lean();
}


