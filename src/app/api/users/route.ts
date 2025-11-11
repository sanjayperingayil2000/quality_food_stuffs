import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/role';
import { signupSchema } from '@/utils/validators';
import { createUser, listUsers } from '@/services/user-service';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin']);
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
  const forbidden = requireRole(authed, ['super_admin']);
  if (forbidden) return withCors(forbidden);
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    const { user, defaultPassword } = await createUser(parsed.data);
    return withCors(NextResponse.json({ user, defaultPassword }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


