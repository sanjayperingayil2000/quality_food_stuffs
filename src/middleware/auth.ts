import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

export function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const payload = verifyAccessToken(token);
    // Attach to request headers for downstream usage as JSON string
    const requestWithUser = new NextRequest(req.url, {
      headers: req.headers,
      method: req.method,
      body: req.body as any,
      duplex: 'half',
    });
    requestWithUser.headers.set('x-user', JSON.stringify(payload));
    return requestWithUser;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

export function getRequestUser(req: NextRequest): { sub: string; roles: string[] } | null {
  const raw = req.headers.get('x-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


