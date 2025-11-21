import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import { RefreshToken } from '@/models/refresh-token';

function generateDefaultPassword(): string {
  return 'Asqwer@';
}

export async function listUsers() {
  await connectToDatabase();
  return User.find().select('-passwordHash').lean();
}

export async function createUser({ name, email, password, roles }: { name: string; email: string; password?: string; roles?: string[] }) {
  await connectToDatabase();
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already in use');

  const trimmedPassword = password?.trim() ?? '';
  const finalPassword = trimmedPassword.length > 0 ? trimmedPassword : generateDefaultPassword();
  const mustChangePassword = trimmedPassword.length === 0;

  const passwordHash = await bcrypt.hash(finalPassword, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    roles: roles && roles.length > 0 ? roles : ['manager'],
    mustChangePassword,
  });

  const userObj = user.toObject();
  delete (userObj as { passwordHash?: unknown }).passwordHash;

  return {
    user: userObj,
    defaultPassword: mustChangePassword ? finalPassword : undefined,
  };
}

export async function getUserById(id: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  return User.findById(id).select('-passwordHash').lean();
}

export async function updateUser(id: string, updates: Partial<{ name: string; email?: string; roles: string[]; isActive: boolean; phone?: string; state?: string; city?: string; profilePhoto?: string | null; password?: string; mustChangePassword?: boolean }>) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;
  
  // If email is being updated, check if it's already in use by another user
  if (updates.email) {
    const existing = await User.findOne({ email: updates.email, _id: { $ne: id } });
    if (existing) throw new Error('Email already in use');
  }
  
  // Prepare update data
  const updateData: Partial<{ name: string; email: string; roles: string[]; isActive: boolean; phone?: string; state?: string; city?: string; profilePhoto?: string | null; passwordHash: string; mustChangePassword: boolean }> = {};
  
  // Copy all fields except password
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.roles !== undefined) updateData.roles = updates.roles;
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.state !== undefined) updateData.state = updates.state;
  if (updates.city !== undefined) updateData.city = updates.city;
  if (Object.prototype.hasOwnProperty.call(updates, 'profilePhoto')) {
    updateData.profilePhoto = updates.profilePhoto ?? null;
  }
  if (updates.mustChangePassword !== undefined) {
    updateData.mustChangePassword = updates.mustChangePassword;
  }
  
  // If password is provided, hash it
  if (updates.password) {
    updateData.passwordHash = await bcrypt.hash(updates.password, 12);
    updateData.mustChangePassword = updates.mustChangePassword ?? true;
  }
  
  return User.findByIdAndUpdate(id, { $set: updateData }, { new: true, projection: { passwordHash: 0 } }).lean();
}

export async function deleteUser(id: string) {
  await connectToDatabase();
  console.log('deleteUser called with ID:', id);
  console.log('ID is valid ObjectId:', Types.ObjectId.isValid(id));
  if (!Types.ObjectId.isValid(id)) return null;
  const result = await User.findByIdAndDelete(id).lean();
  console.log('MongoDB delete result:', result);
  return result;
}

export async function updateUserPassword(id: string, newPassword: string) {
  await connectToDatabase();
  if (!Types.ObjectId.isValid(id)) return null;

  const user = await User.findById(id);
  if (!user) {
    return null;
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    throw new Error('New password must be different from the current password');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordHash = passwordHash;
  user.mustChangePassword = false;
  await user.save();

  await RefreshToken.deleteMany({ userId: user._id });

  const sanitized = user.toObject();
  delete (sanitized as { passwordHash?: unknown }).passwordHash;
  return sanitized;
}


