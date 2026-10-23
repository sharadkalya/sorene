import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/backend/integrations/database/connection', () => ({
  getMongoConnection: vi.fn(),
}));

vi.mock('@/backend/integrations/database/models/Customer', () => ({
  default: { findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));

vi.mock('@/backend/integrations/database/models/Product', () => ({
  default: { find: vi.fn(), countDocuments: vi.fn() },
}));

import { getMongoConnection } from '@/backend/integrations/database/connection';
import CustomerModel from '@/backend/integrations/database/models/Customer';
import ProductModel from '@/backend/integrations/database/models/Product';
import {
  addWishlistSlug,
  findActiveProductBySlug,
  getCustomerWishlist,
  hydrateWishlistProducts,
  removeWishlistSlug,
} from './wishlist.repository';

const getMongoConnectionMock = vi.mocked(getMongoConnection);
const findByIdMock = vi.mocked(CustomerModel.findById);
const findByIdAndUpdateMock = vi.mocked(CustomerModel.findByIdAndUpdate);
const findMock = vi.mocked(ProductModel.find);
const countDocumentsMock = vi.mocked(ProductModel.countDocuments);

beforeEach(() => {
  vi.clearAllMocks();
});

function productDoc(slug: string) {
  return {
    _id: { toString: () => slug },
    name: `Product ${slug}`,
    slug,
    price: 100,
    compareAtPrice: 150,
    images: ['https://cdn.example.com/img.jpg'],
    status: 'active',
    featured: false,
  };
}

describe('getCustomerWishlist', () => {
  it('returns the slug list for an existing customer', async () => {
    findByIdMock.mockReturnValue({
      select: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue({ wishlist: ['a', 'b'] }) }),
    } as never);

    await expect(getCustomerWishlist('c1')).resolves.toEqual(['a', 'b']);
    expect(getMongoConnectionMock).toHaveBeenCalled();
  });

  it('returns null when the customer is missing', async () => {
    findByIdMock.mockReturnValue({
      select: vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue(null) }),
    } as never);

    await expect(getCustomerWishlist('missing')).resolves.toBeNull();
  });
});

describe('addWishlistSlug', () => {
  it('uses $addToSet so adding is idempotent', async () => {
    findByIdAndUpdateMock.mockResolvedValue({ wishlist: ['a', 'b'] } as never);

    await expect(addWishlistSlug('c1', 'b')).resolves.toEqual(['a', 'b']);
    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'c1',
      { $addToSet: { wishlist: 'b' } },
      expect.objectContaining({ new: true }),
    );
  });

  it('returns null when the customer is missing', async () => {
    findByIdAndUpdateMock.mockResolvedValue(null as never);
    await expect(addWishlistSlug('missing', 'a')).resolves.toBeNull();
  });
});

describe('removeWishlistSlug', () => {
  it('uses $pull to remove the slug', async () => {
    findByIdAndUpdateMock.mockResolvedValue({ wishlist: ['a'] } as never);

    await expect(removeWishlistSlug('c1', 'b')).resolves.toEqual(['a']);
    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      'c1',
      { $pull: { wishlist: 'b' } },
      expect.objectContaining({ new: true }),
    );
  });

  it('returns null when the customer is missing', async () => {
    findByIdAndUpdateMock.mockResolvedValue(null as never);
    await expect(removeWishlistSlug('missing', 'a')).resolves.toBeNull();
  });
});

describe('findActiveProductBySlug', () => {
  it('returns true only for active products', async () => {
    countDocumentsMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(1) } as never);
    await expect(findActiveProductBySlug('a')).resolves.toBe(true);

    countDocumentsMock.mockReturnValue({ exec: vi.fn().mockResolvedValue(0) } as never);
    await expect(findActiveProductBySlug('draft-only')).resolves.toBe(false);
  });
});

describe('hydrateWishlistProducts', () => {
  it('preserves wishlist order and drops missing/inactive products', async () => {
    findMock.mockReturnValue({
      exec: vi.fn().mockResolvedValue([productDoc('c'), productDoc('a')]),
    } as never);

    const result = await hydrateWishlistProducts(['a', 'missing', 'c']);

    expect(result.map((p) => p.slug)).toEqual(['a', 'c']);
    expect(result[0].compareAtPrice).toBe(150);
    expect(result[0].image).toBe('https://cdn.example.com/img.jpg');
  });

  it('returns an empty list without querying for empty slugs', async () => {
    await expect(hydrateWishlistProducts([])).resolves.toEqual([]);
    expect(findMock).not.toHaveBeenCalled();
  });
});
