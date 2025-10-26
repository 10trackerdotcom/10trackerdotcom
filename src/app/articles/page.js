import React from 'react';
import ArticlesPageClient from './ArticlesPageClient';

export const metadata = {
  title: 'Articles & Insights - Exam Preparation Tips',
  description: 'Discover expert tips, strategies, and insights to enhance your exam preparation journey. Get the latest articles on CAT, GATE, UPSC, JEE, NEET and other competitive exams.',
  keywords: [
    'exam preparation tips',
    'CAT preparation articles',
    'GATE exam strategies',
    'UPSC preparation guides',
    'JEE study tips',
    'NEET preparation articles',
    'competitive exam insights',
    'study strategies',
    'exam success tips'
  ],
  openGraph: {
    title: 'Articles & Insights - Exam Preparation Tips',
    description: 'Discover expert tips, strategies, and insights to enhance your exam preparation journey.',
    type: 'website',
    url: '/articles',
    images: [
      {
        url: '/og-articles.jpg',
        width: 1200,
        height: 630,
        alt: 'Articles & Insights - Exam Preparation Tips',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles & Insights - Exam Preparation Tips',
    description: 'Discover expert tips, strategies, and insights to enhance your exam preparation journey.',
    images: ['/og-articles.jpg'],
  },
};

export default function ArticlesPage() {
  return <ArticlesPageClient />;
}