import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/backend/http';
import { lookupPincode } from '@/backend/features/pincode/pincode.service';

/**
 * GET /api/pincode?pincode=682028
 *
 * Public pincode lookup used by the checkout address form to auto-fill city
 * and state. Pincode data is not sensitive, so this endpoint is unauthenticated.
 */
export async function GET(request: NextRequest) {
  try {
    const data = lookupPincode(request.nextUrl.searchParams.get('pincode'));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return jsonError(error);
  }
}
