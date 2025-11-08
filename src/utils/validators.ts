import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  roles: z.array(z.enum(['super_admin', 'manager'])).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const otpVerificationSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const userUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  roles: z.array(z.enum(['super_admin', 'manager'])).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  profilePhoto: z.string().nullable().optional(),
  password: z.string().optional(),
});

export const settingCreateSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});

export const settingUpdateSchema = z.object({
  value: z.any(),
});

export const calculationCreateSchema = z.object({
  contextName: z.string().min(1),
  inputs: z.record(z.any()),
  results: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const calculationUpdateSchema = z.object({
  inputs: z.record(z.any()).optional(),
  results: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});


