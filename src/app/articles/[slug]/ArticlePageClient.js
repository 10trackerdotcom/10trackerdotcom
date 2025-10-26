'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Tag, 
  Eye, 
  ArrowLeft,
  Share2,
  BookOpen,
  Clock,
  User
} from 'lucide-react';
import Link from 'next/link';
import { trackContentEvent, trackSocialShare } from '@/lib/analytics';

const ArticlePageClient = ({ article, relatedArticles }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (categorySlug) => {
    const colors = {
      'categories': '#3B82F6',
      'latest-jobs': '#10B981',
      'exam-results': '#F59E0B',
      'answer-key': '#EF4444',
      'admit-cards': '#8B5CF6',
      'news': '#6B7280'
    };
    return colors[categorySlug] || '#3B82F6';
  };

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

  const shareArticle = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
        // Track social share
        trackSocialShare('native_share', 'article', article.id);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
      // Track clipboard share
      trackSocialShare('clipboard', 'article', article.id);
    }
  };

  // Track article view on client side
  React.useEffect(() => {
    if (article) {
      trackContentEvent('viewed', 'article', article.id);
    }
  }, [article]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.excerpt || article.content.substring(0, 160),
            "image": article.featured_image_url ? 
              (article.featured_image_url.startsWith('http') 
                ? article.featured_image_url 
                : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com'}${article.featured_image_url}`) 
              : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com'}/og-image.jpg`,
            "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com'}/articles/${article.slug}`,
            "datePublished": article.created_at,
            "dateModified": article.updated_at || article.created_at,
            "author": {
              "@type": "Person",
              "name": "10tracker Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": "10tracker",
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com'}/10tracker.png`
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://10tracker.com'}/articles/${article.slug}`
            },
            "articleSection": getCategoryName(article.category),
            "keywords": (article.tags || []).join(', '),
            "wordCount": article.content.length,
            "timeRequired": `PT${Math.ceil(article.content.length / 500)}M`
          })
        }}
      />
      
      <style jsx global>{`
        .article-content {
          line-height: 1.6;
          font-size: 1rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
        }
        .article-content p {
          margin: 1rem 0;
          color: #3c4043;
          line-height: 1.6;
        }
        .article-content h1 {
          font-size: 2rem;
          font-weight: 400;
          color: #202124;
          margin: 2rem 0 1rem 0;
          line-height: 1.25;
          border-bottom: 1px solid #dadce0;
          padding-bottom: 0.5rem;
        }
        .article-content h2 {
          font-size: 1.5rem;
          font-weight: 400;
          color: #202124;
          margin: 1.5rem 0 0.75rem 0;
          line-height: 1.3;
        }
        .article-content h3 {
          font-size: 1.25rem;
          font-weight: 500;
          color: #202124;
          margin: 1.25rem 0 0.5rem 0;
          line-height: 1.4;
        }
        .article-content h4 {
          font-size: 1.125rem;
          font-weight: 500;
          color: #202124;
          margin: 1rem 0 0.5rem 0;
          line-height: 1.4;
        }
        .article-content ul, .article-content ol {
          padding-left: 1.5rem;
          margin: 1rem 0;
          color: #3c4043;
        }
        .article-content ul li {
          list-style-type: disc;
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .article-content ol li {
          list-style-type: decimal;
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .article-content ul li::marker, .article-content ol li::marker {
          color: #5f6368;
        }
        .article-content ul ul, .article-content ol ol, .article-content ul ol, .article-content ol ul {
          margin: 0.25rem 0;
        }
        .article-content table {
          border-collapse: collapse;
          margin: 1.5rem 0;
          width: 100%;
          border: 1px solid #dadce0;
          border-radius: 8px;
          overflow: hidden;
        }
        .article-content table td, .article-content table th {
          border: 1px solid #dadce0;
          padding: 0.75rem;
          text-align: left;
        }
        .article-content table th {
          background-color: #f8f9fa;
          font-weight: 500;
          color: #202124;
        }
        .article-content table td {
          color: #3c4043;
        }
        .article-content table tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        .article-content ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .article-content ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          margin: 0.5rem 0;
        }
        .article-content ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-right: 0.5rem;
          user-select: none;
          cursor: pointer;
        }
        .article-content ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
          color: #3c4043;
          line-height: 1.6;
        }
        .article-content blockquote {
          border-left: 3px solid #1a73e8;
          padding: 1rem;
          margin: 1.5rem 0;
          font-style: normal;
          color: #3c4043;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        .article-content code {
          background-color: #f1f3f4;
          padding: 0.125rem 0.25rem;
          border-radius: 3px;
          font-family: 'Roboto Mono', 'Monaco', monospace;
          color: #202124;
          font-size: 0.875rem;
        }
        .article-content pre {
          background-color: #f8f9fa;
          color: #202124;
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5rem 0;
          border: 1px solid #dadce0;
        }
        .article-content pre code {
          background: none;
          padding: 0;
          color: #202124;
          border: none;
          font-size: 0.875rem;
        }
        .article-content a {
          color: #1a73e8;
          text-decoration: none;
          font-weight: 400;
        }
        .article-content a:hover {
          color: #1557b0;
          text-decoration: underline;
        }
        .article-content strong {
          color: #202124;
          font-weight: 500;
        }
        .article-content em {
          font-style: italic;
          color: #3c4043;
        }
        .article-content u {
          text-decoration: underline;
        }
        .article-content s {
          text-decoration: line-through;
          color: #5f6368;
        }
        .article-content mark {
          background-color: #fef7e0;
          padding: 0.125rem 0.25rem;
          border-radius: 3px;
          color: #b06000;
        }
        .article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .article-content hr {
          border: none;
          height: 1px;
          background-color: #dadce0;
          margin: 1.5rem 0;
        }
      `}</style>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto pt-6">
          <div className="flex">
            {/* Sidebar */}
            <div className="hidden lg:block w-64 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto">
              <div className="p-6">
                <div className="mb-6">
                  <Link
                    href="/articles"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Articles
                  </Link>
                </div>
                
                {/* Table of Contents */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">On this page</h3>
                  <nav className="space-y-1">
                    <a href="#overview" className="block text-sm text-gray-600 hover:text-gray-900 py-1">
                      Overview
                    </a>
                    <a href="#details" className="block text-sm text-gray-600 hover:text-gray-900 py-1">
                      Details
                    </a>
                    <a href="#related" className="block text-sm text-gray-600 hover:text-gray-900 py-1">
                      Related Articles
                    </a>
                  </nav>
                </div>

                {/* Category Info */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: getCategoryColor(article.category) + '20',
                        color: getCategoryColor(article.category)
                      }}
                    >
                      {getCategoryName(article.category)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.view_count || 0} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.ceil(article.content.length / 500)} min read
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mobile Back Button */}
                <div className="lg:hidden mb-6">
                  <Link
                    href="/articles"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Articles
                  </Link>
                </div>

                {/* Article Header */}
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-8"
                >
                  {/* Featured Image */}
                  {article.featured_image_url && (
                    <div className="aspect-video overflow-hidden rounded-lg mb-6">
                      <img
                        src={article.featured_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="flex items-center gap-4 mb-4">
                    <span 
                      className="px-3 py-1 text-sm font-medium rounded-full"
                      style={{ 
                        backgroundColor: getCategoryColor(article.category) + '20',
                        color: getCategoryColor(article.category)
                      }}
                    >
                      {getCategoryName(article.category)}
                    </span>
                    {article.is_featured && (
                      <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl font-normal text-gray-900 mb-4 leading-tight">
                    {article.title}
                  </h1>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Article Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-8 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(article.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {article.view_count || 0} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {Math.ceil(article.content.length / 500)} min read
                      </div>
                    </div>
                    <button
                      onClick={shareArticle}
                      className="flex items-center gap-1 px-3 py-1 text-gray-600 hover:text-gray-900 transition-colors duration-200"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>

                  {/* Article Content */}
                  <div 
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                  />

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.article>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-16"
                    id="related"
                  >
                    <h2 className="text-xl font-medium text-gray-900 mb-6">Related Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {relatedArticles.slice(0, 3).map((relatedArticle, index) => (
                        <motion.article
                          key={relatedArticle.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                          whileHover={{ y: -2, transition: { duration: 0.2 } }}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-all duration-200 group"
                        >
                          {relatedArticle.featured_image_url && (
                            <div className="aspect-video overflow-hidden">
                              <img
                                src={relatedArticle.featured_image_url}
                                alt={relatedArticle.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          
                          <div className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span 
                                className="px-2 py-1 text-xs font-medium rounded-full"
                                style={{ 
                                  backgroundColor: getCategoryColor(relatedArticle.category) + '20',
                                  color: getCategoryColor(relatedArticle.category)
                                }}
                              >
                                {getCategoryName(relatedArticle.category)}
                              </span>
                            </div>

                            <h3 className="text-base font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
                              {relatedArticle.title}
                            </h3>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {relatedArticle.excerpt || relatedArticle.content.substring(0, 100)}...
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(relatedArticle.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {relatedArticle.view_count || 0}
                              </div>
                            </div>

                            <Link
                              href={`/articles/${relatedArticle.slug}`}
                              className="inline-flex items-center gap-1 w-full justify-center px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                            >
                              Read Article
                            </Link>
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  </motion.section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArticlePageClient;
