import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/errorHandler';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/role';
import { settingUpdateSchema } from '@/utils/validators';
import { connectToDatabase } from '@/lib/db';
import { Setting } from '@/models/Setting';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: { key: string } }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin']);
  if (forbidden) return withCors(forbidden);
  try {
    const body = await req.json();
    const parsed = settingUpdateSchema.safeParse(body);
    if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    await connectToDatabase();
    const setting = await Setting.findOneAndUpdate(
      { key: params.key },
      { $set: { value: parsed.data.value } },
      { new: true }
    );
    if (!setting) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    return withCors(NextResponse.json({ setting }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


