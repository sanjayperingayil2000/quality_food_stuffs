import { NextResponse, NextRequest } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/errorHandler';
import { signupSchema, loginSchema, refreshSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema } from '@/utils/validators';
import { signup, login, refreshToken, logout } from '@/services/authService';
import { sendMail } from '@/lib/mailer';
import { signResetToken } from '@/lib/jwt';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = await req.json();

    if (action === 'signup') {
      const parsed = signupSchema.safeParse(body);
      if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
      const user = await signup(parsed.data);
      return withCors(NextResponse.json({ user }, { status: 201 }));
    }

    if (action === 'login') {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
      const result = await login(parsed.data);
      return withCors(NextResponse.json(result, { status: 200 }));
    }

    if (action === 'refresh') {
      const parsed = refreshSchema.safeParse(body);
      if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
      const result = await refreshToken(parsed.data);
      return withCors(NextResponse.json(result, { status: 200 }));
    }

    if (action === 'logout') {
      const parsed = logoutSchema.safeParse(body);
      if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
      await logout(parsed.data);
      return withCors(NextResponse.json({ success: true }, { status: 200 }));
    }

    if (action === 'forgot-password') {
      const parsed = forgotPasswordSchema.safeParse(body);
      if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
      const token = signResetToken({ email: parsed.data.email });
      const resetUrl = `${process.env.RESET_PASSWORD_URL || process.env.APP_URL || 'http://localhost:3000' }?token=${encodeURIComponent(token)}`;
      await sendMail({
        to: parsed.data.email,
        subject: 'Reset your password',
        html: `<p>Click the link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
      });
      return withCors(NextResponse.json({ success: true }, { status: 200 }));
    }

    if (action === 'reset-password') {
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
      // For simplicity, accept reset token and new password by asking user to login after reset.
      // In a full solution, you'd verify token email and update the password here.
      return withCors(NextResponse.json({ message: 'Use dedicated reset endpoint to change password' }, { status: 200 }));
    }

    return withCors(NextResponse.json({ error: 'Unknown action' }, { status: 400 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


