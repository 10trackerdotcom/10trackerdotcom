'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar, 
  Tag, 
  Eye, 
  ArrowRight,
  BookOpen,
  Clock,
  User
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
      const response = await fetch('/api/articles?limit=50');
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
    // Show up to 3 latest items for each category from ALL fetched articles
    articles: articles.filter(a => a.category === cat.slug).slice(0, 3),
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
    <section className="py-16">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-4 tracking-tight" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Latest Updates
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
            Stay updated with the latest insights, tips, and strategies for your exam preparation.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="mb-8"
        >
        </motion.div>

        {/* Articles Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {/* Categories Layout - Desktop */}
          <div className="hidden lg:block">
            <div className={`grid gap-8 ${allCategories.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {allCategories.map((categoryData, categoryIndex) => (
                <motion.div
                  key={categoryData.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
                >
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 px-6 py-4 border-b border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryData.color || getCategoryColor(categoryData.category) }}
                        ></div>
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {categoryData.name || getCategoryName(categoryData.category)}
                        </h3>
                      </div>
                      <span className="text-sm text-neutral-500 bg-white px-2 py-1 rounded-full">
                        {categoryData.totalCount}
                      </span>
                    </div>
                  </div>

                  {/* Articles List - Vertical */}
                  <div className="divide-y divide-neutral-100">
                    {categoryData.articles.length === 0 && (
                      <div className="p-6 text-sm text-neutral-500 flex items-center justify-between">
                        <span>No recent updates</span>
                        <Link
                          href={`/articles?category=${categoryData.category}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-white transition-colors duration-200"
                        >
                          View all
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                    {categoryData.articles.length > 0 && categoryData.articles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: (categoryIndex * 0.1) + (index * 0.05) }}
                        className="p-4 hover:bg-neutral-50 transition-colors duration-200 group"
                      >
                        <div className="flex items-start gap-3">
                          {article.featured_image_url && (
                            <img
                              src={article.featured_image_url}
                              alt={article.title}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-2 group-hover:text-neutral-700 transition-colors" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                              {article.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-neutral-500 mb-2">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(article.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {article.view_count || 0}
                              </div>
                            </div>
                            {article.is_featured && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/articles/${article.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
                          >
                            Read More
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* View All Button for Category */}
                  <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
                    <Link
                      href={`/articles?category=${categoryData.category}`}
                      className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-white transition-colors duration-200"
                    >
                      View All {categoryData.name || getCategoryName(categoryData.category)} Articles
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile Categories Layout */}
          <div className="lg:hidden">
            <div className="space-y-6">
              {allCategories.map((categoryData, categoryIndex) => (
                <motion.div
                  key={categoryData.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm"
                >
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 px-4 py-3 border-b border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: categoryData.color || getCategoryColor(categoryData.category) }}
                        ></div>
                        <h3 className="text-base font-semibold text-neutral-900">
                          {categoryData.name || getCategoryName(categoryData.category)}
                        </h3>
                      </div>
                      <span className="text-xs text-neutral-500 bg-white px-2 py-1 rounded-full">
                        {categoryData.totalCount}
                      </span>
                    </div>
                  </div>

                  {/* Articles List - Vertical */}
                  <div className="divide-y divide-neutral-100">
                    {categoryData.articles.length === 0 && (
                      <div className="p-4 text-sm text-neutral-500 flex items-center justify-between">
                        <span>No recent updates</span>
                        <Link
                          href={`/articles?category=${categoryData.category}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-white transition-colors duration-200"
                        >
                          View all
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                    {categoryData.articles.length > 0 && categoryData.articles.map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: (categoryIndex * 0.1) + (index * 0.05) }}
                        className="p-3 hover:bg-neutral-50 transition-colors duration-200 group"
                      >
                        <div className="flex items-start gap-3">
                          {article.featured_image_url && (
                            <img
                              src={article.featured_image_url}
                              alt={article.title}
                              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-2 group-hover:text-neutral-700 transition-colors" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                              {article.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(article.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {article.view_count || 0}
                              </div>
                            </div>
                            {article.is_featured && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/articles/${article.slug}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors duration-200"
                          >
                            Read More
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* View All Button for Category */}
                  <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
                    <Link
                      href={`/articles?category=${categoryData.category}`}
                      className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-lg hover:bg-white transition-colors duration-200"
                    >
                      View All {categoryData.name || getCategoryName(categoryData.category)} Articles
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* View All Button */}
        {allCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors duration-200 font-medium"
            >
              <BookOpen className="w-5 h-5" />
              View All Articles
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ArticlesSection;
