import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/role';
import { settingUpdateSchema } from '@/utils/validators';
import { connectToDatabase } from '@/lib/db';
import { Setting } from '@/models/setting';

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 200 }));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin']);
  if (forbidden) return withCors(forbidden);
  try {
    const { key } = await params;
    const body = await req.json();
    const parsed = settingUpdateSchema.safeParse(body);
    if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    await connectToDatabase();
    const setting = await Setting.findOneAndUpdate(
      { key },
      { $set: { value: parsed.data.value } },
      { new: true }
    );
    if (!setting) return withCors(NextResponse.json({ error: 'Not found' }, { status: 404 }));
    return withCors(NextResponse.json({ setting }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


