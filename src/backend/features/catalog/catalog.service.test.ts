import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCategory, createProduct, getAdminProducts, updateProduct } from './catalog.service';
import * as repo from './catalog.repository';

vi.mock('./catalog.repository', () => ({
  categorySlugExists: vi.fn(),
  collectionSlugExists: vi.fn(),
  productSlugExists: vi.fn(),
  createCategory: vi.fn(),
  createCollection: vi.fn(),
  createProduct: vi.fn(),
  getCategoryById: vi.fn(),
  getCollectionById: vi.fn(),
  getProductById: vi.fn(),
  updateCategory: vi.fn(),
  updateCollection: vi.fn(),
  updateProduct: vi.fn(),
  deleteCategory: vi.fn(),
  deleteCollection: vi.fn(),
  deleteProduct: vi.fn(),
  removeCategoryFromProducts: vi.fn(),
  removeCollectionFromProducts: vi.fn(),
  listCategories: vi.fn(),
  listCollections: vi.fn(),
  listProducts: vi.fn(),
  listAdminProducts: vi.fn(),
  getActiveProductsBySlugs: vi.fn(),
  decrementProductStock: vi.fn(),
  getProductBySlug: vi.fn(),
  findCategoriesBySlugs: vi.fn(),
  findCollectionsBySlugs: vi.fn(),
  findExistingCategoryIds: vi.fn(),
  findExistingCollectionIds: vi.fn(),
  countActiveProductsByCategory: vi.fn(),
  countActiveProductsByCollection: vi.fn(),
}));

const categoryRecord = {
  id: 'c1',
  name: 'Tote Bags',
  slug: 'tote-bags',
  description: '',
  imageUrl: '',
  isActive: true,
  createdAt: '',
  updatedAt: '',
};

const productRecord = {
  id: 'p1',
  name: 'The Arch Bag',
  slug: 'the-arch-bag',
  description: 'A structured handbag.',
  price: 240,
  compareAtPrice: null,
  images: [],
  categories: [],
  collections: [],
  status: 'draft' as const,
  featured: false,
  materialInfo: '',
  manufacturingInfo: '',
  stockQuantity: 0,
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createCategory', () => {
  it('generates a slug from the name and persists the category', async () => {
    vi.mocked(repo.categorySlugExists).mockResolvedValue(false);
    vi.mocked(repo.createCategory).mockResolvedValue(categoryRecord);

    await createCategory({ name: 'Tote Bags', isActive: true });

    expect(repo.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Tote Bags', slug: 'tote-bags', isActive: true }),
    );
  });

  it('suffixes the slug when it already exists', async () => {
    vi.mocked(repo.categorySlugExists).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.mocked(repo.createCategory).mockResolvedValue({ ...categoryRecord, slug: 'tote-bags-2' });

    await createCategory({ name: 'Tote Bags' });

    expect(repo.createCategory).toHaveBeenCalledWith(expect.objectContaining({ slug: 'tote-bags-2' }));
  });
});

describe('createProduct', () => {
  it('rejects unknown category references', async () => {
    vi.mocked(repo.findExistingCategoryIds).mockResolvedValue(['cat1']);

    await expect(
      createProduct({
        name: 'The Arch Bag',
        description: 'A structured handbag.',
        price: 240,
        categories: ['cat1', 'missing'],
        collections: [],
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    expect(repo.createProduct).not.toHaveBeenCalled();
  });

  it('persists the product with a generated slug', async () => {
    vi.mocked(repo.findExistingCategoryIds).mockResolvedValue(['cat1']);
    vi.mocked(repo.findExistingCollectionIds).mockResolvedValue([]);
    vi.mocked(repo.productSlugExists).mockResolvedValue(false);
    vi.mocked(repo.createProduct).mockResolvedValue(productRecord);

    await createProduct({
      name: 'The Arch Bag',
      description: 'A structured handbag.',
      price: 240,
      categories: ['cat1'],
      collections: [],
      status: 'active',
    });

    expect(repo.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'the-arch-bag', status: 'active' }),
    );
  });

  it('persists material, manufacturing, and stock fields', async () => {
    vi.mocked(repo.findExistingCategoryIds).mockResolvedValue([]);
    vi.mocked(repo.findExistingCollectionIds).mockResolvedValue([]);
    vi.mocked(repo.productSlugExists).mockResolvedValue(false);
    vi.mocked(repo.createProduct).mockResolvedValue({ ...productRecord, stockQuantity: 5 });

    await createProduct({
      name: 'The Arch Bag',
      description: 'A structured handbag.',
      price: 240,
      categories: [],
      collections: [],
      materialInfo: 'Full-grain leather',
      manufacturingInfo: 'Handcrafted in Kolkata',
      stockQuantity: 5,
    });

    expect(repo.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        materialInfo: 'Full-grain leather',
        manufacturingInfo: 'Handcrafted in Kolkata',
        stockQuantity: 5,
      }),
    );
  });
});

describe('updateProduct', () => {
  it('persists the internal stock and detail fields when provided', async () => {
    vi.mocked(repo.getProductById).mockResolvedValue(productRecord);
    vi.mocked(repo.updateProduct).mockResolvedValue({ ...productRecord, stockQuantity: 3 });

    await updateProduct('p1', { stockQuantity: 3, materialInfo: 'Canvas' });

    expect(repo.updateProduct).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ stockQuantity: 3, materialInfo: 'Canvas' }),
    );
  });
});

describe('getAdminProducts', () => {
  it('returns the admin list including stock quantities', async () => {
    vi.mocked(repo.listAdminProducts).mockResolvedValue([{ ...productRecord, stockQuantity: 7 }]);

    const products = await getAdminProducts();

    expect(repo.listAdminProducts).toHaveBeenCalled();
    expect(products[0].stockQuantity).toBe(7);
  });
});
