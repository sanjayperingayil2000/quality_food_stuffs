import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/errorHandler';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { calculationUpdateSchema } from '@/utils/validators';
import { deleteCalculation, getCalculation, updateCalculation } from '@/services/calculationService';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  try {
    const { id } = await params;
    const item = await getCalculation(id);
    if (!item) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    return withCors(NextResponse.json({ item }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = calculationUpdateSchema.safeParse(body);
    if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    const user = getRequestUser(authed);
    const item = await updateCalculation(id, parsed.data, user?.sub);
    if (!item) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    return withCors(NextResponse.json({ item }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  try {
    const { id } = await params;
    const user = getRequestUser(authed);
    const item = await deleteCalculation(id, user?.sub);
    if (!item) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    return withCors(NextResponse.json({ success: true }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


