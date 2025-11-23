import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

export function requireAuth(req: NextRequest) {
  // Allow disabling auth in non-production environments for debugging
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const payload = verifyAccessToken(token);
    
    // Instead of creating a new NextRequest, we'll attach the user info to the existing request
    // by modifying the headers directly
    req.headers.set('x-user', JSON.stringify(payload));
    return req;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

export function getRequestUser(req: NextRequest): { sub: string; roles: string[]; employeeId?: string } | null {
  const raw = req.headers.get('x-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


