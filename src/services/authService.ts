import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { RefreshToken } from '@/models/RefreshToken';
import { signAccessToken } from '@/lib/jwt';

const REFRESH_TTL_MS = (() => {
  const env = process.env.REFRESH_TOKEN_EXPIRES_IN || '2h';
  if (env.endsWith('h')) return Number(env.replace('h', '')) * 60 * 60 * 1000;
  if (env.endsWith('m')) return Number(env.replace('m', '')) * 60 * 1000;
  return 2 * 60 * 60 * 1000;
})();

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function signup({ name, email, password, roles }: { name: string; email: string; password: string; roles?: string[] }) {
  await connectToDatabase();
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Email already in use');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, roles: roles && roles.length > 0 ? roles : ['manager'] });
  return user;
}

export async function login({ email, password }: { email: string; password: string }) {
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error('Invalid credentials');
  if (!user.isActive) throw new Error('User is inactive');

  const accessToken = signAccessToken({ sub: (user as any)._id.toString(), roles: (user as any).roles });
  const refreshTokenPlain = crypto.randomBytes(48).toString('hex');
  const tokenHash = hashToken(refreshTokenPlain);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await RefreshToken.create({ userId: new Types.ObjectId((user as any)._id), tokenHash, createdAt: new Date(), expiresAt, revoked: false });

  return { user, accessToken, refreshToken: refreshTokenPlain };
}

export async function refreshToken({ refreshToken }: { refreshToken: string }) {
  await connectToDatabase();
  const tokenHash = hashToken(refreshToken);
  const existing = await RefreshToken.findOne({ tokenHash, revoked: false, expiresAt: { $gt: new Date() } });
  if (!existing) throw new Error('Invalid refresh token');

  // rotate: revoke old token
  existing.revoked = true;
  await existing.save();

  const user = await User.findById(existing.userId);
  if (!user) throw new Error('User not found');

  const accessToken = signAccessToken({ sub: (user as any)._id.toString(), roles: (user as any).roles });
  const refreshTokenPlain = crypto.randomBytes(48).toString('hex');
  const newHash = hashToken(refreshTokenPlain);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  await RefreshToken.create({ userId: (user as any)._id, tokenHash: newHash, createdAt: new Date(), expiresAt, revoked: false });

  return { accessToken, refreshToken: refreshTokenPlain };
}

export async function logout({ refreshToken }: { refreshToken: string }) {
  await connectToDatabase();
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.updateMany({ tokenHash }, { $set: { revoked: true } });
}


