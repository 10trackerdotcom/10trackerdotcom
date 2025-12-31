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
  Award
} from "lucide-react";
import { mergeExamData } from "@/data/examData";
import dynamic from "next/dynamic";

// Lazy load ArticlesSection for better performance
const ArticlesSection = dynamic(() => import("@/components/ArticlesSection"), {
  ssr: true,
  loading: () => (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading articles...</p>
        </div>
      </div>
    </div>
  ),
});

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
                className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-neutral-900 tracking-tight"
              >
                Master Competitive Exams with
                <span className="block mt-3 bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                  10tracker
                </span>
              </motion.h1>
              
              <motion.p
                variants={itemVariants}
                className="text-xl sm:text-2xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed font-light"
              >
                Practice smarter, track better, achieve more. Get daily problems, 
                contest challenges, and comprehensive exam preparation all in one place.
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
                <Link
                  href="/contests"
                  className="px-8 py-4 bg-white border-2 border-neutral-300 text-neutral-800 rounded-xl font-semibold text-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Trophy className="w-5 h-5" />
                  Join Contests
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

        {/* Blog/Articles Section - Integrated */}
        <section className="py-20 bg-white border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ArticlesSection />
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
