/** Format a number as INR currency for storefront display. */
export function formatPrice(value: number): string {
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
}
