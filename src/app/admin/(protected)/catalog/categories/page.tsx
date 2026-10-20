import { getAdminCategories } from '@/backend/features/catalog/catalog.service';
import TaxonomyManager from '@/frontend/features/admin/catalog/TaxonomyManager';

export const dynamic = 'force-dynamic';

/** Admin: manage product categories (CRUD + cover image). */
export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();
  return <TaxonomyManager kind="categories" initialItems={categories} />;
}
