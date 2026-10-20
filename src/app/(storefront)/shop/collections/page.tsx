import { getStorefrontCollectionsWithCounts } from '@/backend/features/catalog/catalog.service';
import TaxonomyGrid from '@/frontend/features/storefront/TaxonomyGrid';

export const dynamic = 'force-dynamic';

/** Storefront: index of all active collections. */
export default async function CollectionsIndexPage() {
  const { collections, counts } = await getStorefrontCollectionsWithCounts();
  return <TaxonomyGrid kind="collections" items={collections} counts={counts} />;
}
