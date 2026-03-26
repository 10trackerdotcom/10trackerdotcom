import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import { Calendar, Eye, ArrowRight, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 20;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function safePage(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export async function generateMetadata({ params }) {
  const { category } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';

  let categoryName = category;
  let description = `Browse articles in ${category}.`;

  try {
    const { data } = await supabase
      .from('article_categories')
      .select('name, slug')
      .eq('slug', category)
      .single();
    if (data?.name) {
      categoryName = data.name;
      description = `Browse the latest ${data.name} articles on 10tracker.`;
    }
  } catch {
    // ignore
  }

  const title = `${categoryName} Articles | 10tracker`;
  const canonical = `${siteUrl}/articles/${category}`;

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: '10tracker',
      images: [
        {
          url: `${siteUrl}/10tracker.png`,
          width: 1200,
          height: 630,
          alt: '10tracker',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/10tracker.png`],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ArticlesByCategoryPage({ params, searchParams }) {
  const { category } = await params;
  const resolvedSearch = await searchParams;
  const page = safePage(resolvedSearch?.page);
  const offset = (page - 1) * PAGE_SIZE;

  let categoryRow = null;
  let articles = [];
  let totalCount = 0;

  try {
    const { data: c } = await supabase
      .from('article_categories')
      .select('name, slug, color')
      .eq('slug', category)
      .single();
    categoryRow = c || null;
  } catch {
    // ignore
  }

  try {
    const { data, count } = await supabase
      .from('published_articles')
      .select('id, slug, title, excerpt, category, created_at, view_count, is_featured', {
        count: 'exact',
      })
      .eq('category', category)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    articles = data || [];
    totalCount = count || 0;
  } catch {
    // ignore
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const displayName = categoryRow?.name || category;
  const color = categoryRow?.color || '#3B82F6';

  const makePageHref = (p) => (p <= 1 ? `/articles/category/${category}` : `/articles/category/${category}?page=${p}`);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white pt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              All Articles
            </Link>

            <div className="flex items-center gap-3 mb-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {displayName}
              </span>
              <span className="text-sm text-neutral-600">
                {totalCount} {totalCount === 1 ? 'article' : 'articles'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
              {displayName}
            </h1>
            <p className="text-neutral-600 mt-2">
              Page {page} of {totalPages}
            </p>
          </div>

          {articles.length > 0 ? (
            <>
              <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {articles.map((article) => (
                      <tr key={article.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/articles/${article.slug}`} className="group block">
                            <div className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-2 mb-1">
                              {article.title}
                              {article.is_featured && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                  Featured
                                </span>
                              )}
                            </div>
                            {article.excerpt && (
                              <p className="text-xs text-neutral-500 line-clamp-1">{article.excerpt}</p>
                            )}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            {formatDate(article.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                            <Eye className="w-4 h-4 text-neutral-400" />
                            {article.view_count || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/articles/${article.slug}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors group"
                          >
                            View
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
                  <Link
                    href={makePageHref(Math.max(1, page - 1))}
                    aria-disabled={page === 1}
                    className={`px-4 py-2 border border-neutral-300 rounded-lg transition-colors ${
                      page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-neutral-50'
                    }`}
                  >
                    Previous
                  </Link>
                  <span className="px-4 py-2 text-sm text-neutral-600">
                    Page {page} of {totalPages}
                  </span>
                  <Link
                    href={makePageHref(Math.min(totalPages, page + 1))}
                    aria-disabled={page === totalPages}
                    className={`px-4 py-2 border border-neutral-300 rounded-lg transition-colors ${
                      page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-neutral-50'
                    }`}
                  >
                    Next
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl">
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">No articles found</h2>
              <p className="text-neutral-600 mb-6">This category has no published articles yet.</p>
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Articles
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

