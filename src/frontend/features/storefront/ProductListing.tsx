'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/frontend/components/Button';
import Select from '@/frontend/components/Select';
import TextInput from '@/frontend/components/TextInput';
import ProductCard, { type StorefrontProduct } from './ProductCard';
import { formatPrice } from './format';

interface FacetItem {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogData {
  products: StorefrontProduct[];
  categories: FacetItem[];
  collections: FacetItem[];
  categoryCounts: Record<string, number>;
  collectionCounts: Record<string, number>;
}

interface ProductListingProps {
  catalog: CatalogData;
  basePath: string;
  title: string;
  subtitle?: string;
  selectedCategorySlugs: string[];
  selectedCollectionSlugs: string[];
  q: string;
  sort: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  lockedCategorySlug?: string;
  lockedCollectionSlug?: string;
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

/**
 * Faceted product listing. Filters live in the URL (server-driven); this
 * component only renders the controls and pushes new URLs on change.
 */
export default function ProductListing(props: ProductListingProps) {
  const {
    catalog,
    basePath,
    title,
    subtitle,
    selectedCategorySlugs,
    selectedCollectionSlugs,
    q,
    sort,
    minPrice,
    maxPrice,
    lockedCategorySlug,
    lockedCollectionSlug,
  } = props;

  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  const push = (updates: {
    categories?: string[];
    collections?: string[];
    q?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const query = new URLSearchParams();

    const categories = lockedCategorySlug ? [] : (updates.categories ?? selectedCategorySlugs);
    const collections = lockedCollectionSlug ? [] : (updates.collections ?? selectedCollectionSlugs);

    if (categories.length) query.set('category', categories.join(','));
    if (collections.length) query.set('collection', collections.join(','));

    const nextQ = updates.q !== undefined ? updates.q : q;
    if (nextQ) query.set('q', nextQ);

    const nextSort = updates.sort ?? sort;
    if (nextSort && nextSort !== 'featured') query.set('sort', nextSort);

    const nextMin = updates.minPrice !== undefined ? updates.minPrice : (minPrice !== undefined ? String(minPrice) : '');
    const nextMax = updates.maxPrice !== undefined ? updates.maxPrice : (maxPrice !== undefined ? String(maxPrice) : '');
    if (nextMin) query.set('minPrice', nextMin);
    if (nextMax) query.set('maxPrice', nextMax);

    const qs = query.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  };

  const toggleCategory = (slug: string) => {
    const next = selectedCategorySlugs.includes(slug)
      ? selectedCategorySlugs.filter((entry) => entry !== slug)
      : [...selectedCategorySlugs, slug];
    push({ categories: next });
  };

  const toggleCollection = (slug: string) => {
    const next = selectedCollectionSlugs.includes(slug)
      ? selectedCollectionSlugs.filter((entry) => entry !== slug)
      : [...selectedCollectionSlugs, slug];
    push({ collections: next });
  };

  const applyPrice = () => push({ minPrice: minRef.current?.value ?? '', maxPrice: maxRef.current?.value ?? '' });

  const activeFilterCount =
    selectedCategorySlugs.length +
    selectedCollectionSlugs.length +
    (q ? 1 : 0) +
    (minPrice !== undefined || maxPrice !== undefined ? 1 : 0) +
    (lockedCategorySlug || lockedCollectionSlug ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="text-base-content/70 mt-1">{subtitle}</p>}
      </div>

      {/* Locked facet chips */}
      {(lockedCategorySlug || lockedCollectionSlug) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {lockedCollectionSlug && (
            <LinkChip label={lockedCollectionSlug} href="/shop" />
          )}
          {lockedCategorySlug && (
            <LinkChip label={lockedCategorySlug} href="/shop" />
          )}
        </div>
      )}

      <div className="lg:hidden mb-4 flex items-center justify-between">
        <Button onClick={() => setFiltersOpen((open) => !open)} variant="outline" size="sm">
          {filtersOpen ? 'Hide Filters' : 'Show Filters'}
        </Button>
        <span className="text-sm text-base-content/60">{catalog.products.length} products</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
          <div className="space-y-6 sticky top-24">
            {!lockedCategorySlug && catalog.categories.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Category</h3>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {catalog.categories.map((category) => (
                    <label key={category.id} className="label cursor-pointer justify-start gap-3 py-0">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={selectedCategorySlugs.includes(category.slug)}
                        onChange={() => toggleCategory(category.slug)}
                      />
                      <span>{category.name}</span>
                      <span className="text-xs text-base-content/50 ml-auto">
                        {catalog.categoryCounts[category.id] ?? 0}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!lockedCollectionSlug && catalog.collections.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Collection</h3>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {catalog.collections.map((collection) => (
                    <label key={collection.id} className="label cursor-pointer justify-start gap-3 py-0">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-secondary checkbox-sm"
                        checked={selectedCollectionSlugs.includes(collection.slug)}
                        onChange={() => toggleCollection(collection.slug)}
                      />
                      <span>{collection.name}</span>
                      <span className="text-xs text-base-content/50 ml-auto">
                        {catalog.collectionCounts[collection.id] ?? 0}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Price</h3>
              <div className="flex gap-3">
                <TextInput
                  ref={minRef}
                  size="sm"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={minPrice !== undefined ? String(minPrice) : ''}
                  placeholder="Min"
                />
                <TextInput
                  ref={maxRef}
                  size="sm"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={maxPrice !== undefined ? String(maxPrice) : ''}
                  placeholder="Max"
                />
              </div>
              <Button onClick={applyPrice} variant="outline" size="xs" className="mt-2">
                Apply
              </Button>
            </div>

            {activeFilterCount > 0 && (
              <Button onClick={() => router.push(basePath)} variant="ghost" size="xs" className="text-error">
                Clear all filters
              </Button>
            )}
          </div>
        </aside>

        {/* Product grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-base-content/60 hidden lg:inline">
              {catalog.products.length} product{catalog.products.length === 1 ? '' : 's'}
            </span>
            <Select
              value={sort}
              onChange={(event) => push({ sort: event.target.value })}
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategorySlugs.map((slug) => {
                const category = catalog.categories.find((entry) => entry.slug === slug);
                return (
                  <button
                    key={`category-${slug}`}
                    onClick={() => toggleCategory(slug)}
                    className="badge badge-outline gap-1 py-3"
                  >
                    {category?.name ?? slug} ✕
                  </button>
                );
              })}
              {selectedCollectionSlugs.map((slug) => {
                const collection = catalog.collections.find((entry) => entry.slug === slug);
                return (
                  <button
                    key={`collection-${slug}`}
                    onClick={() => toggleCollection(slug)}
                    className="badge badge-outline gap-1 py-3"
                  >
                    {collection?.name ?? slug} ✕
                  </button>
                );
              })}
              {q && (
                <button onClick={() => push({ q: '' })} className="badge badge-outline gap-1 py-3">
                  “{q}” ✕
                </button>
              )}
              {(minPrice !== undefined || maxPrice !== undefined) && (
                <button
                  onClick={() => push({ minPrice: '', maxPrice: '' })}
                  className="badge badge-outline gap-1 py-3"
                >
                  {minPrice !== undefined ? formatPrice(minPrice) : 'Any'} –{' '}
                  {maxPrice !== undefined ? formatPrice(maxPrice) : 'Any'} ✕
                </button>
              )}
            </div>
          )}

          {catalog.products.length === 0 ? (
            activeFilterCount > 0 ? (
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body items-center text-center py-16 gap-3">
                  <p className="text-base-content/60">No products match your filters.</p>
                  <Button onClick={() => router.push(basePath)} variant="outline" size="sm">
                    Clear filters
                  </Button>
                </div>
              </div>
            ) : (
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body items-center text-center py-16 gap-3">
                  <p className="font-medium">The new collection is arriving soon.</p>
                  <p className="text-base-content/60">We&apos;re curating our first drop — check back shortly.</p>
                  <Button href="/" variant="primary" size="sm" className="mt-2">
                    Back to home
                  </Button>
                </div>
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {catalog.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkChip({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} className="badge badge-outline gap-1 py-3">
      {label} ✕
    </a>
  );
}
