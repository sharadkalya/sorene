import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { AppError } from '@/backend/errors';
import { ORDER_STATUSES } from '@/backend/features/orders/orders.types';
import { updateOrderStatus } from '@/backend/features/orders/orders.service';

export const dynamic = 'force-dynamic';

const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

/**
 * PATCH /api/admin/orders/[id] — admin-only status update. The UI offers the
 * appropriate next status; customers request cancellations separately and an
 * admin confirms them here.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdminApi();
  if (denied) {
    return denied;
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        new AppError('VALIDATION_ERROR', `Invalid status. Allowed values: ${ORDER_STATUSES.join(', ')}.`),
      );
    }

    const { id } = await params;
    const order = await updateOrderStatus(id, parsed.data.status);
    if (!order) {
      return jsonError(new AppError('NOT_FOUND', 'Order not found.'));
    }
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return jsonError(error);
  }
}
