import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { AppError } from '@/backend/errors';
import { jsonError } from '@/backend/http';
import { uploadImage } from '@/backend/integrations/storage/r2-storage';

export const dynamic = 'force-dynamic';

function isFile(value: unknown): value is File {
  return typeof value === 'object' && value !== null && 'arrayBuffer' in value && 'name' in value;
}

/**
 * POST /api/admin/media
 * Admin-only multi-image upload to R2. Accepts multipart form data with a
 * `files` (or single `file`) field and returns the public URL for each image.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  try {
    const formData = await request.formData();
    const files = formData.getAll('files').filter(isFile);

    if (files.length === 0) {
      const single = formData.get('file');
      if (isFile(single)) files.push(single);
    }

    if (files.length === 0) {
      throw new AppError('VALIDATION_ERROR', 'No files were provided.');
    }
    if (files.length > 12) {
      throw new AppError('VALIDATION_ERROR', 'You can upload at most 12 images at once.');
    }

    const uploaded = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadImage({
        buffer,
        contentType: file.type || 'application/octet-stream',
        folder: 'catalog',
      });
      uploaded.push({ key: result.key, url: result.url, name: file.name, size: file.size });
    }

    return NextResponse.json({ success: true, files: uploaded }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
