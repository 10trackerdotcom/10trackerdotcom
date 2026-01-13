'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calendar, 
  Eye, 
  ArrowLeft,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useArticleCategories } from '@/lib/hooks/useArticleCategories';
import AdSense from '@/components/AdSense';

const ITEMS_PER_PAGE = 25;

const CategoryPageClient = ({ params }) => {
  const [category, setCategory] = React.useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Use shared hook for categories
  const { categories } = useArticleCategories({ enabled: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    const loadCategory = async () => {
      const resolved = await params;
      setCategory(resolved.cate);
    };
    loadCategory();
  }, [params]);

  // Initialize page from URL query parameter
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    if (page > 0) {
      setCurrentPage(page);
    }
  }, [searchParams]);

  const fetchArticles = React.useCallback(async () => {
    if (!category) return;
    try {
      const response = await fetch(`/api/articles?limit=1000&category=${category}`);
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
  }, [category]);

  useEffect(() => {
    if (category) {
      fetchArticles();
    }
  }, [category, fetchArticles]);

  // Update URL with page parameter
  const updateURL = React.useCallback((page) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`${window.location.pathname}${newURL}`, { scroll: false });
  }, [searchParams, router]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
      updateURL(1);
    }
  }, [searchTerm, sortBy, currentPage, updateURL]);

  const getCategoryColor = (categorySlug) => {
    if (!categories || !Array.isArray(categories)) return '#3B82F6';
    const cat = categories.find(c => c.slug === categorySlug);
    return cat?.color || '#3B82F6';
  };

  const getCategoryName = (categorySlug) => {
    if (!categories || !Array.isArray(categories)) return categorySlug;
    const cat = categories.find(c => c.slug === categorySlug);
    return cat?.name || categorySlug;
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
    return matchesSearch;
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

  // Pagination calculations
  const totalPages = Math.ceil(sortedArticles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedArticles = sortedArticles.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      updateURL(page);
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate visible page numbers
  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(5, totalPages - 1);
      }
      
      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 4);
      }
      
      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (loading || !category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-20">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors duration-200 group mb-6"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(category) }}
                ></div>
                <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>
                  {getCategoryName(category)}
                </h1>
              </div>
              <p className="text-lg text-neutral-600">
                {sortedArticles.length} {sortedArticles.length === 1 ? 'article' : 'articles'}
                {totalPages > 1 && (
                  <span className="text-sm text-neutral-500 ml-2">
                    (Page {currentPage} of {totalPages})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* AdSense Ad - Top */}
        <div className="mb-6">
          <AdSense />
        </div>

        {/* Search and Sort */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-neutral-900 placeholder-neutral-400 bg-white"
            />
          </div>
          <div className="sm:w-48">
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

        {/* Table */}
        {sortedArticles.length > 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {paginatedArticles.map((article, index) => (
                    <tr key={article.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="text-sm font-medium text-neutral-900 hover:text-neutral-700 transition-colors line-clamp-2"
                        >
                          {article.title}
                        </Link>
                        {article.excerpt && (
                          <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                            {article.excerpt}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          {formatDate(article.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-neutral-400" />
                          {article.view_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {article.is_featured && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
                        >
                          View
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-neutral-200">
              {paginatedArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="block p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-xs text-neutral-500 mb-2 line-clamp-1">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(article.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.view_count || 0}
                        </div>
                        {article.is_featured && (
                          <span className="text-xs font-semibold text-amber-600">
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              ))}
            </div>

            {/* AdSense Ad - Before Pagination */}
            <div className="my-6">
              <AdSense />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Page Info */}
                  <div className="text-sm text-neutral-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, sortedArticles.length)} of {sortedArticles.length} articles
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-white hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-50 transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page Numbers - Desktop */}
                    <div className="hidden sm:flex items-center gap-1">
                      {getVisiblePages().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-neutral-400">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              page === currentPage
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-700 hover:bg-white border border-neutral-300 hover:border-neutral-400'
                            }`}
                            aria-label={`Go to page ${page}`}
                            aria-current={page === currentPage ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>

                    {/* Mobile Page Indicator */}
                    <div className="sm:hidden px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg">
                      {currentPage} / {totalPages}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-white hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-50 transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-neutral-200">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">No articles found</h3>
            <p className="text-neutral-600 mb-6">
              {searchTerm 
                ? `No articles match "${searchTerm}"` 
                : 'No articles are available in this category.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-6 py-3 border border-neutral-300 text-neutral-800 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPageClient;

