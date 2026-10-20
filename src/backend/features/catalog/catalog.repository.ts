import { getMongoConnection } from '@/backend/integrations/database/connection';
import CategoryModel, { type ICategory } from '@/backend/integrations/database/models/Category';
import CollectionModel, { type ICollection } from '@/backend/integrations/database/models/Collection';
import ProductModel, {
  type IProduct,
  type ProductStatus,
} from '@/backend/integrations/database/models/Product';
import type {
  CategoryRecord,
  CollectionRecord,
  ProductRecord,
} from './catalog.types';

/**
 * Persistence for the catalog feature. Every function awaits the shared
 * Mongoose connection before touching a model (models buffer silently otherwise).
 */

type DocWithId<T> = T & { _id: { toString(): string } };

export interface CategoryData {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface ProductData {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  categories: string[];
  collections: string[];
  status: ProductStatus;
  featured: boolean;
}

export interface ProductQuery {
  status?: ProductStatus;
  categoryIds?: string[];
  collectionIds?: string[];
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  excludeId?: string;
  limit?: number;
}

function toCategoryRecord(doc: DocWithId<ICategory>): CategoryRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? '',
    imageUrl: doc.imageUrl ?? '',
    isActive: doc.isActive,
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

function toCollectionRecord(doc: DocWithId<ICollection>): CollectionRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? '',
    imageUrl: doc.imageUrl ?? '',
    isActive: doc.isActive,
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

type PopulatedProduct = DocWithId<IProduct> & {
  categories: DocWithId<ICategory>[];
  collections: DocWithId<ICollection>[];
};

function toProductRecord(doc: PopulatedProduct): ProductRecord {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    price: doc.price,
    compareAtPrice: doc.compareAtPrice ?? null,
    images: doc.images ?? [],
    categories: (doc.categories ?? []).map(toCategoryRecord),
    collections: (doc.collections ?? []).map(toCollectionRecord),
    status: doc.status,
    featured: doc.featured,
    createdAt: doc.createdAt?.toISOString() ?? '',
    updatedAt: doc.updatedAt?.toISOString() ?? '',
  };
}

function sortObject(sort?: string): Record<string, 1 | -1> {
  switch (sort) {
    case 'price-asc':
      return { price: 1 };
    case 'price-desc':
      return { price: -1 };
    case 'newest':
      return { createdAt: -1 };
    case 'featured':
    default:
      return { featured: -1, createdAt: -1 };
  }
}

// ─── Categories ────────────────────────────────────────────────────────────

export async function listCategories(options: { includeInactive?: boolean } = {}): Promise<CategoryRecord[]> {
  await getMongoConnection();
  const filter = options.includeInactive ? {} : { isActive: true };
  const docs = await CategoryModel.find(filter).sort({ name: 1 }).exec();
  return docs.map((doc) => toCategoryRecord(doc as unknown as DocWithId<ICategory>));
}

export async function getCategoryById(id: string): Promise<CategoryRecord | null> {
  await getMongoConnection();
  const doc = await CategoryModel.findById(id).exec();
  return doc ? toCategoryRecord(doc as unknown as DocWithId<ICategory>) : null;
}

export async function findCategoriesBySlugs(slugs: string[]): Promise<CategoryRecord[]> {
  if (slugs.length === 0) return [];
  await getMongoConnection();
  const docs = await CategoryModel.find({ slug: { $in: slugs } }).exec();
  return docs.map((doc) => toCategoryRecord(doc as unknown as DocWithId<ICategory>));
}

export async function categorySlugExists(slug: string, excludeId?: string): Promise<boolean> {
  await getMongoConnection();
  const filter: Record<string, unknown> = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  const doc = await CategoryModel.findOne(filter).select('_id').exec();
  return Boolean(doc);
}

export async function createCategory(data: CategoryData): Promise<CategoryRecord> {
  await getMongoConnection();
  const doc = await CategoryModel.create(data);
  return toCategoryRecord(doc as unknown as DocWithId<ICategory>);
}

export async function updateCategory(id: string, data: Partial<CategoryData>): Promise<CategoryRecord | null> {
  await getMongoConnection();
  const doc = await CategoryModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  return doc ? toCategoryRecord(doc as unknown as DocWithId<ICategory>) : null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  await getMongoConnection();
  const result = await CategoryModel.deleteOne({ _id: id }).exec();
  return result.deletedCount > 0;
}

// ─── Collections ───────────────────────────────────────────────────────────

export async function listCollections(options: { includeInactive?: boolean } = {}): Promise<CollectionRecord[]> {
  await getMongoConnection();
  const filter = options.includeInactive ? {} : { isActive: true };
  const docs = await CollectionModel.find(filter).sort({ name: 1 }).exec();
  return docs.map((doc) => toCollectionRecord(doc as unknown as DocWithId<ICollection>));
}

export async function getCollectionById(id: string): Promise<CollectionRecord | null> {
  await getMongoConnection();
  const doc = await CollectionModel.findById(id).exec();
  return doc ? toCollectionRecord(doc as unknown as DocWithId<ICollection>) : null;
}

export async function findCollectionsBySlugs(slugs: string[]): Promise<CollectionRecord[]> {
  if (slugs.length === 0) return [];
  await getMongoConnection();
  const docs = await CollectionModel.find({ slug: { $in: slugs } }).exec();
  return docs.map((doc) => toCollectionRecord(doc as unknown as DocWithId<ICollection>));
}

export async function collectionSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  await getMongoConnection();
  const filter: Record<string, unknown> = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  const doc = await CollectionModel.findOne(filter).select('_id').exec();
  return Boolean(doc);
}

export async function createCollection(data: CategoryData): Promise<CollectionRecord> {
  await getMongoConnection();
  const doc = await CollectionModel.create(data);
  return toCollectionRecord(doc as unknown as DocWithId<ICollection>);
}

export async function updateCollection(id: string, data: Partial<CategoryData>): Promise<CollectionRecord | null> {
  await getMongoConnection();
  const doc = await CollectionModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).exec();
  return doc ? toCollectionRecord(doc as unknown as DocWithId<ICollection>) : null;
}

export async function deleteCollection(id: string): Promise<boolean> {
  await getMongoConnection();
  const result = await CollectionModel.deleteOne({ _id: id }).exec();
  return result.deletedCount > 0;
}

// ─── Products ──────────────────────────────────────────────────────────────

export async function listProducts(query: ProductQuery = {}): Promise<ProductRecord[]> {
  await getMongoConnection();
  const filter: Record<string, unknown> = {};

  if (query.status) filter.status = query.status;
  if (query.categoryIds?.length) filter.categories = { $in: query.categoryIds };
  if (query.collectionIds?.length) filter.collections = { $in: query.collectionIds };
  if (query.excludeId) filter._id = { $ne: query.excludeId };
  if (query.q) {
    filter.$or = [
      { name: { $regex: query.q, $options: 'i' } },
      { description: { $regex: query.q, $options: 'i' } },
    ];
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceFilter: { $gte?: number; $lte?: number } = {};
    if (query.minPrice !== undefined) priceFilter.$gte = query.minPrice;
    if (query.maxPrice !== undefined) priceFilter.$lte = query.maxPrice;
    filter.price = priceFilter;
  }

  let findQuery = ProductModel.find(filter).populate('categories collections').sort(sortObject(query.sort));
  if (query.limit !== undefined) findQuery = findQuery.limit(query.limit);

  const docs = await findQuery.exec();
  return docs.map((doc) => toProductRecord(doc as unknown as PopulatedProduct));
}

export async function getProductById(id: string): Promise<ProductRecord | null> {
  await getMongoConnection();
  const doc = await ProductModel.findById(id).populate('categories collections').exec();
  return doc ? toProductRecord(doc as unknown as PopulatedProduct) : null;
}

export async function getProductBySlug(slug: string): Promise<ProductRecord | null> {
  await getMongoConnection();
  const doc = await ProductModel.findOne({ slug }).populate('categories collections').exec();
  return doc ? toProductRecord(doc as unknown as PopulatedProduct) : null;
}

export async function productSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  await getMongoConnection();
  const filter: Record<string, unknown> = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  const doc = await ProductModel.findOne(filter).select('_id').exec();
  return Boolean(doc);
}

export async function findExistingCategoryIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  await getMongoConnection();
  const docs = await CategoryModel.find({ _id: { $in: ids } }).select('_id').exec();
  return docs.map((doc) => doc._id.toString());
}

export async function findExistingCollectionIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  await getMongoConnection();
  const docs = await CollectionModel.find({ _id: { $in: ids } }).select('_id').exec();
  return docs.map((doc) => doc._id.toString());
}

export async function createProduct(data: ProductData): Promise<ProductRecord> {
  await getMongoConnection();
  const doc = await ProductModel.create(data);
  return toProductRecord(doc as unknown as PopulatedProduct);
}

export async function updateProduct(id: string, data: Partial<ProductData>): Promise<ProductRecord | null> {
  await getMongoConnection();
  const doc = await ProductModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    .populate('categories collections')
    .exec();
  return doc ? toProductRecord(doc as unknown as PopulatedProduct) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  await getMongoConnection();
  const result = await ProductModel.deleteOne({ _id: id }).exec();
  return result.deletedCount > 0;
}

export async function removeCategoryFromProducts(categoryId: string): Promise<void> {
  await getMongoConnection();
  await ProductModel.updateMany({ categories: categoryId }, { $pull: { categories: categoryId } }).exec();
}

export async function removeCollectionFromProducts(collectionId: string): Promise<void> {
  await getMongoConnection();
  await ProductModel.updateMany({ collections: collectionId }, { $pull: { collections: collectionId } }).exec();
}

export async function countActiveProductsByCategory(): Promise<Record<string, number>> {
  await getMongoConnection();
  const rows = await ProductModel.aggregate<{ _id: unknown; count: number }>([
    { $match: { status: 'active' } },
    { $unwind: '$categories' },
    { $group: { _id: '$categories', count: { $sum: 1 } } },
  ]);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[String(row._id)] = row.count;
  }
  return counts;
}

export async function countActiveProductsByCollection(): Promise<Record<string, number>> {
  await getMongoConnection();
  const rows = await ProductModel.aggregate<{ _id: unknown; count: number }>([
    { $match: { status: 'active' } },
    { $unwind: '$collections' },
    { $group: { _id: '$collections', count: { $sum: 1 } } },
  ]);
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[String(row._id)] = row.count;
  }
  return counts;
}
