import { NextResponse, NextRequest } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import { verifyAccessToken } from '@/lib/jwt';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  try {
    // Validate Authorization header and extract user from access token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) {
      return withCors(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }
    let tokenUser: { sub: string; roles: string[] } | null = null;
    try {
      tokenUser = verifyAccessToken(token) as { sub: string; roles: string[] };
    } catch {
      return withCors(NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }));
    }

    // Fetch user from database
    await connectToDatabase();
    const user = await User.findById(tokenUser.sub).select('-passwordHash');
    
    if (!user) {
      return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }));
    }

    return withCors(NextResponse.json({ user }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}
