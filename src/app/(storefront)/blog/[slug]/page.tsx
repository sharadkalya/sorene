import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadPost } from '../_blog';
import { getSiteUrl } from '@/common/env';
import type { BlogPostRecord } from '@/backend/features/blog/blog.types';
import BlogArticle from '@/frontend/features/storefront/BlogArticle';

export const dynamic = 'force-dynamic';

function formatDate(value: string | null): string {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Build the canonical URL for a post: explicit override or /blog/<slug>. */
function canonicalUrlFor(post: BlogPostRecord): string {
  return post.canonicalUrl || `${getSiteUrl()}/blog/${post.slug}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug).catch(() => null);
  if (!post) notFound();

  const canonical = canonicalUrlFor(post);
  const description = post.metaDescription || post.excerpt || '';

  return {
    title: post.title,
    description: description || undefined,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: canonical,
      siteName: 'SORvÈNE',
      publishedTime: post.publishedAt ?? undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

/** Storefront: single blog post with SEO metadata and JSON-LD structured data. */
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadPost(slug).catch(() => null);
  if (!post) notFound();

  const canonical = canonicalUrlFor(post);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt || '',
    image: post.coverImageUrl || undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt || undefined,
    author: post.authorName ? { '@type': 'Person', name: post.authorName } : undefined,
    publisher: { '@type': 'Organization', name: 'SORvÈNE' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  };

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <header className="mb-8">
        <div className="text-sm text-base-content/50 mb-3">
          {formatDate(post.publishedAt)}
          {post.authorName ? ` · ${post.authorName}` : ''}
        </div>
        <h1 className="text-4xl font-semibold tracking-wide leading-tight">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-base-content/70 mt-4">{post.excerpt}</p>}
      </header>

      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.title}
          className="w-full rounded-box border border-base-300 mb-8"
        />
      )}

      <BlogArticle content={post.content} />

      {post.tags.length > 0 && (
        <footer className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-base-300">
          {post.tags.map((tag) => (
            <span key={tag} className="badge badge-outline">
              {tag}
            </span>
          ))}
        </footer>
      )}
    </article>
  );
}
