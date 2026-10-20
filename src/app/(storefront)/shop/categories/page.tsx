import { getStorefrontCategoriesWithCounts } from '@/backend/features/catalog/catalog.service';
import TaxonomyGrid from '@/frontend/features/storefront/TaxonomyGrid';

export const dynamic = 'force-dynamic';

/** Storefront: index of all active categories. */
export default async function CategoriesIndexPage() {
  const { categories, counts } = await getStorefrontCategoriesWithCounts();
  return <TaxonomyGrid kind="categories" items={categories} counts={counts} />;
}
