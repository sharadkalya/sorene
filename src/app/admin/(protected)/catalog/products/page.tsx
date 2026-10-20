import {
  getAdminCategories,
  getAdminCollections,
  getAdminProducts,
} from '@/backend/features/catalog/catalog.service';
import ProductsManager from '@/frontend/features/admin/catalog/ProductsManager';

export const dynamic = 'force-dynamic';

/** Admin: manage products (CRUD, images, category/collection assignment). */
export default async function AdminProductsPage() {
  const [products, categories, collections] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
    getAdminCollections(),
  ]);

  return <ProductsManager initialProducts={products} categories={categories} collections={collections} />;
}
