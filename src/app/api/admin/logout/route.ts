import { NextResponse } from 'next/server';
import { destroyAdminSession } from '@/backend/auth/session';

export async function POST() {
  await destroyAdminSession();
  return NextResponse.json({ success: true });
}
