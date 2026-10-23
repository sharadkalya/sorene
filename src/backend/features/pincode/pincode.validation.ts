import { z } from 'zod';

/** Indian pincode: exactly 6 digits, first digit 1-9. */
export const PINCODE_REGEX = /^[1-9]\d{5}$/;

export const pincodeInputSchema = z
  .string()
  .trim()
  .regex(PINCODE_REGEX, 'Please provide a valid 6-digit pincode.');

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
