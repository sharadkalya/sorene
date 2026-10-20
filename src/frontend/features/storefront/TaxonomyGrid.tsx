'use client';

import Link from 'next/link';

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

interface TaxonomyGridProps {
  kind: 'categories' | 'collections';
  items: TaxonomyItem[];
  counts: Record<string, number>;
}

/** Grid of category/collection tiles linking to their filtered listings. */
export default function TaxonomyGrid({ kind, items, counts }: TaxonomyGridProps) {
  const label = kind === 'categories' ? 'Categories' : 'Collections';

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold mb-4">{label}</h1>
        <p className="text-base-content/60">Nothing here yet — check back soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-2">{label}</h1>
      <p className="text-base-content/70 mb-8">Browse by {kind === 'categories' ? 'category' : 'collection'}.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/shop/${kind}/${item.slug}`}
            className="card bg-base-100 border border-base-300 overflow-hidden group"
          >
            <div className="aspect-square bg-base-200 overflow-hidden">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base-content/30">
                  {item.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="card-body p-4">
              <h2 className="font-medium group-hover:text-primary">{item.name}</h2>
              <p className="text-sm text-base-content/60">{counts[item.id] ?? 0} products</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
