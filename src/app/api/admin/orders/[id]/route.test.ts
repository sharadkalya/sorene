import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/auth/requireAdmin', () => ({
  requireAdminApi: vi.fn(),
}));

vi.mock('@/backend/features/orders/orders.service', () => ({
  updateOrderStatus: vi.fn(),
}));

import { requireAdminApi } from '@/backend/auth/requireAdmin';
import { updateOrderStatus } from '@/backend/features/orders/orders.service';
import { PATCH } from './route';

const requireAdminMock = vi.mocked(requireAdminApi);
const updateOrderStatusMock = vi.mocked(updateOrderStatus);

const adminOrder = {
  id: 'o1',
  number: 'SR-20261023-1234',
  status: 'dispatched' as const,
  items: [],
  subtotal: 480,
  total: 480,
  createdAt: '2026-10-23T00:00:00.000Z',
  address: {
    fullName: 'Jane Doe',
    phone: '+919876543210',
    line1: '12 Palm Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
  customerId: 'c1',
  customerPhone: '+919876543210',
  customerName: 'Jane Doe',
};

function patchRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/orders/o1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const params = { params: Promise.resolve({ id: 'o1' }) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  requireAdminMock.mockResolvedValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PATCH /api/admin/orders/[id]', () => {
  it('updates the order status and returns the order', async () => {
    updateOrderStatusMock.mockResolvedValue(adminOrder);

    const response = await PATCH(patchRequest({ status: 'dispatched' }), params);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: true, order: { id: 'o1', status: 'dispatched' } });
    expect(updateOrderStatusMock).toHaveBeenCalledWith('o1', 'dispatched');
  });

  it('rejects a status that is not a valid order status', async () => {
    const response = await PATCH(patchRequest({ status: 'shipped' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(updateOrderStatusMock).not.toHaveBeenCalled();
  });

  it('rejects a missing or malformed body', async () => {
    const response = await PATCH(patchRequest({}), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(updateOrderStatusMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the order does not exist', async () => {
    updateOrderStatusMock.mockResolvedValue(null);

    const response = await PATCH(patchRequest({ status: 'cancelled' }), params);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('denies unauthenticated requests without touching the service', async () => {
    requireAdminMock.mockResolvedValue(
      NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 }),
    );

    const response = await PATCH(patchRequest({ status: 'cancelled' }), params);

    expect(response.status).toBe(401);
    expect(updateOrderStatusMock).not.toHaveBeenCalled();
  });
});
