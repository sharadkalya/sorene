import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerApi } from '@/backend/auth/requireCustomer';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { updateCustomerAvatar } from '@/backend/features/customer/customer.service';

export const dynamic = 'force-dynamic';

function isFile(value: unknown): value is File {
  return typeof value === 'object' && value !== null && 'arrayBuffer' in value && 'name' in value;
}

/**
 * POST /api/customer/me/avatar
 * Upload a profile picture (multipart form-data field named `file`) to R2 and
 * persist its public URL on the authenticated customer.
 */
export async function POST(request: NextRequest) {
  const session = await requireCustomerApi();
  if (session instanceof NextResponse) {
    return session;
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!isFile(file)) {
      throw new AppError('VALIDATION_ERROR', 'Please provide an image file.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await updateCustomerAvatar(session.customerId, {
      buffer,
      contentType: file.type || 'application/octet-stream',
    });

    return NextResponse.json({ success: true, profilePicUrl: result.profilePicUrl });
  } catch (error) {
    return jsonError(error);
  }
}
