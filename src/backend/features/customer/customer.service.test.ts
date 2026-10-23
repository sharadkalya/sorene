import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./customer.repository', () => ({
  getCustomerById: vi.fn(),
  addCustomerAddress: vi.fn(),
  updateCustomerProfile: vi.fn(),
  setCustomerProfilePicUrl: vi.fn(),
}));

vi.mock('@/backend/integrations/storage/r2-storage', () => ({
  uploadImage: vi.fn(),
}));

import {
  addCustomerAddress as repoAddAddress,
  getCustomerById,
  setCustomerProfilePicUrl,
  updateCustomerProfile as repoUpdateProfile,
} from './customer.repository';
import { uploadImage } from '@/backend/integrations/storage/r2-storage';
import { AppError } from '@/backend/errors';
import {
  addCustomerAddress,
  getCustomer,
  getCustomerOrNull,
  updateCustomerAvatar,
  updateCustomerProfile,
} from './customer.service';

const getCustomerByIdMock = vi.mocked(getCustomerById);
const repoAddAddressMock = vi.mocked(repoAddAddress);
const repoUpdateProfileMock = vi.mocked(repoUpdateProfile);
const repoSetProfilePicUrlMock = vi.mocked(setCustomerProfilePicUrl);
const uploadImageMock = vi.mocked(uploadImage);

function customerRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    phone: '+919876543210',
    email: undefined,
    profilePicUrl: '',
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

describe('updateCustomerProfile', () => {
  it('validates the patch before touching the repository', async () => {
    await expect(updateCustomerProfile('c1', { name: 'J' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'VALIDATION_ERROR',
    });
    expect(repoUpdateProfileMock).not.toHaveBeenCalled();
  });

  it('passes through a valid name and lowercased email', async () => {
    repoUpdateProfileMock.mockResolvedValue(customerRecord({ name: 'Jane Doe', email: 'jane@example.com' }));

    const result = await updateCustomerProfile('c1', { name: 'Jane Doe', email: 'Jane@Example.com' });

    expect(repoUpdateProfileMock).toHaveBeenCalledWith('c1', { name: 'Jane Doe', email: 'jane@example.com' });
    expect(result.email).toBe('jane@example.com');
  });

  it('clears the email when an empty string is provided', async () => {
    repoUpdateProfileMock.mockResolvedValue(customerRecord({ email: undefined, profilePicUrl: '' }));

    await updateCustomerProfile('c1', { email: '' });

    expect(repoUpdateProfileMock).toHaveBeenCalledWith('c1', { email: '' });
  });

  it('leaves the email untouched when the key is omitted', async () => {
    repoUpdateProfileMock.mockResolvedValue(customerRecord({ name: 'Jane' }));

    await updateCustomerProfile('c1', { name: 'Jane' });

    expect(repoUpdateProfileMock).toHaveBeenCalledWith('c1', { name: 'Jane' });
  });

  it('throws NOT_FOUND when the customer does not exist', async () => {
    repoUpdateProfileMock.mockResolvedValue(null);
    await expect(updateCustomerProfile('missing', { name: 'Jane' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'NOT_FOUND',
    });
  });
});

describe('updateCustomerAvatar', () => {
  const file = { buffer: Buffer.from('fake'), contentType: 'image/png' };

  it('uploads to the avatars folder and persists the returned URL', async () => {
    uploadImageMock.mockResolvedValue({ key: 'avatars/abc.png', url: 'https://cdn.example.com/avatars/abc.png' });
    repoSetProfilePicUrlMock.mockResolvedValue(
      customerRecord({ profilePicUrl: 'https://cdn.example.com/avatars/abc.png' }),
    );

    const result = await updateCustomerAvatar('c1', file);

    expect(uploadImageMock).toHaveBeenCalledWith({
      buffer: file.buffer,
      contentType: 'image/png',
      folder: 'avatars',
    });
    expect(repoSetProfilePicUrlMock).toHaveBeenCalledWith('c1', 'https://cdn.example.com/avatars/abc.png');
    expect(result.profilePicUrl).toBe('https://cdn.example.com/avatars/abc.png');
  });

  it('propagates upload validation errors without persisting', async () => {
    uploadImageMock.mockRejectedValue(new AppError('VALIDATION_ERROR', 'Bad image'));
    await expect(updateCustomerAvatar('c1', file)).rejects.toMatchObject({
      name: 'AppError',
      code: 'VALIDATION_ERROR',
    });
    expect(repoSetProfilePicUrlMock).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when the customer does not exist', async () => {
    uploadImageMock.mockResolvedValue({ key: 'avatars/abc.png', url: 'https://cdn.example.com/avatars/abc.png' });
    repoSetProfilePicUrlMock.mockResolvedValue(null);
    await expect(updateCustomerAvatar('missing', file)).rejects.toMatchObject({
      name: 'AppError',
      code: 'NOT_FOUND',
    });
  });
});
