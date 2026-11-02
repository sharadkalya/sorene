import Link from 'next/link';
import type { BlogPostRecord } from '@/backend/features/blog/blog.types';

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Public blog index: a grid of published posts linking to their detail pages. */
export default function BlogIndex({ posts }: { posts: BlogPostRecord[] }) {
  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-semibold tracking-wide">The Journal</h1>
        <p className="text-base-content/70 mt-2">
          Stories on quiet luxury, craftsmanship, and the intention behind every SORvÈNE bag.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-base-content/60">
          <p>No posts yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow"
            >
              {post.coverImageUrl && (
                <figure className="aspect-[16/10] overflow-hidden rounded-t-box">
                  <img src={post.coverImageUrl} alt={post.title} className="w-full h-full object-cover" />
                </figure>
              )}
              <div className="card-body p-5">
                <div className="text-xs text-base-content/50">{formatDate(post.publishedAt)}</div>
                <h2 className="card-title text-xl leading-snug">{post.title}</h2>
                {post.excerpt && <p className="text-base-content/70 text-sm">{post.excerpt}</p>}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="badge badge-outline badge-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
