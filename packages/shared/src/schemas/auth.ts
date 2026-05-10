import { z } from 'zod';
import { UserRole, ProctorType } from '../domain-enums/index.js';

// Israeli national ID: 9 digits. We accept any 9-digit string here and let the
// domain layer validate the check digit (Luhn-like algorithm).
export const NationalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{9}$/u, { message: 'national_id_must_be_9_digits' });

export const PasswordSchema = z.string().min(1).max(256);

export const LoginRequestSchema = z.object({
  nationalId: NationalIdSchema,
  password: PasswordSchema,
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: PasswordSchema,
    newPassword: z.string().min(6).max(256),
  })
  .strict();
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export const AuthenticatedUserSchema = z.object({
  id: z.string().uuid(),
  nationalId: NationalIdSchema,
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().nullable(),
  role: z.enum([UserRole.Admin, UserRole.ExamStaff, UserRole.Proctor]),
  proctorType: z.enum([ProctorType.Opener, ProctorType.Regular]).nullable(),
  mustChangePassword: z.boolean(),
});
export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: AuthenticatedUserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
