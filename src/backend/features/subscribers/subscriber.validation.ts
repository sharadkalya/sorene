import { z } from 'zod';

export const subscriberInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name may only contain letters and spaces'),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
});

export type SubscriberInput = z.infer<typeof subscriberInputSchema>;

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
