import { NextResponse, NextRequest } from 'next/server';
import { withCors, handleCorsPreflight } from '@/middleware/cors';
import { jsonError } from '@/middleware/error-handler';
import { loginSchema, refreshSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema, otpVerificationSchema } from '@/utils/validators';
import { login, refreshToken, logout } from '@/services/auth-service';
import { sendMail } from '@/lib/mailer';
import { signResetToken as _signResetToken } from '@/lib/jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/user';
import bcrypt from 'bcryptjs';

export async function OPTIONS() {
  return handleCorsPreflight();
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const body = await req.json();

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
      
      await connectToDatabase();
      const user = await User.findOne({ email: parsed.data.email, isActive: true });
      if (!user) {
        return withCors(NextResponse.json({ error: 'User not found' }, { status: 404 }));
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
      
      // Store OTP in user document (in production, use Redis or separate OTP collection)
      await User.findByIdAndUpdate(user._id, { 
        resetPasswordOtp: otp,
        resetPasswordOtpExpiry: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });

      // Send OTP via email
      await sendMail({
        to: parsed.data.email,
        subject: 'Password Reset OTP',
        html: `<p>Your password reset OTP is: <strong>${otp}</strong></p><p>This OTP will expire in 5 minutes.</p>`,
      });
      
      return withCors(NextResponse.json({ success: true }, { status: 200 }));
    }

    if (action === 'verify-otp') {
      const parsed = otpVerificationSchema.safeParse(body);
      if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
      
      await connectToDatabase();
      const user = await User.findOne({ 
        email: parsed.data.email, 
        resetPasswordOtp: parsed.data.otp,
        resetPasswordOtpExpiry: { $gt: new Date() },
        isActive: true 
      });
      
      if (!user) {
        return withCors(NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 }));
      }

      return withCors(NextResponse.json({ success: true }, { status: 200 }));
    }

    if (action === 'reset-password') {
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) return withCors(NextResponse.json({ error: parsed.error.flatten() }, { status: 400 }));
      
      await connectToDatabase();
      const user = await User.findOne({ 
        email: parsed.data.email, 
        resetPasswordOtpExpiry: { $gt: new Date() },
        isActive: true 
      });
      
      if (!user) {
        return withCors(NextResponse.json({ error: 'Invalid or expired session' }, { status: 400 }));
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      
      // Update password and clear OTP
      await User.findByIdAndUpdate(user._id, { 
        passwordHash,
        resetPasswordOtp: undefined,
        resetPasswordOtpExpiry: undefined
      });
      
      return withCors(NextResponse.json({ success: true }, { status: 200 }));
    }

    return withCors(NextResponse.json({ error: 'Unknown action' }, { status: 400 }));
  } catch (error) {
    return withCors(jsonError(error, 500));
  }
}


