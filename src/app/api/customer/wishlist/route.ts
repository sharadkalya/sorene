import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import {
  addToWishlist,
  getWishlist,
} from '@/backend/features/wishlist/wishlist.service';

/**
 * GET /api/customer/wishlist — hydrated active wishlist products in order.
 * POST /api/customer/wishlist — add a product by `{ slug }`.
 */
export async function GET() {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const products = await getWishlist(session.customerId);
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const body = await parseJsonBody(request);
    const products = await addToWishlist(session.customerId, body);
    return NextResponse.json({ success: true, products }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

async function parseJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Request body must be valid JSON.');
  }
}
