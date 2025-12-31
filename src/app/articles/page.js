'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  Calendar, 
  Eye, 
  ArrowRight,
  BookOpen,
  Search,
  Filter
} from 'lucide-react';
import { useArticleCategories } from '@/lib/hooks/useArticleCategories';
import Navbar from '@/components/Navbar';

const MetaDataJobs = dynamic(() => import('@/components/Seo'), { ssr: false });

const ITEMS_PER_PAGE = 20;

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
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

  // Filter articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] pt-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading articles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MetaDataJobs
        seoTitle="All Articles | 10tracker"
        seoDescription="Browse all articles, latest updates, exam tips, and preparation strategies on 10tracker."
      />
      <Navbar />
      <div className="min-h-screen bg-white pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4 tracking-tight">
              All Articles
            </h1>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto font-light">
              Explore our complete collection of articles, tips, and insights for exam preparation.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 transition-all"
                />
              </div>
              
              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 transition-all appearance-none bg-white cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories && Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Results Count */}
          <div className="mb-6 text-sm text-neutral-600">
            Showing {paginatedArticles.length} of {filteredArticles.length} articles
          </div>

          {/* Desktop Table */}
          {paginatedArticles.length > 0 ? (
            <>
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
                    {paginatedArticles.map((article, index) => (
                      <motion.tr
                        key={article.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
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
                {paginatedArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-neutral-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl">
              <BookOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No articles found</h3>
              <p className="text-neutral-600">
                {searchTerm || selectedCategory 
                  ? 'Try adjusting your filters' 
                  : 'No articles available at the moment'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

