import { getStorefrontCatalog } from '@/backend/features/catalog/catalog.service';
import type { StorefrontCatalogFilters } from '@/backend/features/catalog/catalog.types';

/**
 * Server-side helpers shared by the storefront listing pages. Not a route
 * (the `_` prefix excludes this file from the App Router).
 */

export type SearchParams = Record<string, string | string[] | undefined>;

function asString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function asList(value: string | string[] | undefined): string[] {
  const single = asString(value);
  if (!single) return [];
  return single.split(',').map((part) => part.trim()).filter(Boolean);
}

export function buildFilters(
  params: SearchParams,
  options: { categorySlug?: string; collectionSlug?: string } = {},
): StorefrontCatalogFilters {
  const minPrice = asString(params.minPrice);
  const maxPrice = asString(params.maxPrice);

  return {
    categorySlugs: options.categorySlug ? [options.categorySlug] : asList(params.category),
    collectionSlugs: options.collectionSlug ? [options.collectionSlug] : asList(params.collection),
    q: asString(params.q),
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: asString(params.sort),
  };
}

export async function loadCatalog(
  params: SearchParams,
  options?: { categorySlug?: string; collectionSlug?: string },
) {
  const filters = buildFilters(params, options);
  const catalog = await getStorefrontCatalog(filters);
  return { catalog, filters };
}
