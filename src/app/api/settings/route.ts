import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { getTheme, updateTheme } from '@/backend/features/settings/settings.service';

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - public: the active theme is not secret.
export async function GET() {
  try {
    const theme = await getTheme();
    return NextResponse.json({ success: true, data: { theme } });
  } catch (error) {
    return jsonError(error);
  }
}

// PUT - admin only: changing the theme is an administrative operation.
export async function PUT(request: NextRequest) {
  const denied = await requireAdminApi();
  if (denied) {
    return denied;
  }

  try {
    const body: unknown = await request.json();
    const theme = extractTheme(body);
    const updated = await updateTheme(theme);
    return NextResponse.json({ success: true, data: { theme: updated } });
  } catch (error) {
    return jsonError(error);
  }
}

function extractTheme(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  return (body as Record<string, unknown>).theme;
}
