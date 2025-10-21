import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/role';
import { settingCreateSchema } from '@/utils/validators';
import { connectToDatabase } from '@/lib/db';
import { Setting } from '@/models/setting';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin']);
  if (forbidden) return withCors(forbidden);
  try {
    await connectToDatabase();
    const settings = await Setting.find().lean();
    return withCors(NextResponse.json({ settings }, { status: 200 }));
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
    const parsed = settingCreateSchema.safeParse(body);
    if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    await connectToDatabase();
    const setting = await Setting.findOneAndUpdate(
      { key: parsed.data.key },
      { $set: { value: parsed.data.value } },
      { upsert: true, new: true }
    );
    return withCors(NextResponse.json({ setting }, { status: 201 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


