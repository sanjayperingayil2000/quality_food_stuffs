import { NextRequest, NextResponse } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { requireAuth } from '@/middleware/auth';
import { requireRole } from '@/middleware/role';
import { listHistory } from '@/services/history-service';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function GET(req: NextRequest) {
  const authed = requireAuth(req);
  if (authed instanceof NextResponse) return withCors(authed);
  const forbidden = requireRole(authed, ['super_admin']);
  if (forbidden) return withCors(forbidden);
  try {
    const url = new URL(req.url);
    const collectionName = url.searchParams.get('collectionName') || undefined;
    const documentId = url.searchParams.get('documentId') || undefined;
    const action = url.searchParams.get('action') || undefined;
    const items = await listHistory({ collectionName, documentId, action });
    return withCors(NextResponse.json({ items }, { status: 200 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


