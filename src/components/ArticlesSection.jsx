'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  
  // Fetch categories using shared hook
  const { categories } = useArticleCategories({ enabled: true });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=10');
      const result = await response.json();
      if (result.success) {
        const sorted = [...(result.data || [])]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
        setArticles(sorted);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
            Latest Updates
          </h2>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto font-light">
            Stay updated with the latest insights, tips, and strategies for your exam preparation.
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mb-8">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Views</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {articles.map((article, index) => (
                <motion.tr
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/articles/${article.slug}`}
                      className="group block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-2 mb-1">
                            {article.title}
                            {article.is_featured && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
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
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `${getCategoryColor(article.category)}20`,
                        color: getCategoryColor(article.category)
                      }}
                    >
                      {getCategoryName(article.category)}
                    </span>
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
                      View
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4 mb-8">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                href={`/articles/${article.slug}`}
                className="block bg-white border border-neutral-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-neutral-900 mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-neutral-500 mb-3 line-clamp-2">
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
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(article.created_at)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {article.view_count || 0}
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: `${getCategoryColor(article.category)}20`,
                      color: getCategoryColor(article.category)
                    }}
                  >
                    {getCategoryName(article.category)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            View All Articles
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </motion.section>
  );
};

export default ArticlesSection;
