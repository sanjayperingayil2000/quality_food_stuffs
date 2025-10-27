import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { calculationCreateSchema } from '@/utils/validators';
import { createCalculation, listCalculations } from '@/services/calculation-service';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  try {
    const url = new URL(req.url);
    const contextName = url.searchParams.get('contextName') || undefined;
    const userId = url.searchParams.get('userId') || undefined;
    const items = await listCalculations({ contextName, userId });
    return withCors(NextResponse.json({ items }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

export async function POST(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  try {
    const body = await req.json();
    const parsed = calculationCreateSchema.safeParse(body);
    if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    const user = getRequestUser(authed);
    const created = await createCalculation({ ...parsed.data, userId: user?.sub });
    return withCors(NextResponse.json({ item: created }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


