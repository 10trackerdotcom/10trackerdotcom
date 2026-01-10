"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Zap,
  BarChart3,
  FileText,
  Sparkles,
  Users,
  Target,
  Award,
  Briefcase,
  ClipboardCheck,
  Bell,
  Search,
  Clock,
  Eye
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
              <h3 className="text-lg font-semibold text-neutral-900 mb-1 group-hover:text-neutral-700 transition-colors truncate">
                {exam.name}
              </h3>
              <p className="text-neutral-600 text-xs line-clamp-1">
                {exam.description || 'Topic-wise practice questions with detailed solutions'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all flex-shrink-0" />
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-2">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-medium">{exam.count?.toLocaleString() || 0} Questions</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function HomePage() {
  const [examCategories, setExamCategories] = useState([]);
  const [examStats, setExamStats] = useState({
    totalQuestions: 0,
    totalUsers: 0,
    dailyPractice: 0,
  });
  const [loadingExams, setLoadingExams] = useState(true);
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  
  // Fetch categories using shared hook
  const { categories } = useArticleCategories({ enabled: true });

  useEffect(() => {
    // Use hardcoded exam data
    const hardcodedExams = mergeExamData([]);
    setExamCategories(hardcodedExams);
    
    // Calculate total questions from all exams
    const total = hardcodedExams.reduce((sum, exam) => sum + (exam.count || 0), 0);
    setExamStats(prev => ({ 
      ...prev, 
      totalQuestions: total,
      totalUsers: 2500,
      dailyPractice: 3200,
    }));
    
    setLoadingExams(false);
  }, []);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?limit=15');
      const result = await response.json();
      if (result.success) {
        const sorted = [...(result.data || [])]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setArticles(sorted);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoadingArticles(false);
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
        {/* Premium Hero Section */}
        <section className="relative bg-gradient-to-br from-neutral-50 via-white to-neutral-50 border-b border-neutral-200 overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-100 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-neutral-100 rounded-full blur-3xl opacity-20"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="text-center"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-sm mb-8"
              >
                <Sparkles className="w-4 h-4 text-neutral-700" />
                <span className="text-sm font-medium text-neutral-700">Your Path to Success Starts Here</span>
              </motion.div>
              
              <motion.h1
                variants={itemVariants}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight text-neutral-900 tracking-tight"
              >
                Your Gateway to Success
                <span className="block mt-3 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 bg-clip-text text-transparent">
                  10tracker
                </span>
              </motion.h1>
              
              <motion.p
                variants={itemVariants}
                className="text-lg sm:text-xl lg:text-2xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed font-light"
              >
                Latest Information • Job Updates • Results • Exam Preparation
                <br className="hidden sm:block" />
                <span className="text-base sm:text-lg">Everything you need in one place</span>
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
              >
                <Link
                  href="/exams"
                  className="group px-8 py-4 bg-neutral-900 text-white rounded-xl font-semibold text-lg hover:bg-neutral-800 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  Start Practicing
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                 
              </motion.div>

              {/* Enhanced Stats */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 mb-4 mx-auto">
                    <FileText className="w-6 h-6 text-neutral-700" />
                  </div>
                  <div className="text-4xl font-bold mb-2 text-neutral-900">{examStats.totalQuestions.toLocaleString()}+</div>
                  <div className="text-neutral-600 text-sm font-medium">Practice Questions</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 mb-4 mx-auto">
                    <Users className="w-6 h-6 text-neutral-700" />
                  </div>
                  <div className="text-4xl font-bold mb-2 text-neutral-900">{examStats.totalUsers.toLocaleString()}+</div>
                  <div className="text-neutral-600 text-sm font-medium">Active Students</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-100 mb-4 mx-auto">
                    <Target className="w-6 h-6 text-neutral-700" />
                  </div>
                  <div className="text-4xl font-bold mb-2 text-neutral-900">{examStats.dailyPractice.toLocaleString()}+</div>
                  <div className="text-neutral-600 text-sm font-medium">Daily Practice</div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Latest Articles & Updates Section - Table View */}
        <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-neutral-50/30 to-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 sm:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-sm mb-4">
                <TrendingUp className="w-4 h-4 text-neutral-700" />
                <span className="text-sm font-medium text-neutral-700">Latest Updates & Information</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
                Latest Articles
              </h2>
              <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto font-light">
                Stay informed with the latest articles, updates, and exam preparation tips
              </p>
            </motion.div>

            {loadingArticles ? (
              <div className="text-center py-16">
                <div className="w-10 h-10 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl">
                <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">No articles available</h3>
                <p className="text-neutral-600">Check back soon for latest updates</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="hidden md:block bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden mb-8"
                >
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
                </motion.div>

                {/* Mobile Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="md:hidden space-y-4 mb-8"
                >
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
                </motion.div>

                {/* View All Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <Link
                    href="/articles"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    View All Articles
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </section>

        {/* Exam Categories Section */}
        <section className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
                Practice by Exam
              </h2>
              <p className="text-xl text-neutral-600 max-w-2xl mx-auto font-light">
                Choose your exam and start practicing with topic-wise questions, 
                detailed solutions, and progress tracking.
              </p>
            </motion.div>

            {loadingExams ? (
              <div className="text-center py-16">
                <div className="w-10 h-10 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading exams...</p>
              </div>
            ) : examCategories.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-neutral-600">No exams available at the moment.</p>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
              >
                {examCategories.map((exam, index) => (
                  <ExamCard key={exam.slug} exam={exam} index={index} />
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Link
                href="/exams"
                className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                View All Exams
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-4 tracking-tight">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-neutral-600 max-w-2xl mx-auto font-light">
                Powerful features designed to help you excel in competitive exams
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={containerVariants}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {/* Daily Practice Problems */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="bg-white border border-neutral-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mb-6">
                  <Calendar className="w-7 h-7 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Daily Practice Problems</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Get fresh problems every day tailored to your exam. Build consistency and improve gradually.
                </p>
              </motion.div>

              {/* Contest */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="bg-white border border-neutral-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mb-6">
                  <Trophy className="w-7 h-7 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Weekly Contests</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Compete with peers in timed contests. Test your skills and climb the leaderboard.
                </p>
              </motion.div>

              {/* Progress Tracker */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="bg-white border border-neutral-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mb-6">
                  <TrendingUp className="w-7 h-7 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Progress Tracker</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Track your performance across topics. Identify strengths and areas for improvement.
                </p>
              </motion.div>

              {/* Topic-wise Practice */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="bg-white border border-neutral-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Topic-wise Practice</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Practice questions organized by topics. Master each concept before moving forward.
                </p>
              </motion.div>

              {/* Detailed Solutions */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="bg-white border border-neutral-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mb-6">
                  <CheckCircle className="w-7 h-7 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Detailed Solutions</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Every question comes with step-by-step solutions. Learn the right approach and methodology.
                </p>
              </motion.div>

              {/* Performance Analytics */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="bg-white border border-neutral-200 rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">Performance Analytics</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Get insights into your performance with detailed analytics and recommendations.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Premium CTA Section */}
        <section className="py-24 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 border-t border-neutral-200 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-neutral-100 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-neutral-100 rounded-full blur-3xl opacity-30"></div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-neutral-200 shadow-sm mb-8">
              <Zap className="w-4 h-4 text-neutral-700" />
              <span className="text-sm font-medium text-neutral-700">Ready to Excel?</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-neutral-900 tracking-tight">
              Start Your Journey to Success Today
            </h2>
            <p className="text-xl sm:text-2xl text-neutral-600 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Join thousands of students who are already practicing and improving 
              their exam performance with 10tracker.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="px-10 py-5 bg-neutral-900 text-white rounded-xl font-semibold text-lg hover:bg-neutral-800 transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/exams"
                className="px-10 py-5 bg-white border-2 border-neutral-300 text-neutral-800 rounded-xl font-semibold text-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Browse Exams
                <Award className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
      <Toaster position="top-right" />
    </>
  );
}
