import { getAdminCollections } from '@/backend/features/catalog/catalog.service';
import TaxonomyManager from '@/frontend/features/admin/catalog/TaxonomyManager';

export const dynamic = 'force-dynamic';

/** Admin: manage product collections (CRUD + cover image). */
export default async function AdminCollectionsPage() {
  const collections = await getAdminCollections();
  return <TaxonomyManager kind="collections" initialItems={collections} />;
}
