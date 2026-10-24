import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { jsonError } from '@/backend/http';
import { AppError } from '@/backend/errors';
import { RETURN_STATUSES } from '@/backend/features/orders/orders.types';
import { decideReturn, updateReturnStatus } from '@/backend/features/orders/orders.service';

export const dynamic = 'force-dynamic';

const returnUpdateSchema = z.object({
  status: z.enum(RETURN_STATUSES),
  note: z.string().trim().max(500).optional(),
});

/**
 * PATCH /api/admin/orders/[id]/return — admin return handling. `return_approved`
 * / `return_rejected` record the decision (with an optional customer-visible
 * note); the other statuses progress the return (pickup → returned → refunded).
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
    const parsed = returnUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        new AppError('VALIDATION_ERROR', `Invalid status. Allowed values: ${RETURN_STATUSES.join(', ')}.`),
      );
    }

    const { id } = await params;
    const { status, note } = parsed.data;

    const order =
      status === 'return_approved' || status === 'return_rejected'
        ? await decideReturn(id, { status, note })
        : await updateReturnStatus(id, status);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    return jsonError(error);
  }
}
