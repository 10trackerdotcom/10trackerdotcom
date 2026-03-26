import { createClient } from '@supabase/supabase-js';
import ArticlesPageClient from './ArticlesPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function generateMetadata() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
  const title = 'Articles | 10tracker';
  const description =
    'Browse all articles, latest updates, exam tips, and preparation strategies on 10tracker.';

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: `${siteUrl}/articles` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}/articles`,
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

export default async function ArticlesPage() {
  let articles = [];
  let categories = [];

  try {
    const { data: a } = await supabase
      .from('published_articles')
      .select('id, slug, title, excerpt, category, created_at, view_count, is_featured')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);

    const { data: c } = await supabase
      .from('article_categories')
      .select('name, slug, color')
      .order('name');

    articles = a || [];
    categories = c || [];
  } catch {
    // empty state
  }

  return <ArticlesPageClient initialArticles={articles} initialCategories={categories} />;
}
