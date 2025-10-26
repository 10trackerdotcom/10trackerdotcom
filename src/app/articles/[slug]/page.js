import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ArticlePageClient from './ArticlePageClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Generate static paths for all articles
export async function generateStaticParams() {
  try {
    const { data: articles, error } = await supabase
      .from('published_articles')
      .select('slug')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching articles for static generation:', error);
      return [];
    }

    return articles?.map((article) => ({
      slug: article.slug,
    })) || [];
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

// Fetch article data on the server
export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  try {
    const { data: article, error } = await supabase
      .from('published_articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !article) {
      return {
        title: 'Article Not Found | 10tracker',
        description: 'The article you are looking for could not be found.',
      };
    }

  const getCategoryName = (categorySlug) => {
    const names = {
      'categories': 'Categories',
      'latest-jobs': 'Latest Jobs',
      'exam-results': 'Exam Results',
      'answer-key': 'Answer Key',
      'admit-cards': 'Admit Cards',
      'news': 'News'
    };
    return names[categorySlug] || categorySlug;
  };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com';
    const fullUrl = `${siteUrl}/articles/${article.slug}`;
    const fullImage = article.featured_image_url 
      ? (article.featured_image_url.startsWith('http') 
          ? article.featured_image_url 
          : `${siteUrl}${article.featured_image_url}`)
      : `${siteUrl}/og-image.jpg`;

    return {
      title: `${article.title} | 10tracker`,
      description: article.excerpt || article.content.substring(0, 160),
      keywords: [
        'exam preparation',
        'CAT exam',
        'GATE exam',
        'UPSC preparation',
        'JEE preparation',
        'NEET preparation',
        'competitive exams',
        ...(article.tags || [])
      ],
      authors: [{ name: '10tracker Team' }],
      creator: '10tracker',
      publisher: '10tracker',
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: fullUrl,
      },
      openGraph: {
        type: 'article',
        locale: 'en_US',
        url: fullUrl,
        title: article.title,
        description: article.excerpt || article.content.substring(0, 160),
        siteName: '10tracker',
        images: [
          {
            url: fullImage,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
        publishedTime: article.created_at,
        modifiedTime: article.updated_at || article.created_at,
        authors: ['10tracker Team'],
        section: getCategoryName(article.category),
        tags: article.tags || [],
      },
      twitter: {
        card: 'summary_large_image',
          title: article.title,
        description: article.excerpt || article.content.substring(0, 160),
        images: [fullImage],
        creator: '@10tracker',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      other: {
        'article:reading_time': Math.ceil(article.content.length / 500).toString(),
        'article:view_count': (article.view_count || 0).toString(),
      },
    };
      } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Article Not Found | 10tracker',
      description: 'The article you are looking for could not be found.',
    };
  }
}

// Server component that fetches data
export default async function ArticlePage({ params }) {
  const { slug } = await params;
  
  try {
    // Fetch the main article
    const { data: article, error: articleError } = await supabase
      .from('published_articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (articleError || !article) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Article Not Found</h1>
            <p className="text-neutral-600 mb-6">The article you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Articles
            </Link>
          </div>
      </div>
    );
  }

    // Fetch related articles
    const { data: relatedArticles, error: relatedError } = await supabase
      .from('published_articles')
      .select('*')
      .neq('id', article.id)
      .eq('category', article.category)
      .order('created_at', { ascending: false })
      .limit(3);

    // If no related articles in same category, get recent articles
    let finalRelatedArticles = relatedArticles || [];
    if (finalRelatedArticles.length === 0) {
      const { data: recentArticles } = await supabase
        .from('published_articles')
        .select('*')
        .neq('id', article.id)
        .order('created_at', { ascending: false })
        .limit(3);
      finalRelatedArticles = recentArticles || [];
    }

    // Increment view count (fire and forget)
    supabase
      .from('articles')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', article.id)
      .then(() => {}) // Fire and forget
      .catch(() => {}); // Ignore errors

    return (
      <ArticlePageClient 
        article={article} 
        relatedArticles={finalRelatedArticles}
      />
    );
  } catch (error) {
    console.error('Error fetching article data:', error);
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Error Loading Article</h1>
          <p className="text-neutral-600 mb-6">There was an error loading this article.</p>
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }
}