import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRequestUser } from './auth';

export function requireRole(req: NextRequest, roles: string[]) {
  const user = getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!user.roles?.some((r) => roles.includes(r))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}


