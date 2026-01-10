'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Eye, 
  ArrowRight,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useArticleCategories } from '@/lib/hooks/useArticleCategories';

const ArticlesSection = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // Fetch categories using shared hook
  const { categories } = useArticleCategories({ enabled: true });

  useEffect(() => {
    fetchArticles();
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

  // Group articles by category
  const articlesByCategory = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return {};
    
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat.slug] = {
        category: cat,
        articles: articles.filter(art => art.category === cat.slug).slice(0, 5)
      };
    });
    
    // Also handle uncategorized
    const uncategorized = articles.filter(art => 
      !categories.find(cat => cat.slug === art.category)
    );
    if (uncategorized.length > 0) {
      grouped['uncategorized'] = {
        category: { name: 'Other', slug: 'uncategorized', color: '#6B7280' },
        articles: uncategorized.slice(0, 5)
      };
    }
    
    return grouped;
  }, [articles, categories]);

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

  const toggleCategory = (categorySlug) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categorySlug)) {
        newSet.delete(categorySlug);
      } else {
        newSet.add(categorySlug);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  const categoriesWithArticles = Object.entries(articlesByCategory).filter(
    ([_, data]) => data.articles.length > 0
  );

  if (categoriesWithArticles.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white to-neutral-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-sm mb-4"
          >
            <TrendingUp className="w-4 h-4 text-neutral-700" />
            <span className="text-sm font-medium text-neutral-700">Latest Updates & News</span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
            Stay Informed with Latest Articles
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto font-light">
            Get the latest information, updates, results, and exam preparation tips organized by category
          </p>
        </div>

        {/* Category Sections */}
        <div className="space-y-6 sm:space-y-8">
          {categoriesWithArticles.map(([categorySlug, { category, articles: categoryArticles }], categoryIndex) => {
            const isExpanded = expandedCategories.has(categorySlug);
            const categoryColor = category.color || getCategoryColor(categorySlug);
            
            return (
              <motion.div
                key={categorySlug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: categoryIndex * 0.1 }}
                className="bg-white border border-neutral-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Category Header */}
                <div
                  className="px-4 sm:px-6 py-4 sm:py-5 border-b border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors"
                  onClick={() => toggleCategory(categorySlug)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${categoryColor}20`,
                          color: categoryColor
                        }}
                      >
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
                          {category.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                          {categoryArticles.length} {categoryArticles.length === 1 ? 'article' : 'articles'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/articles?category=${categorySlug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                      >
                        View All
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <ChevronRight
                        className={`w-5 h-5 text-neutral-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Articles - Desktop Table View */}
                <div className="hidden md:block">
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                Title
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                Views
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {categoryArticles.map((article, index) => (
                              <motion.tr
                                key={article.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className="hover:bg-neutral-50 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <Link
                                    href={`/articles/${article.slug}`}
                                    className="group block"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-2">
                                            {article.title}
                                          </span>
                                          {article.is_featured && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex-shrink-0">
                                              Featured
                                            </span>
                                          )}
                                        </div>
                                        {article.excerpt && (
                                          <p className="text-xs text-neutral-500 line-clamp-1">
                                            {article.excerpt}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                                    <Calendar className="w-4 h-4 text-neutral-400" />
                                    {formatDate(article.created_at)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                                    <Eye className="w-4 h-4 text-neutral-400" />
                                    {article.view_count || 0}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Link
                                    href={`/articles/${article.slug}`}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors group"
                                  >
                                    Read
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </Link>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Articles - Mobile Card View */}
                <div className="md:hidden">
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="divide-y divide-neutral-200"
                    >
                      {categoryArticles.map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <Link
                            href={`/articles/${article.slug}`}
                            className="block p-4 hover:bg-neutral-50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-2">
                                  {article.title}
                                </h4>
                                {article.excerpt && (
                                  <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                                    {article.excerpt}
                                  </p>
                                )}
                              </div>
                              {article.is_featured && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex-shrink-0">
                                  Featured
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {formatDate(article.created_at)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  {article.view_count || 0}
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-neutral-400" />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-8 sm:mt-12"
        >
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            View All Articles
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ArticlesSection;
