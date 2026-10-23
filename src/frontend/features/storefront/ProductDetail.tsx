'use client';

import { useState } from 'react';
import Link from 'next/link';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

import { useAppDispatch } from '@/frontend/store/hooks';
import { addItem } from '@/frontend/store/slices/cart.slice';
import Button from '@/frontend/components/Button';
import Badge from '@/frontend/components/Badge';
import { useWishlistToggle } from '@/frontend/features/wishlist/useWishlistToggle';
import ProductCard, { type StorefrontProduct } from './ProductCard';
import { formatPrice } from './format';

interface FacetItem {
  id: string;
  name: string;
  slug: string;
}

interface ProductDetailData {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  categories: FacetItem[];
  collections: FacetItem[];
  materialInfo?: string;
  manufacturingInfo?: string;
}

interface ProductDetailProps {
  product: ProductDetailData;
  related: StorefrontProduct[];
}

/** Product detail page with a zoomable lightbox gallery and add-to-cart. */
export default function ProductDetail({ product, related }: ProductDetailProps) {
  const dispatch = useAppDispatch();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { wishlisted, toggle, busy } = useWishlistToggle({
    slug: product.slug,
    name: product.name,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    image: product.images[0] ?? '',
  });

  const slides = product.images.map((src) => ({ src }));
  const savings =
    product.compareAtPrice != null && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : null;

  const handleAdd = () => {
    dispatch(
      addItem({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? '',
        quantity,
      }),
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm breadcrumbs mb-6">
        <ul>
          <li><Link href="/" className="text-base-content/60">Home</Link></li>
          <li><Link href="/shop" className="text-base-content/60">Shop</Link></li>
          <li>{product.name}</li>
        </ul>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block w-full aspect-square rounded-xl overflow-hidden bg-base-200 border border-base-300 cursor-zoom-in"
            aria-label="Open image viewer"
          >
            {product.images[activeIndex] ? (
              <img
                src={product.images[activeIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-base-content/30">No image</div>
            )}
          </button>

          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 ${
                    index === activeIndex ? 'border-primary' : 'border-base-300'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>

          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <>
                <span className="text-lg text-base-content/50 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <Badge variant="secondary">{savings}% off</Badge>
              </>
            )}
          </div>

          {(product.categories.length > 0 || product.collections.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {product.categories.map((category) => (
                <Badge key={category.id} as="a" href={`/shop/categories/${category.slug}`} variant="outline">
                  {category.name}
                </Badge>
              ))}
              {product.collections.map((collection) => (
                <Badge key={collection.id} as="a" href={`/shop/collections/${collection.slug}`} variant="outline">
                  {collection.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="join">
              <Button
                variant="outline"
                className="join-item"
                onClick={() => setQuantity((qty) => Math.max(1, qty - 1))}
                aria-label="Decrease quantity"
              >
                −
              </Button>
              <span className="join-item px-4 flex items-center">{quantity}</span>
              <Button
                variant="outline"
                className="join-item"
                onClick={() => setQuantity((qty) => qty + 1)}
                aria-label="Increase quantity"
              >
                +
              </Button>
            </div>
            <Button onClick={handleAdd} variant="primary" className="flex-1">
              Add to Cart
            </Button>
            <Button
              onClick={toggle}
              variant="ghost"
              shape="circle"
              disabled={busy}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {busy ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ${wishlisted ? 'text-primary' : ''}`}
                  fill={wishlisted ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              )}
            </Button>
          </div>

          <div className="divider my-6">Details</div>
          <p className="text-base-content/80 whitespace-pre-line leading-relaxed">{product.description}</p>

          {(product.materialInfo || product.manufacturingInfo) && (
            <div className="card bg-base-200/50 border border-base-300 mt-6">
              <div className="card-body gap-4">
                <h2 className="text-lg font-semibold">Material & care</h2>
                {product.materialInfo && (
                  <div>
                    <p className="text-sm font-medium mb-1">Material</p>
                    <p className="text-sm text-base-content/70 whitespace-pre-line">{product.materialInfo}</p>
                  </div>
                )}
                {product.manufacturingInfo && (
                  <div>
                    <p className="text-sm font-medium mb-1">Manufacturing</p>
                    <p className="text-sm text-base-content/70 whitespace-pre-line">{product.manufacturingInfo}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={activeIndex}
        slides={slides}
        plugins={[Zoom, Thumbnails, Fullscreen]}
      />
    </div>
  );
}
