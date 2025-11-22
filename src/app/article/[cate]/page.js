import React, { Suspense } from 'react';
import CategoryPageClient from './CategoryPageClient';

export async function generateMetadata({ params }) {
  const { cate } = await params;
  
  const getCategoryName = (categorySlug) => {
    const names = {
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

  const title = `${getCategoryName(cate)} - 10tracker`;
  const description = getCategoryDescription(cate);

  return {
    title,
    description,
    keywords: [
      getCategoryName(cate).toLowerCase(),
      `${getCategoryName(cate)} articles`,
      'exam preparation',
      'competitive exams'
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/article/${cate}`,
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

export default function CategoryPage({ params }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading articles...</p>
        </div>
      </div>
    }>
      <CategoryPageClient params={params} />
    </Suspense>
  );
}

