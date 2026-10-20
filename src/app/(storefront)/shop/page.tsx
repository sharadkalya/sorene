import ProductListing from '@/frontend/features/storefront/ProductListing';
import { loadCatalog, type SearchParams } from './_catalog';

export const dynamic = 'force-dynamic';

/** Storefront: browse all active products with faceted filters. */
export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const { catalog, filters } = await loadCatalog(params);

  return (
    <ProductListing
      key={JSON.stringify(params)}
      catalog={catalog}
      basePath="/shop"
      title="Shop All"
      subtitle="Structured bags made with uncompromising intention."
      selectedCategorySlugs={filters.categorySlugs ?? []}
      selectedCollectionSlugs={filters.collectionSlugs ?? []}
      q={filters.q ?? ''}
      sort={filters.sort ?? 'featured'}
      minPrice={filters.minPrice}
      maxPrice={filters.maxPrice}
    />
  );
}
