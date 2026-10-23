import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./wishlist.repository', () => ({
  getCustomerWishlist: vi.fn(),
  hydrateWishlistProducts: vi.fn(),
  addWishlistSlug: vi.fn(),
  removeWishlistSlug: vi.fn(),
  findActiveProductBySlug: vi.fn(),
}));

import {
  addWishlistSlug,
  findActiveProductBySlug,
  getCustomerWishlist,
  hydrateWishlistProducts,
  removeWishlistSlug,
} from './wishlist.repository';
import { addToWishlist, getWishlist, getWishlistCount, removeFromWishlist } from './wishlist.service';

const getCustomerWishlistMock = vi.mocked(getCustomerWishlist);
const hydrateMock = vi.mocked(hydrateWishlistProducts);
const addWishlistSlugMock = vi.mocked(addWishlistSlug);
const removeWishlistSlugMock = vi.mocked(removeWishlistSlug);
const findActiveProductBySlugMock = vi.mocked(findActiveProductBySlug);

function product(slug: string) {
  return { slug, name: `Product ${slug}`, price: 100, compareAtPrice: null, image: '', status: 'active' };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getWishlist', () => {
  it('hydrates the saved slugs', async () => {
    getCustomerWishlistMock.mockResolvedValue(['a', 'b']);
    hydrateMock.mockResolvedValue([product('a'), product('b')]);

    await expect(getWishlist('c1')).resolves.toHaveLength(2);
    expect(hydrateMock).toHaveBeenCalledWith(['a', 'b']);
  });

  it('throws NOT_FOUND when the customer is missing', async () => {
    getCustomerWishlistMock.mockResolvedValue(null);
    await expect(getWishlist('missing')).rejects.toMatchObject({ name: 'AppError', code: 'NOT_FOUND' });
  });
});

describe('getWishlistCount', () => {
  it('returns the number of hydrated products', async () => {
    getCustomerWishlistMock.mockResolvedValue(['a', 'b', 'c']);
    hydrateMock.mockResolvedValue([product('a'), product('b'), product('c')]);

    await expect(getWishlistCount('c1')).resolves.toBe(3);
  });
});

describe('addToWishlist', () => {
  it('rejects an invalid slug format', async () => {
    await expect(addToWishlist('c1', { slug: '' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'VALIDATION_ERROR',
    });
    expect(findActiveProductBySlugMock).not.toHaveBeenCalled();
  });

  it('rejects an unknown slug with NOT_FOUND', async () => {
    findActiveProductBySlugMock.mockResolvedValue(false);
    await expect(addToWishlist('c1', { slug: 'nope' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'NOT_FOUND',
    });
    expect(addWishlistSlugMock).not.toHaveBeenCalled();
  });

  it('adds the slug and returns the hydrated list', async () => {
    findActiveProductBySlugMock.mockResolvedValue(true);
    addWishlistSlugMock.mockResolvedValue(['a']);
    hydrateMock.mockResolvedValue([product('a')]);

    const result = await addToWishlist('c1', { slug: 'a' });

    expect(addWishlistSlugMock).toHaveBeenCalledWith('c1', 'a');
    expect(result).toHaveLength(1);
  });

  it('throws NOT_FOUND when the customer is missing', async () => {
    findActiveProductBySlugMock.mockResolvedValue(true);
    addWishlistSlugMock.mockResolvedValue(null);
    await expect(addToWishlist('missing', { slug: 'a' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'NOT_FOUND',
    });
  });
});

describe('removeFromWishlist', () => {
  it('removes the slug and returns the hydrated list', async () => {
    removeWishlistSlugMock.mockResolvedValue([]);
    hydrateMock.mockResolvedValue([]);

    await removeFromWishlist('c1', { slug: 'a' });

    expect(removeWishlistSlugMock).toHaveBeenCalledWith('c1', 'a');
  });

  it('throws NOT_FOUND when the customer is missing', async () => {
    removeWishlistSlugMock.mockResolvedValue(null);
    await expect(removeFromWishlist('missing', { slug: 'a' })).rejects.toMatchObject({
      name: 'AppError',
      code: 'NOT_FOUND',
    });
  });
});
