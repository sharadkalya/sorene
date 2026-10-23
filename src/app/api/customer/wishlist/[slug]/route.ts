import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { jsonError } from '@/backend/http';
import { removeFromWishlist } from '@/backend/features/wishlist/wishlist.service';

/**
 * DELETE /api/customer/wishlist/[slug] — remove a product from the wishlist
 * and return the updated hydrated list.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const { slug } = await params;
    const products = await removeFromWishlist(session.customerId, { slug });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return jsonError(error);
  }
}
