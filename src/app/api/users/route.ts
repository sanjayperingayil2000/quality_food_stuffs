import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { requireRole } from '@/middleware/role';
import { signupSchema } from '@/utils/validators';
import { createUser, listUsers } from '@/services/user-service';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin', 'manager']);
  if (forbidden) return withCors(forbidden);
  try {
    const users = await listUsers();
    return withCors(NextResponse.json({ users }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function POST(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin', 'manager']);
  if (forbidden) return withCors(forbidden);
  try {
    const user = getRequestUser(authed);
    const isManager = user?.roles?.includes('manager') && !user?.roles?.includes('super_admin');
    
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    
    // If user is a manager (not super_admin), they can only create drivers
    if (isManager) {
      const roles = parsed.data.roles || [];
      if (roles.length !== 1 || roles[0] !== 'driver') {
        return withCors(NextResponse.json({ error: 'Managers can only create users with driver role' }, { status: 403 }));
      }
    }
    
    const { user: createdUser, defaultPassword } = await createUser(parsed.data);
    return withCors(NextResponse.json({ user: createdUser, defaultPassword }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


