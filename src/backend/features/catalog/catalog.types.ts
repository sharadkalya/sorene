/** Shared response contracts for the catalog feature (categories, collections, products). */

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'draft' | 'active';

export interface ProductRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  categories: CategoryRecord[];
  collections: CollectionRecord[];
  status: ProductStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Faceted storefront result returned by `getStorefrontCatalog`. */
export interface StorefrontCatalog {
  products: ProductRecord[];
  categories: CategoryRecord[];
  collections: CollectionRecord[];
  categoryCounts: Record<string, number>;
  collectionCounts: Record<string, number>;
}

export interface StorefrontCatalogFilters {
  categorySlugs?: string[];
  collectionSlugs?: string[];
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}
