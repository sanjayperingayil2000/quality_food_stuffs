import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { handleCorsPreflight, withCors } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { getRequestUser, requireAuth } from '@/middleware/auth';
import { updateUserPassword } from '@/services/user-service';

const passwordUpdateSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function PATCH(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);

  try {
    const userInfo = getRequestUser(authed);
    if (!userInfo) {
      return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    const body = await req.json();
    const parsed = passwordUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(
        NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      );
    }

    try {
      const updated = await updateUserPassword(userInfo.sub, parsed.data.newPassword);
      if (!updated) {
        return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }));
      }
    } catch (error) {
      if (error instanceof Error) {
        return withCors(NextResponse.json({ error: error.message }, { status: 400 }));
      }
      throw error;
    }

    return withCors(NextResponse.json({ success: true }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}

