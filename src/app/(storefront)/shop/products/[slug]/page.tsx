import { getRelatedProducts, getStorefrontProductBySlug } from '@/backend/features/catalog/catalog.service';
import ProductDetail from '@/frontend/features/storefront/ProductDetail';

export const dynamic = 'force-dynamic';

/** Storefront: single product detail page. */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  const related = await getRelatedProducts(product);

  return <ProductDetail product={product} related={related} />;
}
