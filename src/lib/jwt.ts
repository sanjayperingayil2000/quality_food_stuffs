import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string; // user id
  roles: string[];
  iat?: number;
  exp?: number;
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
}

export function signResetToken(payload: Record<string, unknown>): string {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.RESET_PASSWORD_TOKEN_EXPIRES_IN || '1h',
  });
}


