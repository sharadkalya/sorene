import { z } from 'zod';
import { E164_PHONE_REGEX } from './customer.validation';

export const otpRequestSchema = z.object({
  phone: z.string().trim().regex(E164_PHONE_REGEX, 'Please provide a valid phone number.'),
});

export const otpVerifySchema = z.object({
  phone: z.string().trim().regex(E164_PHONE_REGEX, 'Please provide a valid phone number.'),
  code: z.string().trim().regex(/^\d{6}$/, 'Please enter the 6-digit verification code.'),
});

export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
