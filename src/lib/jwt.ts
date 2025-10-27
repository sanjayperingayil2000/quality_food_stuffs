import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface JwtPayload {
  sub: string; // user id
  roles: string[];
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  return jwt.verify(token, secret) as JwtPayload;
}

export function signResetToken(payload: Record<string, unknown>): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}


