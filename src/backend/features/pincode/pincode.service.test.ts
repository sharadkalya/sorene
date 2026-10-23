import { beforeEach, describe, expect, it, vi } from 'vitest';

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }));

vi.mock('india-pincode-lookup', () => ({
  default: { lookup: lookupMock },
}));

import { AppError } from '@/backend/errors';
import { lookupPincode } from './pincode.service';

describe('lookupPincode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a mapped record for a known pincode', () => {
    lookupMock.mockReturnValue([
      {
        officeName: 'Vennala S.O',
        pincode: 682028,
        taluk: 'Ernakulam',
        districtName: 'Ernakulam',
        stateName: 'KERALA',
      },
    ]);

    expect(lookupPincode('682028')).toEqual({
      pincode: '682028',
      city: 'Ernakulam',
      district: 'Ernakulam',
      state: 'KERALA',
    });
  });

  it('uses the most common district when a pincode spans multiple districts', () => {
    lookupMock.mockReturnValue([
      { officeName: 'A', pincode: 400001, taluk: 'Mumbai', districtName: 'Mumbai', stateName: 'MAHARASHTRA' },
      { officeName: 'B', pincode: 400001, taluk: 'Mumbai', districtName: 'Mumbai', stateName: 'MAHARASHTRA' },
      { officeName: 'C', pincode: 400001, taluk: 'Uran', districtName: 'Raigarh(MH)', stateName: 'MAHARASHTRA' },
    ]);

    const result = lookupPincode('400001');
    expect(result.district).toBe('Mumbai');
    expect(result.city).toBe('Mumbai');
    expect(result.state).toBe('MAHARASHTRA');
  });

  it('throws VALIDATION_ERROR for a malformed pincode without calling the library', () => {
    expect(() => lookupPincode('123')).toThrowError(AppError);

    try {
      lookupPincode('012345');
    } catch (error) {
      expect((error as AppError).code).toBe('VALIDATION_ERROR');
    }

    expect(lookupMock).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND for an unknown pincode', () => {
    lookupMock.mockReturnValue([]);

    try {
      lookupPincode('999999');
      throw new Error('expected lookupPincode to throw');
    } catch (error) {
      expect((error as AppError).code).toBe('NOT_FOUND');
      expect((error as AppError).message).toBe('Invalid pincode.');
    }
  });

  it('wraps library errors as UPSTREAM_ERROR without leaking details', () => {
    lookupMock.mockImplementation(() => {
      throw new Error('dataset is corrupt');
    });

    try {
      lookupPincode('682028');
      throw new Error('expected lookupPincode to throw');
    } catch (error) {
      expect((error as AppError).code).toBe('UPSTREAM_ERROR');
      expect((error as AppError).message).not.toContain('corrupt');
    }
  });
});
