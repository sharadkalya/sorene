import { beforeEach, describe, expect, it, vi } from 'vitest';

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
}));

import { getActiveProductsBySlugs, decrementProductStock } from '../catalog/catalog.repository';
import { getCustomerById } from '../customer/customer.repository';
import {
  createOrder as repoCreateOrder,
  getOrderById,
  listAllOrders,
  listOrdersByCustomer,
} from './orders.repository';
import {
  getCustomerOrder,
  listAdminOrders,
  listCustomerOrders,
  placeOrder,
} from './orders.service';

const getActiveProductsBySlugsMock = vi.mocked(getActiveProductsBySlugs);
const decrementProductStockMock = vi.mocked(decrementProductStock);
const getCustomerByIdMock = vi.mocked(getCustomerById);
const repoCreateOrderMock = vi.mocked(repoCreateOrder);
const listOrdersByCustomerMock = vi.mocked(listOrdersByCustomer);
const getOrderByIdMock = vi.mocked(getOrderById);
const listAllOrdersMock = vi.mocked(listAllOrders);

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
  status: 'placed' as const,
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
  it('lists a customer’s orders and all admin orders', async () => {
    listOrdersByCustomerMock.mockResolvedValue([orderRecord]);
    listAllOrdersMock.mockResolvedValue([{ ...orderRecord, customerId: 'c1', customerPhone: '+919876543210' }]);

    await expect(listCustomerOrders('c1')).resolves.toEqual([orderRecord]);
    await expect(listAdminOrders()).resolves.toMatchObject([{ customerId: 'c1' }]);

    expect(listOrdersByCustomerMock).toHaveBeenCalledWith('c1');
    expect(listAllOrdersMock).toHaveBeenCalled();
  });
});
