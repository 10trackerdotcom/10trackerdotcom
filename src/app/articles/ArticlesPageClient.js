'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Tag, 
  Eye, 
  ArrowRight,
  BookOpen,
  Search,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';

const ArticlesPageClient = () => {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
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
      const response = await fetch('/api/articles?limit=50');
      const result = await response.json();
      if (result.success) {
        setArticles(result.data);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            {selectedCategory ? `${getCategoryName(selectedCategory)} Articles` : 'Articles & Insights'}
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            {selectedCategory 
              ? `Explore all articles in the ${getCategoryName(selectedCategory)} category. Find the latest updates, tips, and insights.`
              : 'Discover expert tips, strategies, and insights to enhance your exam preparation journey. Get the latest articles on CAT, GATE, UPSC, JEE, NEET and other competitive exams.'
            }
          </p>
          {selectedCategory && (
            <div className="mt-4">
              <span 
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full"
                style={{ 
                  backgroundColor: getCategoryColor(selectedCategory) + '20',
                  color: getCategoryColor(selectedCategory)
                }}
              >
                <Tag className="w-4 h-4 mr-2" />
                {getCategoryName(selectedCategory)}
              </span>
            </div>
          )}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-xl border border-neutral-200 p-6 mb-8 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-800 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-viewed">Most Viewed</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-neutral-600">
            Showing {sortedArticles.length} of {articles.length} articles
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory && ` in ${getCategoryName(selectedCategory)}`}
          </p>
        </motion.div>

        {/* Articles Grid */}
        {sortedArticles.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {sortedArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-neutral-300 transition-all duration-200 group"
              >
                {article.featured_image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={article.featured_image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full"
                      style={{ 
                        backgroundColor: getCategoryColor(article.category) + '20',
                        color: getCategoryColor(article.category)
                      }}
                    >
                      {getCategoryName(article.category)}
                    </span>
                    {article.is_featured && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-neutral-700 transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-3">
                    {article.excerpt || article.content.substring(0, 100)}...
                  </p>

                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {article.view_count || 0} views
                    </div>
                  </div>

                  <a
                    href={`/articles/${article.slug}`}
                    className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium text-neutral-800 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-12"
          >
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
                className="px-6 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPageClient;
