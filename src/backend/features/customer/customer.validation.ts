import { z } from 'zod';

/** Phone numbers are E.164 (e.g. +919876543210). */
export const E164_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export const addressInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9\s-]{6,14}$/, 'Please provide a valid phone number'),
  line1: z
    .string()
    .trim()
    .min(3, 'Address must be at least 3 characters')
    .max(200, 'Address cannot exceed 200 characters'),
  line2: z.string().trim().max(200, 'Address line 2 cannot exceed 200 characters').optional(),
  city: z
    .string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City cannot exceed 100 characters'),
  state: z
    .string()
    .trim()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State cannot exceed 100 characters'),
  pincode: z.string().trim().regex(/^\d{3,10}$/, 'Please provide a valid postal code'),
});

export type AddressInput = z.infer<typeof addressInputSchema>;

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
