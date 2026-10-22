import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./customer.repository', () => ({
  getCustomerById: vi.fn(),
  addCustomerAddress: vi.fn(),
}));

import { addCustomerAddress as repoAddAddress, getCustomerById } from './customer.repository';
import { addCustomerAddress, getCustomer, getCustomerOrNull } from './customer.service';

const getCustomerByIdMock = vi.mocked(getCustomerById);
const repoAddAddressMock = vi.mocked(repoAddAddress);

function customerRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    phone: '+919876543210',
    addresses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getCustomer / getCustomerOrNull', () => {
  it('returns the customer when found', async () => {
    getCustomerByIdMock.mockResolvedValue(customerRecord());
    await expect(getCustomer('c1')).resolves.toMatchObject({ id: 'c1' });
    await expect(getCustomerOrNull('c1')).resolves.toMatchObject({ id: 'c1' });
  });

  it('throws NOT_FOUND from getCustomer but returns null from getCustomerOrNull', async () => {
    getCustomerByIdMock.mockResolvedValue(null);
    await expect(getCustomer('missing')).rejects.toMatchObject({ name: 'AppError', code: 'NOT_FOUND' });
    await expect(getCustomerOrNull('missing')).resolves.toBeNull();
  });
});

describe('addCustomerAddress', () => {
  const addressInput = {
    fullName: 'Jane Doe',
    phone: '+919876543210',
    line1: '12 Palm Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
  };

  it('throws a validation error for invalid input', async () => {
    await expect(addCustomerAddress('c1', { ...addressInput, pincode: 'x' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'VALIDATION_ERROR',
    });
    expect(repoAddAddressMock).not.toHaveBeenCalled();
  });

  it('saves the address and returns it with the customer', async () => {
    const address = { id: 'a1', ...addressInput, line2: undefined };
    repoAddAddressMock.mockResolvedValue({ customer: customerRecord({ addresses: [address] }), address });

    const result = await addCustomerAddress('c1', addressInput);

    expect(repoAddAddressMock).toHaveBeenCalledWith('c1', expect.objectContaining({ line1: '12 Palm Road' }));
    expect(result.address.id).toBe('a1');
  });

  it('throws NOT_FOUND when the customer does not exist', async () => {
    repoAddAddressMock.mockResolvedValue(null);
    await expect(addCustomerAddress('missing', addressInput)).rejects.toMatchObject({
      name: 'AppError',
      code: 'NOT_FOUND',
    });
  });
});
