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
      const response = await fetch('/api/articles?limit=20');
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

  const filteredArticles = articles.filter(article => 
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
            Latest Articles
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
          {/* Category Filter */}
          <div className="max-w-md">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 text-neutral-800"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Articles Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {/* Desktop Table View - Hidden on Mobile */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Article</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Published</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Views</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredArticles.map((article, index) => (
                      <motion.tr
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-neutral-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-4">
                            {article.featured_image_url && (
                              <img
                                src={article.featured_image_url}
                                alt={article.title}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-neutral-900 mb-1 line-clamp-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                                {article.title}
                              </h3>
                              <p className="text-sm text-neutral-600 line-clamp-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                                {article.excerpt || article.content.substring(0, 120)}...
                              </p>
                              {article.is_featured && (
                                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-3 py-1 text-sm font-medium rounded-full"
                            style={{ 
                              backgroundColor: getCategoryColor(article.category) + '20',
                              color: getCategoryColor(article.category)
                            }}
                          >
                            {getCategoryName(article.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(article.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {article.view_count || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`/articles/${article.slug}`}
                            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-medium text-neutral-800 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                          >
                            Read More
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mobile Grid View - Hidden on Desktop */}
          <div className="lg:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((article, index) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
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

                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-neutral-700 transition-colors" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                      {article.title}
                    </h3>
                    
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-3" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                      {article.excerpt || article.content.substring(0, 120)}...
                    </p>

                    <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.view_count || 0}
                      </div>
                    </div>

                    <Link
                      href={`/articles/${article.slug}`}
                      className="inline-flex items-center gap-2 w-full justify-center px-4 py-2 text-sm font-medium text-neutral-800 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
                    >
                      Read Article
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </motion.div>

        {/* View All Button */}
        {filteredArticles.length > 0 && (
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
