'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Tag, 
  Eye, 
  ArrowLeft,
  ArrowRight,
  Share2,
  BookOpen,
  Clock,
  User
} from 'lucide-react';
import Link from 'next/link';
import { trackContentEvent, trackSocialShare } from '@/lib/analytics';
import SocialMediaEmbed from '@/components/SocialMediaEmbed';

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

  // Load Instagram embed script globally if there are Instagram embeds
  React.useEffect(() => {
    const hasInstagramEmbeds = article.social_media_embeds?.some(
      embed => embed.type === 'instagram' || embed.type === 'reel'
    );

    if (hasInstagramEmbeds) {
      // Check if script already exists
      if (!document.querySelector('script[src="https://www.instagram.com/embed.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = () => {
          // Process all Instagram embeds after script loads
          if (window.instgrm) {
            window.instgrm.Embeds.process();
          }
        };
        document.body.appendChild(script);
      } else if (window.instgrm) {
        // Script already loaded, just process embeds
        window.instgrm.Embeds.process();
      }
    }
  }, [article.social_media_embeds]);

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
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <div className="max-w-7xl mx-auto pt-6">
          <div className="flex">
            {/* Sidebar */}
            <div className="hidden lg:block w-72 bg-white border-r border-neutral-200 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="p-6">
                <div className="mb-6">
                  <Link
                    href={`/article/${article.category}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors duration-200 group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to {getCategoryName(article.category)}
                  </Link>
                </div>
                
                {/* Category Info Card */}
                <div className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-4 border border-neutral-200 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span 
                      className="px-3 py-1.5 text-xs font-semibold rounded-full"
                      style={{ 
                        backgroundColor: getCategoryColor(article.category) + '20',
                        color: getCategoryColor(article.category)
                      }}
                    >
                      {getCategoryName(article.category)}
                    </span>
                  </div>
                  <div className="space-y-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium">{formatDate(article.created_at)}</span>
                    </div>
                     
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium">{Math.ceil(article.content.length / 500)} min read</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium">{article.view_count || 0} views</span>
                    </div>
                  </div>
                </div>

                {/* Table of Contents */}
                <div className="bg-white rounded-xl p-4 border border-neutral-200">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">On this page</h3>
                  <nav className="space-y-1.5">
                    <a href="#overview" className="block text-sm text-neutral-600 hover:text-neutral-900 py-1.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors">
                      Overview
                    </a>
                    <a href="#details" className="block text-sm text-neutral-600 hover:text-neutral-900 py-1.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors">
                      Details
                    </a>
                    <a href="#related" className="block text-sm text-neutral-600 hover:text-neutral-900 py-1.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors">
                      Related Articles
                    </a>
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
                {/* Mobile Back Button */}
                <div className="lg:hidden mb-6">
                  <Link
                    href={`/article/${article.category}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors duration-200 group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to {getCategoryName(article.category)}
                  </Link>
                </div>

                {/* Article Header */}
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-12"
                >
                  {/* Featured Image */}
                  {article.featured_image_url && (
                    <div className="aspect-video overflow-hidden rounded-2xl mb-8 border border-neutral-200 shadow-sm">
                      <img
                        src={article.featured_image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Meta Information */}
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <span 
                      className="px-3 py-1.5 text-sm font-semibold rounded-full"
                      style={{ 
                        backgroundColor: getCategoryColor(article.category) + '20',
                        color: getCategoryColor(article.category)
                      }}
                    >
                      {getCategoryName(article.category)}
                    </span>
                    {article.is_featured && (
                      <span className="px-3 py-1.5 text-sm font-semibold bg-gradient-to-r from-amber-100 to-amber-50 text-amber-800 rounded-full border border-amber-200">
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl lg:text-5xl font-semibold text-neutral-900 mb-6 leading-tight tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                    {article.title}
                  </h1>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-xl text-neutral-600 mb-8 leading-relaxed" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                      {article.excerpt}
                    </p>
                  )}

                  {/* Article Meta */}
                  <div className="flex items-center justify-between text-sm text-neutral-600 mb-10 pb-8 border-b border-neutral-200">
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium">{formatDate(article.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium">{Math.ceil(article.content.length / 500)} min read</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-neutral-400" />
                        <span className="font-medium">{article.view_count || 0} views</span>
                      </div>
                    </div>
                    <button
                      onClick={shareArticle}
                      className="flex items-center gap-2 px-4 py-2 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all duration-200 font-medium"
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

                  {/* Social Media Embeds */}
                  {(() => {
                    // Debug: Always log to see what we're getting
                    console.log('🔍 Full Article Object:', article);
                    console.log('🔍 Social Media Embeds Field:', {
                      value: article.social_media_embeds,
                      type: typeof article.social_media_embeds,
                      isArray: Array.isArray(article.social_media_embeds),
                      isNull: article.social_media_embeds === null,
                      isUndefined: article.social_media_embeds === undefined,
                      length: article.social_media_embeds?.length,
                      stringified: JSON.stringify(article.social_media_embeds)
                    });
                    
                    // Handle different data formats
                    let embeds = article.social_media_embeds;
                    
                    // If it's a string, try to parse it
                    if (typeof embeds === 'string') {
                      try {
                        embeds = JSON.parse(embeds);
                        console.log('📝 Parsed string to JSON:', embeds);
                      } catch (e) {
                        console.error('❌ Failed to parse embeds string:', e);
                        embeds = [];
                      }
                    }
                    
                    // If it's null or undefined, set to empty array
                    if (embeds === null || embeds === undefined) {
                      console.log('⚠️ Embeds is null/undefined, setting to empty array');
                      embeds = [];
                    }
                    
                    // Ensure it's an array
                    if (!Array.isArray(embeds)) {
                      console.log('⚠️ Embeds is not an array, converting:', embeds);
                      embeds = [];
                    }
                    
                    // Check if embeds exist and have content
                    const hasEmbeds = embeds && Array.isArray(embeds) && embeds.length > 0;
                    
                    if (!hasEmbeds) {
                      console.log('ℹ️ No embeds to display - array is empty');
                      // Don't show anything if no embeds - clean UI
                      return null;
                    }
                    
                    console.log('✅ Rendering embeds:', embeds);
                    
                    return (
                      <div className="mt-10 pt-8 border-t border-neutral-200">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-6">Social Media Content</h3>
                        <div className="space-y-6">
                          {embeds.map((embed, index) => {
                            console.log(`📦 Rendering embed ${index}:`, embed);
                            if (!embed || typeof embed !== 'object') {
                              console.warn(`⚠️ Invalid embed at index ${index}:`, embed);
                              return null;
                            }
                            return (
                              <SocialMediaEmbed key={index} embed={embed} />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="mt-10 pt-8 border-t border-neutral-200">
                      <h3 className="text-sm font-semibold text-neutral-900 mb-4 uppercase tracking-wider">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {article.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 text-sm font-medium bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors cursor-default"
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
                    <div className="mb-8 pb-4 border-b border-neutral-200">
                      <h2 className="text-2xl font-semibold text-neutral-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                        Related Articles
                      </h2>
                      <p className="text-sm text-neutral-600 mt-2">Continue reading more articles</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {relatedArticles.slice(0, 3).map((relatedArticle, index) => (
                        <motion.article
                          key={relatedArticle.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                          whileHover={{ y: -4, transition: { duration: 0.2 } }}
                          className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-neutral-300 hover:shadow-lg transition-all duration-300 group"
                        >
                          {relatedArticle.featured_image_url && (
                            <div className="aspect-video overflow-hidden">
                              <img
                                src={relatedArticle.featured_image_url}
                                alt={relatedArticle.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          )}
                          
                          <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <span 
                                className="px-2.5 py-1 text-xs font-semibold rounded-full"
                                style={{ 
                                  backgroundColor: getCategoryColor(relatedArticle.category) + '20',
                                  color: getCategoryColor(relatedArticle.category)
                                }}
                              >
                                {getCategoryName(relatedArticle.category)}
                              </span>
                            </div>

                            <h3 className="text-base font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-neutral-700 transition-colors leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                              {relatedArticle.title}
                            </h3>
                            
                            {relatedArticle.excerpt && (
                              <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                                {relatedArticle.excerpt}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(relatedArticle.created_at)}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5" />
                                {relatedArticle.view_count || 0}
                              </div>
                            </div>

                            <Link
                              href={`/articles/${relatedArticle.slug}`}
                              className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 group/link"
                            >
                              Read Article
                              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
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
