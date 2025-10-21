import { NextResponse } from 'next/server';

export function jsonError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : 'Internal Server Error';
  return NextResponse.json({ error: message }, { status });
}


