import ProductListing from '@/frontend/features/storefront/ProductListing';
import { loadCatalog, type SearchParams } from '../../_catalog';

export const dynamic = 'force-dynamic';

/** Storefront: products within a single category, with extra filters. */
export default async function CategoryListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { catalog, filters } = await loadCatalog(sp, { categorySlug: slug });

  const category = catalog.categories.find((entry) => entry.slug === slug);

  return (
    <ProductListing
      key={`${slug}:${JSON.stringify(sp)}`}
      catalog={catalog}
      basePath={`/shop/categories/${slug}`}
      title={category?.name ?? slug}
      subtitle={category?.description || undefined}
      selectedCategorySlugs={[]}
      selectedCollectionSlugs={filters.collectionSlugs ?? []}
      q={filters.q ?? ''}
      sort={filters.sort ?? 'featured'}
      minPrice={filters.minPrice}
      maxPrice={filters.maxPrice}
      lockedCategorySlug={slug}
    />
  );
}
