'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Eye, 
  ArrowRight,
  BookOpen
} from 'lucide-react';

const ArticlesSection = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchArticles();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/articles/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  // Display ALL categories from API, even if there are 0 recent articles
  const allCategories = (categories || []).map((cat) => ({
    category: cat.slug,
    name: cat.name,
    color: cat.color,
    // Show more articles on desktop (6) vs mobile (3)
    articles: articles.filter(a => a.category === cat.slug).slice(0, 6),
    totalCount: articles.filter(a => a.category === cat.slug).length,
  }));

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
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.color || '#3B82F6';
  };

  const getCategoryName = (categorySlug) => {
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
        <div className="mb-16 pb-8 border-b border-neutral-200">
          <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Articles
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Latest insights, tips, and strategies for your exam preparation.
          </p>
        </div>

        {/* Articles Display - Highly Populated Desktop Layout */}
        {/* Desktop: Grid layout with more content */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-2 gap-12">
            {allCategories.map((categoryData, categoryIndex) => (
              <div key={categoryData.category} className="border-b border-neutral-200 pb-10 last:border-b-0">
                {/* Category Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: categoryData.color || getCategoryColor(categoryData.category) }}
                    ></div>
                    <h2 className="text-xl font-semibold text-neutral-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                      {categoryData.name || getCategoryName(categoryData.category)}
                    </h2>
                    <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                      {categoryData.totalCount}
                    </span>
                  </div>
                </div>

                {/* Articles List - Compact Grid */}
                <div className="space-y-2">
                  {categoryData.articles.length === 0 ? (
                    <div className="text-sm text-neutral-500 py-6">
                      <p className="mb-3">No articles in this category yet.</p>
                      <Link
                        href={`/articles?category=${categoryData.category}`}
                        className="inline-flex items-center gap-1 text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                      >
                        View all
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* First article - larger with image */}
                      {categoryData.articles[0] && (
                        <Link
                          key={categoryData.articles[0].id}
                          href={`/articles/${categoryData.articles[0].slug}`}
                          className="block p-3 -mx-3 rounded-lg hover:bg-neutral-50 transition-colors group border border-transparent hover:border-neutral-200"
                        >
                          <div className="flex items-start gap-3">
                            {categoryData.articles[0].featured_image_url && (
                              <img
                                src={categoryData.articles[0].featured_image_url}
                                alt={categoryData.articles[0].title}
                                className="w-24 h-24 object-cover rounded flex-shrink-0 border border-neutral-200"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors line-clamp-2 leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
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
                            </div>
                          </div>
                        </Link>
                      )}
                      
                      {/* Remaining articles - compact list */}
                      {categoryData.articles.slice(1).map((article, index) => (
                        <Link
                          key={article.id}
                          href={`/articles/${article.slug}`}
                          className="block py-2.5 px-2 -mx-2 rounded hover:bg-neutral-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            {article.featured_image_url && (
                              <img
                                src={article.featured_image_url}
                                alt={article.title}
                                className="w-14 h-14 object-cover rounded flex-shrink-0 border border-neutral-200"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-neutral-900 mb-1 group-hover:text-neutral-700 transition-colors line-clamp-2 leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                                {article.title}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-neutral-500">
                                <span>{formatDate(article.created_at)}</span>
                                <span>•</span>
                                <span>{article.view_count || 0} views</span>
                                {article.is_featured && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-600 font-medium">Featured</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 flex-shrink-0 mt-1 transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                </div>

                {/* View All Link */}
                {categoryData.totalCount > categoryData.articles.length && (
                  <div className="mt-5 pt-5 border-t border-neutral-100">
                    <Link
                      href={`/articles?category=${categoryData.category}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                      View all {categoryData.name || getCategoryName(categoryData.category)} articles
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Vertical layout */}
        <div className="lg:hidden space-y-10">
          {allCategories.map((categoryData, categoryIndex) => (
            <div key={categoryData.category} className="border-b border-neutral-200 pb-10 last:border-b-0">
              {/* Category Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: categoryData.color || getCategoryColor(categoryData.category) }}
                  ></div>
                  <h2 className="text-xl font-semibold text-neutral-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                    {categoryData.name || getCategoryName(categoryData.category)}
                  </h2>
                  <span className="text-sm text-neutral-500">
                    ({categoryData.totalCount})
                  </span>
                </div>
              </div>

              {/* Articles List - Mobile */}
              <div className="space-y-1">
                {categoryData.articles.length === 0 ? (
                  <div className="text-sm text-neutral-500 py-8">
                    <p className="mb-4">No articles in this category yet.</p>
                    <Link
                      href={`/articles?category=${categoryData.category}`}
                      className="inline-flex items-center gap-1 text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
                    >
                      View all
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  categoryData.articles.slice(0, 3).map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="block py-4 px-2 -mx-2 rounded-lg hover:bg-neutral-50 transition-colors group"
                    >
                      <div className="flex items-start gap-4">
                        {article.featured_image_url && (
                          <img
                            src={article.featured_image_url}
                            alt={article.title}
                            className="w-20 h-20 object-cover rounded flex-shrink-0 border border-neutral-200"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors line-clamp-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-neutral-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(article.created_at)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              {article.view_count || 0} views
                            </div>
                            {article.is_featured && (
                              <span className="text-xs font-medium text-amber-600">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 flex-shrink-0 mt-1 transition-colors" />
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* View All Link */}
              {categoryData.totalCount > categoryData.articles.length && (
                <div className="mt-6 pt-6 border-t border-neutral-100">
                  <Link
                    href={`/articles?category=${categoryData.category}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                  >
                    View all {categoryData.name || getCategoryName(categoryData.category)} articles
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Link */}
        {allCategories.length > 0 && (
          <div className="mt-16 pt-8 border-t border-neutral-200">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-base font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              View all articles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ArticlesSection;
