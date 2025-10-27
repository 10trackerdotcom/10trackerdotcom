import React, { Suspense } from 'react';
import ArticlesPageClient from './ArticlesPageClient';

export async function generateMetadata({ searchParams }) {
  const category = searchParams?.category;
  
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

  const getCategoryDescription = (categorySlug) => {
    const descriptions = {
      'latest-jobs': 'Find the latest job opportunities, recruitment notifications, and career updates for government and private sector positions.',
      'exam-results': 'Check exam results, scorecards, and merit lists for various competitive exams and entrance tests.',
      'answer-key': 'Download answer keys, solutions, and explanations for recent exams and competitive tests.',
      'admit-cards': 'Get your admit cards, hall tickets, and exam notifications for upcoming examinations.',
      'news': 'Stay updated with the latest news, announcements, and updates related to exams and education.'
    };
    return descriptions[categorySlug] || `Explore all articles in the ${getCategoryName(categorySlug)} category.`;
  };

  const title = category ? `${getCategoryName(category)} Articles - 10tracker` : 'Articles & Insights - Exam Preparation Tips | 10tracker';
  const description = category ? getCategoryDescription(category) : 'Discover expert tips, strategies, and insights to enhance your exam preparation journey. Get the latest articles on CAT, GATE, UPSC, JEE, NEET and other competitive exams.';
  const url = category ? `/articles?category=${category}` : '/articles';

  return {
    title,
    description,
    keywords: [
      'exam preparation tips',
      'CAT preparation articles',
      'GATE exam strategies',
      'UPSC preparation guides',
      'JEE study tips',
      'NEET preparation articles',
      'competitive exam insights',
      'study strategies',
      'exam success tips',
      ...(category ? [getCategoryName(category).toLowerCase(), `${getCategoryName(category)} articles`] : [])
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url,
      images: [
        {
          url: '/og-articles.jpg',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-articles.jpg'],
    },
  };
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading articles...</p>
        </div>
      </div>
    }>
      <ArticlesPageClient />
    </Suspense>
  );
}