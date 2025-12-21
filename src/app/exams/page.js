"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Trophy, 
  Search,
  ArrowRight,
  FileText,
  BarChart3,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Filter,
  X
} from "lucide-react";
import { getCachedData } from "@/lib/utils/apiCache";

export default function ExamsPage() {
  const [examCategories, setExamCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popular"); // popular, name, questions
  const [showFilters, setShowFilters] = useState(false);

  // Fetch exam categories with caching
  useEffect(() => {
    const fetchExamCategories = async () => {
      try {
        const categories = await getCachedData(
          'exam-categories',
          async () => {
            const response = await fetch('/api/exams/categories');
            const result = await response.json();
            if (result.success) {
              return result.data || [];
            }
            return [];
          },
          5 * 60 * 1000 // 5 minutes cache
        );
        setExamCategories(categories);
      } catch (error) {
        console.error('Error fetching exam categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExamCategories();
  }, []);

  // Filter and sort exams
  const filteredAndSortedExams = useMemo(() => {
    let filtered = examCategories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(exam => 
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "questions":
          return b.count - a.count;
        case "popular":
        default:
          return b.count - a.count; // Most questions = most popular
      }
    });

    return sorted;
  }, [examCategories, searchTerm, sortBy]);

  // Calculate total stats
  const stats = useMemo(() => {
    const totalQuestions = examCategories.reduce((sum, exam) => sum + (exam.count || 0), 0);
    const totalExams = examCategories.length;
    return { totalQuestions, totalExams };
  }, [examCategories]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading exams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      {/* Hero Section */}
      <section className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
              <Sparkles className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">All Competitive Exams</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6 leading-tight text-neutral-900">
              Choose Your Exam
            </h1>
            
            <p className="text-lg sm:text-xl text-neutral-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Practice topic-wise questions, track your progress, and excel in your competitive exam preparation.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900">
                  {stats.totalExams}
                </div>
                <div className="text-neutral-600 text-xs sm:text-sm">Exams Available</div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900">
                  {stats.totalQuestions.toLocaleString()}+
                </div>
                <div className="text-neutral-600 text-xs sm:text-sm">Practice Questions</div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm col-span-2 sm:col-span-1">
                <div className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900 flex items-center justify-center sm:justify-start">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-700" />
                </div>
                <div className="text-neutral-600 text-xs sm:text-sm text-center sm:text-left">Track Progress</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white border-b border-neutral-200 sticky top-20 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 sm:py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-sm sm:text-base outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 sm:flex-shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden px-4 py-2.5 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                type="button"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-neutral-600 whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none bg-white cursor-pointer"
                >
                  <option value="popular">Most Popular</option>
                  <option value="questions">Most Questions</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mobile Filter Dropdown */}
          {showFilters && (
            <div className="mt-4 sm:hidden">
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setShowFilters(false);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 outline-none bg-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="questions">Most Questions</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Exams Grid Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredAndSortedExams.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No exams found</h3>
              <p className="text-neutral-600 mb-4 max-w-md mx-auto">
                {searchTerm 
                  ? `No exams match "${searchTerm}". Try a different search term.`
                  : "No exams available at the moment."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                  type="button"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 sm:mb-8">
                <p className="text-neutral-600 text-sm sm:text-base">
                  Showing <span className="font-semibold text-neutral-900">{filteredAndSortedExams.length}</span> exam{filteredAndSortedExams.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredAndSortedExams.map((exam) => (
                  <Link
                    key={exam.slug}
                    href={`/${exam.slug}`}
                    className="group relative overflow-hidden bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 hover:border-neutral-300 hover:shadow-lg transition-all duration-200 h-full flex flex-col"
                  >
                    {/* Icon and Arrow */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        {exam.icon}
                      </div>
                      <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-1" />
                    </div>

                    {/* Exam Name */}
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2 group-hover:text-neutral-800 transition-colors line-clamp-2">
                      {exam.name}
                    </h3>

                    {/* Description */}
                    <p className="text-neutral-600 text-sm mb-4 line-clamp-2 flex-grow">
                      Topic-wise practice questions with detailed solutions and progress tracking
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 sm:gap-4 text-sm text-neutral-500 pt-4 border-t border-neutral-100 mt-auto">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-neutral-700">
                          {exam.count?.toLocaleString() || 0}
                        </span>
                        <span className="hidden sm:inline">Questions</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">Track Progress</span>
                      </span>
                    </div>

                    {/* Hover Effect Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neutral-50/0 to-neutral-50/0 group-hover:from-neutral-50/50 group-hover:to-transparent transition-all duration-200 pointer-events-none rounded-xl" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white border-t border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
            <Trophy className="w-4 h-4 text-neutral-700" />
            <span className="text-sm font-medium text-neutral-700">Ready to Start?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 text-neutral-900">
            Begin Your Exam Preparation Journey
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already practicing and improving 
            their exam performance with 10tracker.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-neutral-900 text-white rounded-lg font-semibold text-lg hover:bg-neutral-800 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto text-center"
            >
              Get Started Free
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-white border border-neutral-300 text-neutral-800 rounded-lg font-semibold text-lg hover:bg-neutral-50 transition-all duration-200 w-full sm:w-auto text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

