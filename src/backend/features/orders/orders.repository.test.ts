import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/integrations/database/connection', () => ({
  getMongoConnection: vi.fn(),
}));

vi.mock('@/backend/integrations/database/models/Order', () => ({
  default: { find: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

import { getMongoConnection } from '@/backend/integrations/database/connection';
import OrderModel from '@/backend/integrations/database/models/Order';
import { listOrdersByCustomer } from './orders.repository';

const getMongoConnectionMock = vi.mocked(getMongoConnection);
const findMock = vi.mocked(OrderModel.find);

function fakeDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'o1' },
    number: 'SR-20261023-1234',
    customerId: { toString: () => 'c1' },
    customerPhone: '+919876543210',
    address: {
      fullName: 'Jane Doe',
      phone: '+919876543210',
      line1: '12 Palm Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    items: [
      {
        slug: 'the-arch-bag',
        name: 'The Arch Bag',
        price: 240,
        image: '',
        quantity: 2,
        lineTotal: 480,
      },
    ],
    subtotal: 480,
    total: 480,
    status: 'pending',
    createdAt: new Date('2026-10-23T00:00:00.000Z'),
    updatedAt: new Date('2026-10-23T00:00:00.000Z'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('orders.repository', () => {
  it('normalizes legacy "placed" status to "pending"', async () => {
    const sortMock = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([fakeDoc({ status: 'placed' })]),
    });
    findMock.mockReturnValue({ sort: sortMock } as never);

    const result = await listOrdersByCustomer('c1');

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
    expect(result[0].status).toBe('pending');
  });

  it('normalizes legacy "completed" status to "delivered"', async () => {
    const sortMock = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([fakeDoc({ status: 'completed' })]),
    });
    findMock.mockReturnValue({ sort: sortMock } as never);

    const result = await listOrdersByCustomer('c1');

    expect(result[0].status).toBe('delivered');
  });

  it('keeps current statuses as-is', async () => {
    const sortMock = vi.fn().mockReturnValue({
      exec: vi.fn().mockResolvedValue([fakeDoc({ status: 'cancellation_requested' })]),
    });
    findMock.mockReturnValue({ sort: sortMock } as never);

    const result = await listOrdersByCustomer('c1');

    expect(result[0].status).toBe('cancellation_requested');
  });
});
