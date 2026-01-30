"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  Calendar, 
  ArrowRight,
  FileText,
  Eye,
  TrendingUp,
  BookOpen,
  Target
} from "lucide-react";
import { mergeExamData } from "@/data/examData";
import { useArticleCategories } from "@/lib/hooks/useArticleCategories";

// Enhanced Exam Card Component
function ExamCard({ exam, index }) {
  const [imageError, setImageError] = useState(false);
  const showImage = exam.image && !imageError;
  const isActive = exam.active !== false;
  
  // If inactive, render as disabled card
  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.6, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="relative overflow-hidden bg-neutral-50 border border-neutral-200 rounded-2xl flex flex-row items-center gap-4 p-5 h-28 cursor-not-allowed"
      >
        <div className={`relative w-20 h-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 overflow-hidden ${exam.bg || ''}`}>
          {showImage ? (
            <Image
              src={exam.image}
              alt={exam.name}
              fill
              className="object-cover grayscale"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-50">
              {exam.icon}
            </div>
          )}
        </div>
        
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-400 mb-1 truncate">
                {exam.name}
              </h3>
              <p className="text-neutral-300 text-xs line-clamp-1">
                Coming Soon
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-300 flex-shrink-0" />
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-300 mt-2">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-medium">{exam.count?.toLocaleString() || 0} Questions</span>
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
  
  // Active exam card with enhanced design
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        href={`/${exam.slug}`}
        className="group relative overflow-hidden bg-white border border-neutral-200 rounded-2xl hover:border-neutral-300 hover:shadow-xl transition-all duration-300 flex flex-row items-center gap-4 p-5 h-28"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Logo */}
        <div className={`relative w-20 h-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden shadow-sm ${exam.bg || ''}`}>
          {showImage ? (
            <Image
              src={exam.image}
              alt={exam.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              {exam.icon}
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col justify-center min-w-0 relative z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-base font-semibold text-neutral-900 mb-1 group-hover:text-neutral-700 transition-colors truncate"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}
              >
                {exam.name}
              </h3>
              <p className="text-neutral-600 text-xs line-clamp-1">
                {exam.description || 'Topic-wise practice questions with detailed solutions'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-neutral-500 mt-2">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>{exam.count?.toLocaleString() || 0} Questions</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Define the 8 specific categories to display on homepage
const HOMEPAGE_CATEGORIES = [
  'latest-jobs',
  'exam-results',
  'news',
  'world-news',
  'technology',
  'admit-cards',
  'answer-key',
  'admission'
];

export default function HomePage() {
  const [examCategories, setExamCategories] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [articlesByCategory, setArticlesByCategory] = useState({});
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [categoryErrors, setCategoryErrors] = useState({});
  
  // Fetch categories using shared hook
  const { categories } = useArticleCategories({ enabled: true });

  useEffect(() => {
    // Use hardcoded exam data
    const hardcodedExams = mergeExamData([]);
    setExamCategories(hardcodedExams);
    setLoadingExams(false);
  }, []);

  const fetchArticlesByCategory = useCallback(async () => {
    setLoadingArticles(true);
    setCategoryErrors({});
    
    // Initialize all categories with empty arrays
    const initialArticles = {};
    HOMEPAGE_CATEGORIES.forEach(cat => {
      initialArticles[cat] = [];
    });
    setArticlesByCategory(initialArticles);

    // Fetch articles for each category in parallel
    const fetchPromises = HOMEPAGE_CATEGORIES.map(async (categorySlug) => {
      try {
        const response = await fetch(`/api/articles?category=${encodeURIComponent(categorySlug)}&limit=5`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // Sort by created_at descending (most recent first)
          const sorted = [...result.data].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          return { categorySlug, articles: sorted, error: null };
        } else {
          throw new Error(result.error || 'Failed to fetch articles');
        }
      } catch (error) {
        console.error(`Error fetching articles for category ${categorySlug}:`, error);
        return { 
          categorySlug, 
          articles: [], 
          error: error.message || 'Failed to load articles' 
        };
      }
    });

    // Wait for all requests to complete
    const results = await Promise.all(fetchPromises);
    
    // Update state with results
    const updatedArticles = {};
    const errors = {};
    
    results.forEach(({ categorySlug, articles, error }) => {
      updatedArticles[categorySlug] = articles;
      if (error) {
        errors[categorySlug] = error;
      }
    });
    
    setArticlesByCategory(updatedArticles);
    setCategoryErrors(errors);
    setLoadingArticles(false);
  }, []);

  useEffect(() => {
    fetchArticlesByCategory();
  }, [fetchArticlesByCategory]);

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

  // Get categories in the specified order
  const sortedCategories = HOMEPAGE_CATEGORIES.filter(cat => {
    // Always show category even if it has no articles
    return true;
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Hero Section - Minimal but Populated */}
        <section className="relative overflow-hidden bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-[5%] pt-28 pb-16 sm:py-20">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
              {/* Left Side - Heading (70%) */}
              <div className="flex-1 lg:w-[70%]">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4 tracking-tight leading-tight"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}
                >
                  10tracker
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-xl text-neutral-600 leading-relaxed mb-6"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}
                >
                  Your one-stop destination for latest information, job updates, results, and comprehensive exam preparation
                </motion.p>
                
                {/* Additional Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-wrap gap-4 text-sm text-neutral-600"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400"></div>
                    <span>Latest Information</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400"></div>
                    <span>Job Updates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400"></div>
                    <span>Results</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400"></div>
                    <span>Exam Preparation</span>
                  </div>
                </motion.div>
              </div>
              
              {/* Right Side - Metrics (30%) */}
              <div className="w-full lg:w-[30%] flex flex-col gap-6">
                {/* Exams Metric */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="border border-neutral-200 rounded-lg p-6 bg-neutral-50/50"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-neutral-600" />
                    <span className="text-sm font-medium text-neutral-600">Exams</span>
                  </div>
                  <div className="text-3xl sm:text-4xl text-neutral-900">
                    {examCategories.length}+
                  </div>
                  <div className="text-xs font-medium text-neutral-500 mt-2">Available for practice</div>
                </motion.div>
                
                {/* Total Questions Metric */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="border border-neutral-200 rounded-lg p-6 bg-neutral-50/50"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-neutral-600" />
                    <span className="text-sm font-medium text-neutral-600">Total Questions</span>
                  </div>
                  <div className="text-3xl sm:text-4xl text-neutral-900">
                    {examCategories.reduce((sum, exam) => sum + (exam.count || 0), 0).toLocaleString()}+
                  </div>
                  <div className="text-xs font-medium text-neutral-500 mt-2">Ready to practice</div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Exam Categories Section - Moved to Top */}
        <section className="py-10 bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-[5%]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2 tracking-tight"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}
                >
                  Practice by Exam
                </h2>
                <p className="text-sm text-neutral-600">
                  Choose your exam and start practicing
                </p>
              </div>
              <Link
                href="/exams"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingExams ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600 text-sm">Loading exams...</p>
              </div>
            ) : examCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600">No exams available at the moment.</p>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {examCategories.map((exam, index) => (
                  <ExamCard key={exam.slug} exam={exam} index={index} />
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Latest Articles & Updates Section - Category Wise */}
        <section className="py-12 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-[5%]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2 tracking-tight"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}
                >
                  Latest Updates
                </h2>
                <p className="text-sm text-neutral-600">
                  Stay informed with the latest articles and updates
                </p>
              </div>
              <Link
                href="/articles"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingArticles ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600 text-sm">Loading articles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCategories.map((categorySlug) => {
                  const categoryArticles = articlesByCategory[categorySlug] || [];
                  const categoryColor = getCategoryColor(categorySlug);
                  const categoryName = getCategoryName(categorySlug);
                  const hasError = categoryErrors[categorySlug];
                  
                  return (
                    <motion.div
                      key={categorySlug}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden flex flex-col"
                    >
                      {/* Category Header */}
                      <div 
                        className="px-4 py-3 border-b border-neutral-200 flex-shrink-0"
                        style={{ backgroundColor: `${categoryColor}10` }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 
                            className="text-base font-semibold truncate"
                            style={{ color: categoryColor, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}
                          >
                            {categoryName}
                          </h3>
                          <span className="text-xs font-medium text-neutral-500 flex-shrink-0 ml-2">
                            {categoryArticles?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden lg:block overflow-x-auto flex-1">
                        {hasError ? (
                          <div className="p-6 text-center">
                            <p className="text-sm text-neutral-500 mb-2">Unable to load articles</p>
                            <button
                              onClick={fetchArticlesByCategory}
                              className="text-xs text-neutral-600 hover:text-neutral-900 underline"
                            >
                              Try again
                            </button>
                          </div>
                        ) : categoryArticles.length === 0 ? (
                          <div className="p-6 text-center">
                            <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                            <p className="text-sm text-neutral-500">No articles yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-neutral-200">
                            {categoryArticles.map((article) => (
                            <Link
                              key={article.id}
                              href={`/articles/${article.slug}`}
                              className="group block hover:bg-neutral-50 transition-colors"
                            >
                              <div className="flex gap-4 p-4">
                                {/* Article Image */}
                                {article.featured_image_url ? (
                                  <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-neutral-200">
                                    <Image
                                      src={article.featured_image_url}
                                      alt={article.title}
                                      fill
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                      unoptimized
                                    />
                                  </div>
                                ) : (
                                  <div className="w-24 h-16 flex-shrink-0 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-neutral-400" />
                                  </div>
                                )}
                                
                                {/* Article Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors line-clamp-2 mb-1">
                                        {article.title}
                                        {article.is_featured && (
                                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                                            ★
                                          </span>
                                        )}
                                      </div>
                                      {article.excerpt && (
                                        <p className="text-xs text-neutral-500 line-clamp-1 mb-2">
                                          {article.excerpt}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs font-medium text-neutral-600">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                                      <span className="truncate">{formatDate(article.created_at)}</span>
                                    </div>
                                    {article.view_count > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Eye className="w-3 h-3 text-neutral-400" />
                                        <span>{article.view_count}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                            ))}
                          </div>
                        )}
                        {/* View More Link for Desktop */}
                        {!hasError && categoryArticles.length > 0 && (
                          <div className="px-4 py-3 border-t border-neutral-200 bg-neutral-50">
                            <Link
                              href={`/articles?category=${categorySlug}`}
                              className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors group"
                            >
                              View More
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Tablet/Mobile Cards */}
                      <div className="lg:hidden">
                        {hasError ? (
                          <div className="p-6 text-center">
                            <p className="text-sm text-neutral-500 mb-2">Unable to load articles</p>
                            <button
                              onClick={fetchArticlesByCategory}
                              className="text-xs text-neutral-600 hover:text-neutral-900 underline"
                            >
                              Try again
                            </button>
                          </div>
                        ) : categoryArticles.length === 0 ? (
                          <div className="p-6 text-center">
                            <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                            <p className="text-sm text-neutral-500">No articles yet</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-neutral-200">
                            {categoryArticles.map((article) => (
                          <Link
                            key={article.id}
                            href={`/articles/${article.slug}`}
                            className="block p-4 hover:bg-neutral-50 transition-colors group"
                          >
                            <div className="flex gap-3">
                              {/* Article Image */}
                              {article.featured_image_url ? (
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden border border-neutral-200">
                                  <Image
                                    src={article.featured_image_url}
                                    alt={article.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    unoptimized
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-neutral-400" />
                                </div>
                              )}
                              
                              {/* Article Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2 flex-1"
                                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}
                                  >
                                    {article.title}
                                  </h3>
                                  {article.is_featured && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex-shrink-0">
                                      Featured
                                    </span>
                                  )}
                                </div>
                                {article.excerpt && (
                                  <p className="text-xs text-neutral-500 mb-2 line-clamp-2">
                                    {article.excerpt}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-xs font-medium text-neutral-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(article.created_at)}
                                  </div>
                                  {article.view_count > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      {article.view_count}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                          ))}
                          </div>
                        )}
                        {/* View More Link for Mobile/Tablet */}
                        {!hasError && categoryArticles.length > 0 && (
                          <div className="p-3 border-t border-neutral-200 bg-neutral-50">
                            <Link
                              href={`/articles?category=${categorySlug}`}
                              className="flex items-center justify-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors group"
                            >
                              View More
                              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </div>
      <Toaster position="top-right" />
    </>
  );
}
