'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Eye, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useArticleCategories } from '@/lib/hooks/useArticleCategories';

const ArticlesSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Fetch categories using shared hook
  const { categories } = useArticleCategories({ enabled: true });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=100');
      const result = await response.json();
      if (result.success) {
        const sorted = [...(result.data || [])]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setArticles(sorted);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ensure only latest 7 overall, then group those for display
  const latestSeven = [...articles]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 7);

  // Map latest by category
  const latestByCategory = latestSeven.reduce((acc, article) => {
    const category = article.category || 'uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(article);
    return acc;
  }, {});

  // Display ALL categories that have content, in 3-column grid
  const allCategories = (Array.isArray(categories) ? categories : [])
    .map((cat) => ({
      category: cat.slug,
      name: cat.name,
      color: cat.color,
      // Show more articles on desktop (6) vs mobile (3)
      articles: articles.filter(a => a.category === cat.slug).slice(0, 6),
      totalCount: articles.filter(a => a.category === cat.slug).length,
    }))
    .filter(cat => cat.totalCount > 0); // Only show categories with content

  const filteredArticles = latestSeven.filter(article => 
    !selectedCategory || article.category === selectedCategory
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (categorySlug) => {
    if (!categories || !Array.isArray(categories)) return '#3B82F6';
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.color || '#3B82F6';
  };

  const getCategoryName = (categorySlug) => {
    if (!categories || !Array.isArray(categories)) return categorySlug;
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.name || categorySlug;
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="w-full">
        {/* Header */}
        <div className="mb-12 pb-8 border-b border-neutral-200">
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Latest Updates
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Stay updated with the latest insights, tips, and strategies for your exam preparation.
          </p>
        </div>

        {/* Articles Display - 3 Categories Layout */}
        {/* Desktop: Grid layout with 3 categories */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-3 gap-8">
            {allCategories.map((categoryData, categoryIndex) => (
              <div key={categoryData.category} className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl p-6 border border-neutral-200 hover:border-neutral-300 transition-all duration-300 hover:shadow-lg">
                {/* Category Header */}
                <div className="mb-6 pb-4 border-b border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: categoryData.color || getCategoryColor(categoryData.category) }}
                      ></div>
                      <h2 className="text-xl font-semibold text-neutral-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                        {categoryData.name || getCategoryName(categoryData.category)}
                      </h2>
                    </div>
                    <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                      {categoryData.totalCount}
                    </span>
                  </div>
                </div>

                {/* Articles List */}
                <div className="space-y-3">
                  {categoryData.articles.length === 0 ? (
                    <div className="text-sm text-neutral-500 py-6 text-center">
                      <p className="mb-3">No articles in this category yet.</p>
                      <Link
                        href={`/article/${categoryData.category}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                      >
                        View all
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* First article - featured with image */}
                      {categoryData.articles[0] && (
                        <Link
                          key={categoryData.articles[0].id}
                          href={`/articles/${categoryData.articles[0].slug}`}
                          className="block group"
                        >
                          {categoryData.articles[0].featured_image_url && (
                            <div className="aspect-video overflow-hidden rounded-lg mb-3 border border-neutral-200">
                              <img
                                src={categoryData.articles[0].featured_image_url}
                                alt={categoryData.articles[0].title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <h3 className="text-base font-semibold text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors line-clamp-2 leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                            {categoryData.articles[0].title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(categoryData.articles[0].created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {categoryData.articles[0].view_count || 0}
                            </div>
                            {categoryData.articles[0].is_featured && (
                              <span className="text-xs font-medium text-amber-600">
                                Featured
                              </span>
                            )}
                          </div>
                        </Link>
                      )}
                      
                      {/* Remaining articles - compact list */}
                      {categoryData.articles.slice(1, 4).map((article, index) => (
                        <Link
                          key={article.id}
                          href={`/articles/${article.slug}`}
                          className="block py-2.5 rounded-lg hover:bg-white transition-colors group border border-transparent hover:border-neutral-200"
                        >
                          <h3 className="text-sm font-medium text-neutral-900 mb-1.5 group-hover:text-neutral-700 transition-colors line-clamp-2 leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span>{formatDate(article.created_at)}</span>
                            <span>•</span>
                            <span>{article.view_count || 0} views</span>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                </div>

                {/* View All Link */}
                {categoryData.totalCount > 0 && (
                  <div className="mt-6 pt-4 border-t border-neutral-200">
                    <Link
                      href={`/article/${categoryData.category}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors group"
                    >
                      View all {categoryData.name || getCategoryName(categoryData.category)} articles
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Vertical layout with cards */}
        <div className="lg:hidden space-y-6">
          {allCategories.map((categoryData, categoryIndex) => (
            <div key={categoryData.category} className="bg-gradient-to-br from-white to-neutral-50 rounded-xl p-5 border border-neutral-200">
              {/* Category Header */}
              <div className="mb-5 pb-4 border-b border-neutral-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryData.color || getCategoryColor(categoryData.category) }}
                    ></div>
                    <h2 className="text-lg font-semibold text-neutral-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                      {categoryData.name || getCategoryName(categoryData.category)}
                    </h2>
                  </div>
                  <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                    {categoryData.totalCount}
                  </span>
                </div>
              </div>

              {/* Articles List - Mobile */}
              <div className="space-y-3">
                {categoryData.articles.length === 0 ? (
                  <div className="text-sm text-neutral-500 py-6 text-center">
                    <p className="mb-3">No articles in this category yet.</p>
                      <Link
                        href={`/article/${categoryData.category}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                      >
                        View all
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                  </div>
                ) : (
                  <>
                    {/* First article - featured */}
                    {categoryData.articles[0] && (
                      <Link
                        key={categoryData.articles[0].id}
                        href={`/articles/${categoryData.articles[0].slug}`}
                        className="block group"
                      >
                        {categoryData.articles[0].featured_image_url && (
                          <div className="aspect-video overflow-hidden rounded-lg mb-3 border border-neutral-200">
                            <img
                              src={categoryData.articles[0].featured_image_url}
                              alt={categoryData.articles[0].title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="text-base font-semibold text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors line-clamp-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                          {categoryData.articles[0].title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-neutral-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(categoryData.articles[0].created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {categoryData.articles[0].view_count || 0}
                          </div>
                        </div>
                      </Link>
                    )}
                    
                    {/* Remaining articles */}
                    {categoryData.articles.slice(1, 3).map((article, index) => (
                      <Link
                        key={article.id}
                        href={`/articles/${article.slug}`}
                        className="block py-2.5 rounded-lg hover:bg-white transition-colors group"
                      >
                        <h3 className="text-sm font-medium text-neutral-900 mb-1.5 group-hover:text-neutral-700 transition-colors line-clamp-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span>{formatDate(article.created_at)}</span>
                          <span>•</span>
                          <span>{article.view_count || 0} views</span>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>

              {/* View All Link */}
              {categoryData.totalCount > 0 && (
                <div className="mt-5 pt-4 border-t border-neutral-200">
                  <Link
                    href={`/article/${categoryData.category}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors group"
                  >
                    View all {categoryData.name || getCategoryName(categoryData.category)} articles
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default ArticlesSection;
