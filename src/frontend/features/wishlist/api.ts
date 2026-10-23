import type { WishlistProductSummary } from './types';

interface ApiEnvelope {
  success?: boolean;
  error?: { code?: string; message?: string };
}

async function readJson<T = Record<string, unknown>>(response: Response): Promise<T & ApiEnvelope> {
  try {
    return (await response.json()) as T & ApiEnvelope;
  } catch {
    return {} as T & ApiEnvelope;
  }
}

/** Add a slug to the server-side wishlist and return the hydrated list. */
export async function addWishlistItem(slug: string): Promise<WishlistProductSummary[]> {
  const response = await fetch('/api/customer/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  const data = await readJson<{ products: WishlistProductSummary[] }>(response);
  if (!response.ok || data.success === false || !Array.isArray(data.products)) {
    throw new Error(data.error?.message || 'We could not update your wishlist. Please try again.');
  }
  return data.products;
}

/** Remove a slug from the server-side wishlist and return the hydrated list. */
export async function removeWishlistItem(slug: string): Promise<WishlistProductSummary[]> {
  const response = await fetch(`/api/customer/wishlist/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
  const data = await readJson<{ products: WishlistProductSummary[] }>(response);
  if (!response.ok || data.success === false || !Array.isArray(data.products)) {
    throw new Error(data.error?.message || 'We could not update your wishlist. Please try again.');
  }
  return data.products;
}
