import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/integrations/database/connection', () => ({
  getMongoConnection: vi.fn(),
}));

vi.mock('@/backend/integrations/database/models/Customer', () => ({
  default: { findOneAndUpdate: vi.fn(), findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

import { getMongoConnection } from '@/backend/integrations/database/connection';
import CustomerModel from '@/backend/integrations/database/models/Customer';
import { addCustomerAddress, getCustomerById, upsertCustomerByPhone } from './customer.repository';

const getMongoConnectionMock = vi.mocked(getMongoConnection);
const findOneAndUpdateMock = vi.mocked(CustomerModel.findOneAndUpdate);
const findByIdMock = vi.mocked(CustomerModel.findById);
const findByIdAndUpdateMock = vi.mocked(CustomerModel.findByIdAndUpdate);

function fakeAddress(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'a1' },
    fullName: 'Jane Doe',
    phone: '+919876543210',
    line1: '12 Palm Road',
    line2: 'Apt 4',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    ...overrides,
  };
}

function fakeCustomerDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'c1' },
    phone: '+919876543210',
    addresses: [fakeAddress()],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('upsertCustomerByPhone', () => {
  it('connects to the database before querying', async () => {
    findOneAndUpdateMock.mockResolvedValue({ value: fakeCustomerDoc(), lastErrorObject: {} } as never);

    await upsertCustomerByPhone('+919876543210');

    expect(getMongoConnectionMock).toHaveBeenCalledTimes(1);
  });

  it('upserts keyed on phone and maps the record', async () => {
    findOneAndUpdateMock.mockResolvedValue({ value: fakeCustomerDoc(), lastErrorObject: {} } as never);

    const result = await upsertCustomerByPhone('+919876543210');

    expect(findOneAndUpdateMock).toHaveBeenCalledWith(
      { phone: '+919876543210' },
      { $setOnInsert: { phone: '+919876543210' } },
      expect.objectContaining({ upsert: true, includeResultMetadata: true }),
    );
    expect(result).toMatchObject({
      id: 'c1',
      phone: '+919876543210',
      addresses: [expect.objectContaining({ id: 'a1', city: 'Mumbai' })],
    });
  });
});

describe('getCustomerById', () => {
  it('returns null when no customer matches', async () => {
    findByIdMock.mockResolvedValue(null as never);
    await expect(getCustomerById('missing')).resolves.toBeNull();
  });

  it('returns the mapped customer when found', async () => {
    findByIdMock.mockResolvedValue(fakeCustomerDoc() as never);
    const result = await getCustomerById('c1');
    expect(result?.id).toBe('c1');
    expect(result?.addresses).toHaveLength(1);
  });
});

describe('addCustomerAddress', () => {
  it('appends the address and returns the newest one', async () => {
    findByIdAndUpdateMock.mockResolvedValue(
      fakeCustomerDoc({
        addresses: [fakeAddress(), fakeAddress({ _id: { toString: () => 'a2' }, line1: '99 New Road' })],
      }) as never,
    );

    const result = await addCustomerAddress('c1', {
      fullName: 'Jane Doe',
      phone: '+919876543210',
      line1: '99 New Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    });

    expect(result).not.toBeNull();
    expect(result?.address.id).toBe('a2');
    expect(result?.customer.addresses).toHaveLength(2);
    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'c1',
      { $push: { addresses: expect.objectContaining({ line1: '99 New Road' }) } },
      expect.objectContaining({ new: true }),
    );
  });

  it('returns null when the customer does not exist', async () => {
    findByIdAndUpdateMock.mockResolvedValue(null as never);
    await expect(
      addCustomerAddress('missing', {
        fullName: 'Jane Doe',
        phone: '+919876543210',
        line1: '12 Palm Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
      }),
    ).resolves.toBeNull();
  });
});
