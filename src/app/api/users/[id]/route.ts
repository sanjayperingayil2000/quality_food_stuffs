import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/role';
import { userUpdateSchema } from '@/utils/validators';
import { deleteUser, getUserById, updateUser } from '@/services/user-service';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const { id } = await params;
    const user = await getUserById(id);
    if (!user) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    return withCors(NextResponse.json({ user }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin']);
  if (forbidden) return withCors(forbidden);
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    const user = await updateUser(id, parsed.data);
    if (!user) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    return withCors(NextResponse.json({ user }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin']);
  if (forbidden) return withCors(forbidden);
  try {
    const { id } = await params;
    console.log('Attempting to delete user with ID:', id);
    const user = await deleteUser(id);
    console.log('Delete result:', user);
    if (!user) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    return withCors(NextResponse.json({ success: true }, { status: 200 }));
  } catch (error) {
    console.error('Error deleting user:', error);
    return withCors(jsonError(error, 500));
  }
}


