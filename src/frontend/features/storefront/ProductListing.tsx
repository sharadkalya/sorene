'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductCard, { type StorefrontProduct } from './ProductCard';

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

  const searchRef = useRef<HTMLInputElement>(null);
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

  const applySearch = () => push({ q: searchRef.current?.value ?? '' });
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
        <button onClick={() => setFiltersOpen((open) => !open)} className="btn btn-outline btn-sm">
          {filtersOpen ? 'Hide Filters' : 'Show Filters'}
        </button>
        <span className="text-sm text-base-content/60">{catalog.products.length} products</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
          <div className="space-y-6 sticky top-24">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Search</span>
              <div className="join w-full">
                <input
                  ref={searchRef}
                  type="text"
                  defaultValue={q}
                  placeholder="Search products"
                  className="input input-sm join-item w-full"
                />
                <button onClick={applySearch} className="btn btn-primary btn-sm join-item">
                  Go
                </button>
              </div>
            </div>

            {!lockedCategorySlug && (
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
                  {catalog.categories.length === 0 && (
                    <p className="text-sm text-base-content/50">No categories yet.</p>
                  )}
                </div>
              </div>
            )}

            {!lockedCollectionSlug && (
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
                  {catalog.collections.length === 0 && (
                    <p className="text-sm text-base-content/50">No collections yet.</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Price</h3>
              <div className="flex gap-2">
                <input
                  ref={minRef}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={minPrice !== undefined ? String(minPrice) : ''}
                  placeholder="Min"
                  className="input input-sm w-full"
                />
                <input
                  ref={maxRef}
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={maxPrice !== undefined ? String(maxPrice) : ''}
                  placeholder="Max"
                  className="input input-sm w-full"
                />
              </div>
              <button onClick={applyPrice} className="btn btn-outline btn-xs mt-2">
                Apply
              </button>
            </div>

            {activeFilterCount > 0 && (
              <button onClick={() => router.push(basePath)} className="btn btn-ghost btn-xs text-error">
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Product grid */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-base-content/60 hidden lg:inline">
              {catalog.products.length} product{catalog.products.length === 1 ? '' : 's'}
            </span>
            <select
              value={sort}
              onChange={(event) => push({ sort: event.target.value })}
              className="select select-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {catalog.products.length === 0 ? (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body text-center py-20">
                <p className="text-base-content/60">No products match your filters.</p>
                <button onClick={() => router.push(basePath)} className="btn btn-outline btn-sm mx-auto">
                  Clear filters
                </button>
              </div>
            </div>
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
