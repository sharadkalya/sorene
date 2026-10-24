import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../catalog/catalog.repository', () => ({
  getActiveProductsBySlugs: vi.fn(),
  decrementProductStock: vi.fn(),
}));

vi.mock('../customer/customer.repository', () => ({
  getCustomerById: vi.fn(),
}));

vi.mock('./orders.repository', () => ({
  createOrder: vi.fn(),
  listOrdersByCustomer: vi.fn(),
  getOrderById: vi.fn(),
  listAllOrders: vi.fn(),
  updateOrderStatus: vi.fn(),
  setOrderReturn: vi.fn(),
}));

import { getActiveProductsBySlugs, decrementProductStock } from '../catalog/catalog.repository';
import { getCustomerById } from '../customer/customer.repository';
import {
  createOrder as repoCreateOrder,
  getOrderById,
  listAllOrders,
  listOrdersByCustomer,
  setOrderReturn,
  updateOrderStatus,
} from './orders.repository';
import {
  decideReturn,
  getCustomerOrder,
  listAdminOrders,
  listCustomerOrders,
  placeOrder,
  requestOrderCancellation,
  requestReturn,
  updateReturnStatus,
} from './orders.service';

const getActiveProductsBySlugsMock = vi.mocked(getActiveProductsBySlugs);
const decrementProductStockMock = vi.mocked(decrementProductStock);
const getCustomerByIdMock = vi.mocked(getCustomerById);
const repoCreateOrderMock = vi.mocked(repoCreateOrder);
const listOrdersByCustomerMock = vi.mocked(listOrdersByCustomer);
const getOrderByIdMock = vi.mocked(getOrderById);
const listAllOrdersMock = vi.mocked(listAllOrders);
const updateOrderStatusMock = vi.mocked(updateOrderStatus);
const setOrderReturnMock = vi.mocked(setOrderReturn);

const address = {
  id: 'a1',
  fullName: 'Jane Doe',
  phone: '+919876543210',
  line1: '12 Palm Road',
  line2: 'Apt 4',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
};

function customerRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    phone: '+919876543210',
    name: 'Jane Doe',
    profilePicUrl: '',
    addresses: [address],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

const product = {
  id: 'p1',
  slug: 'the-arch-bag',
  name: 'The Arch Bag',
  price: 240,
  image: 'https://example.com/1.jpg',
  stockQuantity: 10,
};

const orderRecord = {
  id: 'o1',
  number: 'SR-20261023-1234',
  status: 'pending' as const,
  items: [
    {
      slug: 'the-arch-bag',
      name: 'The Arch Bag',
      price: 240,
      image: 'https://example.com/1.jpg',
      quantity: 2,
      lineTotal: 480,
    },
  ],
  subtotal: 480,
  total: 480,
  createdAt: '2026-10-23T00:00:00.000Z',
  address: {
    fullName: 'Jane Doe',
    phone: '+919876543210',
    line1: '12 Palm Road',
    line2: 'Apt 4',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RETURN_WINDOW_DAYS = '14';
});

afterEach(() => {
  delete process.env.RETURN_WINDOW_DAYS;
});

describe('placeOrder', () => {
  const input = { addressId: 'a1', items: [{ slug: 'the-arch-bag', quantity: 2 }] };

  it('places an order using server-side prices and decrements stock', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord());
    getActiveProductsBySlugsMock.mockResolvedValue([product]);
    decrementProductStockMock.mockResolvedValue(true);
    repoCreateOrderMock.mockResolvedValue(orderRecord);

    const result = await placeOrder('c1', input);

    expect(result.number).toBe('SR-20261023-1234');
    expect(decrementProductStockMock).toHaveBeenCalledWith('the-arch-bag', 2);
    expect(repoCreateOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'c1',
        customerPhone: '+919876543210',
        subtotal: 480,
        total: 480,
        items: [
          expect.objectContaining({
            slug: 'the-arch-bag',
            name: 'The Arch Bag',
            price: 240,
            quantity: 2,
            lineTotal: 480,
          }),
        ],
      }),
    );
  });

  it('rejects an empty items array before touching the database', async () => {
    await expect(placeOrder('c1', { addressId: 'a1', items: [] })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(getCustomerByIdMock).not.toHaveBeenCalled();
  });

  it('rejects a non-integer quantity', async () => {
    await expect(
      placeOrder('c1', { addressId: 'a1', items: [{ slug: 's', quantity: 1.5 }] }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('rejects an unknown slug', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord());
    getActiveProductsBySlugsMock.mockResolvedValue([]);

    await expect(
      placeOrder('c1', { addressId: 'a1', items: [{ slug: 'missing', quantity: 1 }] }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', message: 'Unknown product: missing' });
    expect(repoCreateOrderMock).not.toHaveBeenCalled();
  });

  it('treats an inactive product as unknown', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord());
    // Inactive products are excluded by getActiveProductsBySlugs.
    getActiveProductsBySlugsMock.mockResolvedValue([]);

    await expect(
      placeOrder('c1', { addressId: 'a1', items: [{ slug: 'draft-bag', quantity: 1 }] }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('rejects insufficient stock before creating the order', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord());
    getActiveProductsBySlugsMock.mockResolvedValue([{ ...product, stockQuantity: 1 }]);

    await expect(placeOrder('c1', input)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Insufficient stock for The Arch Bag.',
    });
    expect(decrementProductStockMock).not.toHaveBeenCalled();
    expect(repoCreateOrderMock).not.toHaveBeenCalled();
  });

  it('does not enforce stock for untracked (0) products', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord());
    getActiveProductsBySlugsMock.mockResolvedValue([{ ...product, stockQuantity: 0 }]);
    repoCreateOrderMock.mockResolvedValue(orderRecord);

    await placeOrder('c1', input);

    expect(decrementProductStockMock).not.toHaveBeenCalled();
    expect(repoCreateOrderMock).toHaveBeenCalled();
  });

  it('aborts when a conditional stock decrement fails (race)', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord());
    getActiveProductsBySlugsMock.mockResolvedValue([product]);
    decrementProductStockMock.mockResolvedValue(false);

    await expect(placeOrder('c1', input)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Insufficient stock for The Arch Bag.',
    });
    expect(repoCreateOrderMock).not.toHaveBeenCalled();
  });

  it('rejects an address that does not belong to the customer', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord({ addresses: [{ ...address, id: 'a2' }] }));

    await expect(placeOrder('c1', input)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Address not found.',
    });
    expect(repoCreateOrderMock).not.toHaveBeenCalled();
  });

  it('rejects when the customer does not exist', async () => {
    getCustomerByIdMock.mockResolvedValue(null);

    await expect(placeOrder('c1', input)).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('aggregates duplicate slugs so they cannot bypass stock limits', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord());
    getActiveProductsBySlugsMock.mockResolvedValue([{ ...product, stockQuantity: 3 }]);

    await expect(
      placeOrder('c1', {
        addressId: 'a1',
        items: [
          { slug: 'the-arch-bag', quantity: 2 },
          { slug: 'the-arch-bag', quantity: 2 },
        ],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(repoCreateOrderMock).not.toHaveBeenCalled();
  });
});

describe('customer order access', () => {
  it('returns the public order shape for the owner', async () => {
    getOrderByIdMock.mockResolvedValue({ ...orderRecord, customerId: 'c1', customerPhone: '+919876543210' });

    const result = await getCustomerOrder('c1', 'o1');

    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty('customerId');
    expect(result).not.toHaveProperty('customerPhone');
    expect(result?.number).toBe('SR-20261023-1234');
  });

  it('returns null for a missing order', async () => {
    getOrderByIdMock.mockResolvedValue(null);
    await expect(getCustomerOrder('c1', 'missing')).resolves.toBeNull();
  });

  it('returns null when the order belongs to another customer', async () => {
    getOrderByIdMock.mockResolvedValue({ ...orderRecord, customerId: 'c2', customerPhone: '+911111111111' });
    await expect(getCustomerOrder('c1', 'o1')).resolves.toBeNull();
  });
});

describe('order listing', () => {
  it('lists a customer’s orders and paginated admin orders', async () => {
    listOrdersByCustomerMock.mockResolvedValue([orderRecord]);
    listAllOrdersMock.mockResolvedValue({
      orders: [{ ...orderRecord, customerId: 'c1', customerPhone: '+919876543210' }],
      total: 1,
      page: 1,
      totalPages: 1,
    });

    await expect(listCustomerOrders('c1')).resolves.toEqual([orderRecord]);
    const admin = await listAdminOrders({ page: 1, limit: 20 });
    expect(admin).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(admin.orders).toEqual([expect.objectContaining({ customerId: 'c1' })]);

    expect(listOrdersByCustomerMock).toHaveBeenCalledWith('c1');
    expect(listAllOrdersMock).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});

describe('requestOrderCancellation', () => {
  const adminOrder = { ...orderRecord, customerId: 'c1', customerPhone: '+919876543210' };

  it.each(['pending', 'processing'] as const)('marks a %s order as cancellation_requested', async (status) => {
    getOrderByIdMock.mockResolvedValue({ ...adminOrder, status });
    updateOrderStatusMock.mockResolvedValue({ ...adminOrder, status: 'cancellation_requested' });

    const result = await requestOrderCancellation('c1', 'o1');

    expect(result.status).toBe('cancellation_requested');
    expect(result).not.toHaveProperty('customerId');
    expect(updateOrderStatusMock).toHaveBeenCalledWith('o1', 'cancellation_requested');
  });

  it('returns NOT_FOUND for a missing order', async () => {
    getOrderByIdMock.mockResolvedValue(null);
    await expect(requestOrderCancellation('c1', 'missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('returns NOT_FOUND when the order belongs to another customer', async () => {
    getOrderByIdMock.mockResolvedValue({ ...adminOrder, customerId: 'c2' });
    await expect(requestOrderCancellation('c1', 'o1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it.each([
    'dispatched',
    'out_for_delivery',
    'delivered',
    'cancellation_requested',
    'cancelled',
    'refunded',
  ] as const)('rejects cancellation for a %s order', async (status) => {
    getOrderByIdMock.mockResolvedValue({ ...adminOrder, status });
    await expect(requestOrderCancellation('c1', 'o1')).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(updateOrderStatusMock).not.toHaveBeenCalled();
  });
});

describe('requestReturn', () => {
  const recentDeliveredAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const oldDeliveredAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const deliveredOrder = {
    ...orderRecord,
    status: 'delivered' as const,
    customerId: 'c1',
    customerPhone: '+919876543210',
    deliveredAt: recentDeliveredAt,
  };

  it('requests a return for a delivered order within the window', async () => {
    getOrderByIdMock.mockResolvedValue(deliveredOrder);
    setOrderReturnMock.mockResolvedValue({
      ...deliveredOrder,
      return: { status: 'return_requested', requestedAt: recentDeliveredAt },
    });

    const result = await requestReturn('c1', 'o1');

    expect(result.return?.status).toBe('return_requested');
    expect(setOrderReturnMock).toHaveBeenCalledWith('o1', {
      status: 'return_requested',
      requestedAt: expect.any(Date),
    });
  });

  it('returns NOT_FOUND for a missing or foreign order', async () => {
    getOrderByIdMock.mockResolvedValue(null);
    await expect(requestReturn('c1', 'missing')).rejects.toMatchObject({ code: 'NOT_FOUND' });

    getOrderByIdMock.mockResolvedValue({ ...deliveredOrder, customerId: 'c2' });
    await expect(requestReturn('c1', 'o1')).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rejects returns for orders that are not delivered', async () => {
    getOrderByIdMock.mockResolvedValue({ ...orderRecord, customerId: 'c1', customerPhone: '+919876543210' });

    await expect(requestReturn('c1', 'o1')).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(setOrderReturnMock).not.toHaveBeenCalled();
  });

  it('rejects a second return request', async () => {
    getOrderByIdMock.mockResolvedValue({
      ...deliveredOrder,
      return: { status: 'return_requested', requestedAt: recentDeliveredAt },
    });

    await expect(requestReturn('c1', 'o1')).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(setOrderReturnMock).not.toHaveBeenCalled();
  });

  it('rejects a return after the window has expired', async () => {
    getOrderByIdMock.mockResolvedValue({ ...deliveredOrder, deliveredAt: oldDeliveredAt });

    await expect(requestReturn('c1', 'o1')).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(setOrderReturnMock).not.toHaveBeenCalled();
  });
});

describe('decideReturn', () => {
  const pendingReturn = {
    ...orderRecord,
    status: 'delivered' as const,
    customerId: 'c1',
    customerPhone: '+919876543210',
    return: { status: 'return_requested' as const, requestedAt: '2026-10-24T00:00:00.000Z' },
  };

  it('approves a pending return with an optional note', async () => {
    getOrderByIdMock.mockResolvedValue(pendingReturn);
    setOrderReturnMock.mockResolvedValue({
      ...pendingReturn,
      return: {
        status: 'return_approved',
        requestedAt: '2026-10-24T00:00:00.000Z',
        adminNote: 'Approved',
        decidedAt: '2026-10-24T00:00:00.000Z',
      },
    });

    const result = await decideReturn('o1', { status: 'return_approved', note: 'Approved' });

    expect(result.return?.status).toBe('return_approved');
    expect(setOrderReturnMock).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ status: 'return_approved', adminNote: 'Approved' }),
    );
  });

  it('rejects when there is no pending return', async () => {
    getOrderByIdMock.mockResolvedValue({ ...orderRecord, customerId: 'c1', customerPhone: '+919876543210' });

    await expect(decideReturn('o1', { status: 'return_approved' })).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    expect(setOrderReturnMock).not.toHaveBeenCalled();
  });
});

describe('updateReturnStatus', () => {
  it('advances an active return', async () => {
    const order = {
      ...orderRecord,
      status: 'delivered' as const,
      customerId: 'c1',
      customerPhone: '+919876543210',
      return: { status: 'return_approved' as const, requestedAt: '2026-10-24T00:00:00.000Z' },
    };
    getOrderByIdMock.mockResolvedValue(order);
    setOrderReturnMock.mockResolvedValue({
      ...order,
      return: { ...order.return, status: 'pickup_scheduled' },
    });

    const result = await updateReturnStatus('o1', 'pickup_scheduled');

    expect(result.return?.status).toBe('pickup_scheduled');
  });

  it('rejects when there is no active return', async () => {
    getOrderByIdMock.mockResolvedValue({ ...orderRecord, customerId: 'c1', customerPhone: '+919876543210' });

    await expect(updateReturnStatus('o1', 'pickup_scheduled')).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });
});
