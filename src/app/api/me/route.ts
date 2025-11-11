import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { requireAuth, getRequestUser } from '@/middleware/auth';
import { z } from 'zod';
import { updateUser, getUserById } from '@/services/user-service';

const profileUpdateSchema = z.object({
  phone: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  profilePhoto: z.string().nullable().optional(),
});

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  
  try {
    const userInfo = getRequestUser(authed);
    if (!userInfo) {
      return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }
    
    const user = await getUserById(userInfo.sub);
    if (!user) {
      return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }
    
    return withCors(NextResponse.json({ user }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
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
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
    }
    
    // Update the current user's profile
    const user = await updateUser(userInfo.sub, parsed.data);
    if (!user) {
      return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }
    
    return withCors(NextResponse.json({ user }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}