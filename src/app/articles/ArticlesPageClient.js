'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Eye, 
  ArrowRight,
  BookOpen,
  Search
} from 'lucide-react';

const ArticlesPageClient = () => {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  // Handle URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=100');
      const result = await response.json();
      if (result.success) {
        const sorted = [...(result.data || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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

  const getCategoryColor = (categorySlug) => {
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.color || '#3B82F6';
  };

  const getCategoryName = (categorySlug) => {
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.name || categorySlug;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'most-viewed':
        return (b.view_count || 0) - (a.view_count || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-24">
        {/* Header */}
        <div className="mb-16 pb-8 border-b border-neutral-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                {selectedCategory ? getCategoryName(selectedCategory) : 'Articles'}
              </h1>
              <p className="text-lg text-neutral-600 max-w-2xl" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                {selectedCategory 
                  ? `Explore all articles in the ${getCategoryName(selectedCategory)} category.`
                  : 'Latest insights, tips, and strategies for your exam preparation.'
                }
              </p>
            </div>
            {selectedCategory && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getCategoryColor(selectedCategory) }}
                ></div>
                <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                  {sortedArticles.length} articles
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-neutral-900 placeholder-neutral-400 bg-white"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-neutral-800 bg-white"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="lg:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-neutral-800 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-viewed">Most Viewed</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4">
            <p className="text-sm text-neutral-500">
              {sortedArticles.length} {sortedArticles.length === 1 ? 'article' : 'articles'}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
        </div>

        {/* Articles Grid - Highly Populated Desktop */}
        {sortedArticles.length > 0 ? (
          <>
            {/* Desktop: 3-column grid */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
              {sortedArticles.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="block border-b border-neutral-200 pb-8 hover:opacity-80 transition-opacity group"
                >
                  {article.featured_image_url && (
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-48 object-cover rounded mb-4 border border-neutral-200"
                    />
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getCategoryColor(article.category) }}
                    ></div>
                    <span className="text-xs font-medium text-neutral-600">
                      {getCategoryName(article.category)}
                    </span>
                    {article.is_featured && (
                      <span className="text-xs font-medium text-amber-600">
                        • Featured
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-neutral-900 mb-3 line-clamp-2 group-hover:text-neutral-700 transition-colors leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                    {article.title}
                  </h3>
                  
                  {article.excerpt && (
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(article.created_at)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {article.view_count || 0} views
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile: 1-column list */}
            <div className="lg:hidden space-y-8">
              {sortedArticles.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="block border-b border-neutral-200 pb-8 hover:opacity-80 transition-opacity group"
                >
                  <div className="flex items-start gap-4">
                    {article.featured_image_url && (
                      <img
                        src={article.featured_image_url}
                        alt={article.title}
                        className="w-24 h-24 object-cover rounded flex-shrink-0 border border-neutral-200"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getCategoryColor(article.category) }}
                        ></div>
                        <span className="text-xs font-medium text-neutral-600">
                          {getCategoryName(article.category)}
                        </span>
                        {article.is_featured && (
                          <span className="text-xs font-medium text-amber-600">
                            • Featured
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-neutral-700 transition-colors leading-snug" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>{formatDate(article.created_at)}</span>
                        <span>•</span>
                        <span>{article.view_count || 0} views</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No articles found</h3>
            <p className="text-neutral-600 mb-6">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No articles are available at the moment.'}
            </p>
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                className="px-6 py-3 border border-neutral-300 text-neutral-800 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPageClient;
