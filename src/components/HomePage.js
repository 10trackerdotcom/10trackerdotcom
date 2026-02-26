"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  ArrowRight,
  FileText,
  Target
} from "lucide-react";
import { mergeExamData } from "@/data/examData";

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

export default function HomePage() {
  const [examCategories, setExamCategories] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    // Use hardcoded exam data
    const hardcodedExams = mergeExamData([]);
    setExamCategories(hardcodedExams);
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

      </div>
      <Toaster position="top-right" />
    </>
  );
}
