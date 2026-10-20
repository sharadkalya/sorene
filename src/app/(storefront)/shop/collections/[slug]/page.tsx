import ProductListing from '@/frontend/features/storefront/ProductListing';
import { loadCatalog, type SearchParams } from '../../_catalog';

export const dynamic = 'force-dynamic';

/** Storefront: products within a single collection, with extra filters. */
export default async function CollectionListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { catalog, filters } = await loadCatalog(sp, { collectionSlug: slug });

  const collection = catalog.collections.find((entry) => entry.slug === slug);

  return (
    <ProductListing
      key={`${slug}:${JSON.stringify(sp)}`}
      catalog={catalog}
      basePath={`/shop/collections/${slug}`}
      title={collection?.name ?? slug}
      subtitle={collection?.description || undefined}
      selectedCategorySlugs={filters.categorySlugs ?? []}
      selectedCollectionSlugs={[]}
      q={filters.q ?? ''}
      sort={filters.sort ?? 'featured'}
      minPrice={filters.minPrice}
      maxPrice={filters.maxPrice}
      lockedCollectionSlug={slug}
    />
  );
}
