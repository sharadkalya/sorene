import { z } from 'zod';

/**
 * Placing an order only needs an address id plus slug/quantity pairs. Prices
 * are always resolved server-side from the catalog, never trusted from clients.
 */
export const orderCreateSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  items: z
    .array(
      z.object({
        slug: z.string().min(1, 'Product is required'),
        quantity: z.coerce
          .number()
          .int('Quantity must be a whole number')
          .min(1, 'Quantity must be at least 1')
          .max(99, 'Quantity cannot exceed 99'),
      }),
    )
    .min(1, 'Order must contain at least one item')
    .max(100, 'Too many items in order'),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export function formatIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}
