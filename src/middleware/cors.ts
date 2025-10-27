import { NextResponse } from 'next/server';

export function withCors(response: NextResponse) {
  const origin = process.env.CORS_ORIGIN || '*';
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export function handleCorsPreflight(): NextResponse {
  const res = NextResponse.json({}, { status: 200 });
  return withCors(res);
}


