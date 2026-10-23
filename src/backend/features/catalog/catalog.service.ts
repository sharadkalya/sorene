import { AppError } from '@/backend/errors';
import { slugify } from './catalog.slug';
import * as repo from './catalog.repository';
import {
  categoryInputSchema,
  collectionInputSchema,
  formatIssues,
  productCreateSchema,
  productUpdateSchema,
  type CategoryInput,
  type CollectionInput,
  type ProductCreateInput,
  type ProductUpdateInput,
} from './catalog.validation';
import type {
  AdminProductRecord,
  CategoryRecord,
  CollectionRecord,
  ProductRecord,
  StorefrontCatalog,
  StorefrontCatalogFilters,
} from './catalog.types';

/**
 * Catalog business rules: validation, slug generation, reference integrity,
 * and storefront faceting. All persistence happens in `catalog.repository`.
 */

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureUniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (await repo.categorySlugExists(slug, excludeId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function ensureUniqueCollectionSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (await repo.collectionSlugExists(slug, excludeId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

async function ensureUniqueProductSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (await repo.productSlugExists(slug, excludeId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

// ─── Admin: categories ─────────────────────────────────────────────────────

export async function getAdminCategories(): Promise<CategoryRecord[]> {
  return repo.listCategories({ includeInactive: true });
}

export async function createCategory(input: unknown): Promise<CategoryRecord> {
  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));

  const data = parsed.data as CategoryInput;
  const slug = await ensureUniqueCategorySlug(slugify(data.name));
  return repo.createCategory({
    name: data.name,
    slug,
    description: data.description ?? '',
    imageUrl: data.imageUrl ?? '',
    isActive: data.isActive ?? true,
  });
}

export async function updateCategory(id: string, input: unknown): Promise<CategoryRecord> {
  const parsed = categoryInputSchema.partial().safeParse(input);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));

  const existing = await repo.getCategoryById(id);
  if (!existing) throw new AppError('NOT_FOUND', 'Category not found.');

  const data = parsed.data as Partial<CategoryInput>;
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) {
    patch.name = data.name;
    patch.slug = await ensureUniqueCategorySlug(slugify(data.name), id);
  }
  if (data.description !== undefined) patch.description = data.description;
  if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
  if (data.isActive !== undefined) patch.isActive = data.isActive;

  const updated = await repo.updateCategory(id, patch);
  if (!updated) throw new AppError('NOT_FOUND', 'Category not found.');
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await repo.getCategoryById(id);
  if (!existing) throw new AppError('NOT_FOUND', 'Category not found.');

  await repo.deleteCategory(id);
  await repo.removeCategoryFromProducts(id);
}

// ─── Admin: collections ────────────────────────────────────────────────────

export async function getAdminCollections(): Promise<CollectionRecord[]> {
  return repo.listCollections({ includeInactive: true });
}

export async function createCollection(input: unknown): Promise<CollectionRecord> {
  const parsed = collectionInputSchema.safeParse(input);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));

  const data = parsed.data as CollectionInput;
  const slug = await ensureUniqueCollectionSlug(slugify(data.name));
  return repo.createCollection({
    name: data.name,
    slug,
    description: data.description ?? '',
    imageUrl: data.imageUrl ?? '',
    isActive: data.isActive ?? true,
  });
}

export async function updateCollection(id: string, input: unknown): Promise<CollectionRecord> {
  const parsed = collectionInputSchema.partial().safeParse(input);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));

  const existing = await repo.getCollectionById(id);
  if (!existing) throw new AppError('NOT_FOUND', 'Collection not found.');

  const data = parsed.data as Partial<CollectionInput>;
  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) {
    patch.name = data.name;
    patch.slug = await ensureUniqueCollectionSlug(slugify(data.name), id);
  }
  if (data.description !== undefined) patch.description = data.description;
  if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;
  if (data.isActive !== undefined) patch.isActive = data.isActive;

  const updated = await repo.updateCollection(id, patch);
  if (!updated) throw new AppError('NOT_FOUND', 'Collection not found.');
  return updated;
}

export async function deleteCollection(id: string): Promise<void> {
  const existing = await repo.getCollectionById(id);
  if (!existing) throw new AppError('NOT_FOUND', 'Collection not found.');

  await repo.deleteCollection(id);
  await repo.removeCollectionFromProducts(id);
}

// ─── Admin: products ───────────────────────────────────────────────────────

export async function getAdminProducts(): Promise<AdminProductRecord[]> {
  return repo.listAdminProducts();
}

export async function getAdminProduct(id: string): Promise<ProductRecord> {
  const product = await repo.getProductById(id);
  if (!product) throw new AppError('NOT_FOUND', 'Product not found.');
  return product;
}

async function assertValidReferences(categoryIds: string[], collectionIds: string[]): Promise<void> {
  const [existingCategories, existingCollections] = await Promise.all([
    repo.findExistingCategoryIds(categoryIds),
    repo.findExistingCollectionIds(collectionIds),
  ]);

  if (existingCategories.length !== categoryIds.length) {
    throw new AppError('VALIDATION_ERROR', 'One or more categories do not exist.');
  }
  if (existingCollections.length !== collectionIds.length) {
    throw new AppError('VALIDATION_ERROR', 'One or more collections do not exist.');
  }
}

export async function createProduct(input: unknown): Promise<AdminProductRecord> {
  const parsed = productCreateSchema.safeParse(input);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));

  const data = parsed.data as ProductCreateInput;
  await assertValidReferences(data.categories, data.collections);

  const slug = await ensureUniqueProductSlug(slugify(data.name));
  return repo.createProduct({
    name: data.name,
    slug,
    description: data.description,
    price: data.price,
    compareAtPrice: data.compareAtPrice ?? null,
    images: data.images,
    categories: data.categories,
    collections: data.collections,
    status: data.status,
    featured: data.featured,
    materialInfo: data.materialInfo ?? '',
    manufacturingInfo: data.manufacturingInfo ?? '',
    stockQuantity: data.stockQuantity ?? 0,
  });
}

export async function updateProduct(id: string, input: unknown): Promise<AdminProductRecord> {
  const parsed = productUpdateSchema.safeParse(input);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', formatIssues(parsed.error));

  const existing = await repo.getProductById(id);
  if (!existing) throw new AppError('NOT_FOUND', 'Product not found.');

  const data = parsed.data as ProductUpdateInput;
  if (data.categories || data.collections) {
    const categoryIds = data.categories ?? existing.categories.map((c) => c.id);
    const collectionIds = data.collections ?? existing.collections.map((c) => c.id);
    await assertValidReferences(categoryIds, collectionIds);
  }

  const patch: Record<string, unknown> = {};
  if (data.name !== undefined) {
    patch.name = data.name;
    patch.slug = await ensureUniqueProductSlug(slugify(data.name), id);
  }
  if (data.description !== undefined) patch.description = data.description;
  if (data.price !== undefined) patch.price = data.price;
  if (data.compareAtPrice !== undefined) patch.compareAtPrice = data.compareAtPrice;
  if (data.images !== undefined) patch.images = data.images;
  if (data.categories !== undefined) patch.categories = data.categories;
  if (data.collections !== undefined) patch.collections = data.collections;
  if (data.status !== undefined) patch.status = data.status;
  if (data.featured !== undefined) patch.featured = data.featured;
  if (data.materialInfo !== undefined) patch.materialInfo = data.materialInfo;
  if (data.manufacturingInfo !== undefined) patch.manufacturingInfo = data.manufacturingInfo;
  if (data.stockQuantity !== undefined) patch.stockQuantity = data.stockQuantity;

  const updated = await repo.updateProduct(id, patch);
  if (!updated) throw new AppError('NOT_FOUND', 'Product not found.');
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await repo.getProductById(id);
  if (!existing) throw new AppError('NOT_FOUND', 'Product not found.');
  await repo.deleteProduct(id);
}

// ─── Storefront ────────────────────────────────────────────────────────────

export async function getStorefrontCategories(): Promise<CategoryRecord[]> {
  return repo.listCategories();
}

export async function getStorefrontCollections(): Promise<CollectionRecord[]> {
  return repo.listCollections();
}

export async function getStorefrontCategoriesWithCounts(): Promise<{
  categories: CategoryRecord[];
  counts: Record<string, number>;
}> {
  const [categories, counts] = await Promise.all([
    repo.listCategories(),
    repo.countActiveProductsByCategory(),
  ]);
  return { categories, counts };
}

export async function getStorefrontCollectionsWithCounts(): Promise<{
  collections: CollectionRecord[];
  counts: Record<string, number>;
}> {
  const [collections, counts] = await Promise.all([
    repo.listCollections(),
    repo.countActiveProductsByCollection(),
  ]);
  return { collections, counts };
}

export async function getStorefrontCatalog(filters: StorefrontCatalogFilters): Promise<StorefrontCatalog> {
  const [categories, collections, categoryCounts, collectionCounts] = await Promise.all([
    repo.listCategories(),
    repo.listCollections(),
    repo.countActiveProductsByCategory(),
    repo.countActiveProductsByCollection(),
  ]);

  const categoryIds = filters.categorySlugs?.length
    ? (await repo.findCategoriesBySlugs(filters.categorySlugs)).map((c) => c.id)
    : undefined;
  const collectionIds = filters.collectionSlugs?.length
    ? (await repo.findCollectionsBySlugs(filters.collectionSlugs)).map((c) => c.id)
    : undefined;

  // A requested slug that matches nothing must yield no products, not all of them.
  if (
    (categoryIds !== undefined && categoryIds.length === 0) ||
    (collectionIds !== undefined && collectionIds.length === 0)
  ) {
    return { products: [], categories, collections, categoryCounts, collectionCounts };
  }

  const products = await repo.listProducts({
    status: 'active',
    categoryIds,
    collectionIds,
    q: filters.q ? escapeRegExp(filters.q.trim()) : undefined,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
  });

  return { products, categories, collections, categoryCounts, collectionCounts };
}

export async function getStorefrontProductBySlug(slug: string): Promise<ProductRecord> {
  const product = await repo.getProductBySlug(slug);
  if (!product || product.status !== 'active') {
    throw new AppError('NOT_FOUND', 'Product not found.');
  }
  return product;
}

export async function getRelatedProducts(product: ProductRecord, limit = 4): Promise<ProductRecord[]> {
  const categoryIds = product.categories.map((c) => c.id);
  const collectionIds = product.collections.map((c) => c.id);

  if (categoryIds.length === 0 && collectionIds.length === 0) {
    return [];
  }

  const related = await repo.listProducts({
    status: 'active',
    categoryIds,
    collectionIds,
    excludeId: product.id,
    sort: 'featured',
    limit,
  });

  return related;
}
