"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
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
  Sparkles
} from "lucide-react";

export default function HomePage() {
  const [examCategories, setExamCategories] = useState([]);
  const [examStats, setExamStats] = useState({
    totalQuestions: 0,
    totalUsers: 0,
    dailyPractice: 0,
  });
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    // Fetch exam categories from database
    const fetchExamCategories = async () => {
      try {
        const response = await fetch('/api/exams/categories');
        const result = await response.json();
        if (result.success) {
          setExamCategories(result.data || []);
          // Calculate total questions from categories
          const total = (result.data || []).reduce((sum, cat) => sum + (cat.count || 0), 0);
          setExamStats(prev => ({ ...prev, totalQuestions: total }));
        }
      } catch (error) {
        console.error('Error fetching exam categories:', error);
      } finally {
        setLoadingExams(false);
      }
    };

    fetchExamCategories();

    // Fetch stats (placeholder for now)
    setExamStats({
      totalQuestions: 5000,
      totalUsers: 2000,
      dailyPractice: 2500,
    });
  }, []);

  return (
    <>
      <div className="min-h-screen bg-neutral-50">
        {/* Hero Section */}
        <section className="bg-neutral-50 border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 mt-8 py-4 sm:py-2 rounded-full sm:bg-neutral-100 border border-neutral-200 mb-6">
                <Sparkles className="w-4 h-4 text-neutral-600" />
                <span className="text-sm font-medium text-neutral-700">Your Path to Success Starts Here</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6 leading-tight text-neutral-900">
                Master Competitive Exams with
                <span className="block mt-2 text-neutral-800">
                  10tracker
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Practice smarter, track better, achieve more. Get daily problems, 
                contest challenges, and comprehensive exam preparation all in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  href="/exams"
                  className="group px-8 py-4 bg-neutral-900 text-white rounded-lg font-semibold text-lg hover:bg-neutral-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  Start Practicing
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contests"
                  className="px-8 py-4 bg-white border border-neutral-300 text-neutral-800 rounded-lg font-semibold text-lg hover:bg-neutral-50 transition-all duration-200 flex items-center gap-2"
                >
                  <Trophy className="w-5 h-5" />
                  Join Contests
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mt-16">
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                  <div className="text-3xl font-bold mb-2 text-neutral-900">{examStats.totalQuestions.toLocaleString()}+</div>
                  <div className="text-neutral-600 text-sm">Practice Questions</div>
                </div>
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                  <div className="text-3xl font-bold mb-2 text-neutral-900">{examStats.totalUsers.toLocaleString()}+</div>
                  <div className="text-neutral-600 text-sm">Active Students</div>
                </div>
                 
              </div>
            </div>
          </div>
        </section>

        {/* Exam Categories Section */}
        <section className="py-16 sm:py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mb-4">
                Practice by Exam
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
                Choose your exam and start practicing with topic-wise questions, 
                detailed solutions, and progress tracking.
              </p>
            </div>

            {loadingExams ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading exams...</p>
              </div>
            ) : examCategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-600">No exams available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {examCategories.map((exam) => (
                <Link
                  key={exam.slug}
                  href={`/${exam.slug}`}
                  className="group relative overflow-hidden bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center text-3xl">
                    {exam.icon}
                  </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">{exam.name}</h3>
                  <p className="text-neutral-600 text-sm mb-4">
                    Topic-wise practice questions with detailed solutions
                  </p>
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {exam.count?.toLocaleString() || 0} Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      Track Progress
                    </span>
                  </div>
                </Link>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link
                href="/exams"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
              >
                View All Exams
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto">
                Powerful features designed to help you excel in competitive exams
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Daily Practice Problems */}
              <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Daily Practice Problems</h3>
                <p className="text-neutral-600 mb-4">
                  Get fresh problems every day tailored to your exam. Build consistency and improve gradually.
                </p>
                {/* <Link
                  href="/daily-practice"
                  className="text-neutral-800 font-semibold hover:text-neutral-900 flex items-center gap-2"
                >
                  Start Daily Practice
                  <ArrowRight className="w-4 h-4" />
                </Link> */}
              </div>

              {/* Contest */}
              <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Weekly Contests</h3>
                <p className="text-neutral-600 mb-4">
                  Compete with peers in timed contests. Test your skills and climb the leaderboard.
                </p>
                {/* <Link
                  href="/contests"
                  className="text-neutral-800 font-semibold hover:text-neutral-900 flex items-center gap-2"
                >
                  Join Contest
                  <ArrowRight className="w-4 h-4" />
                </Link> */}
              </div>

              {/* Progress Tracker */}
              <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Progress Tracker</h3>
                <p className="text-neutral-600 mb-4">
                  Track your performance across topics. Identify strengths and areas for improvement.
                </p>
                {/* <Link
                  href="/dashboard"
                  className="text-neutral-800 font-semibold hover:text-neutral-900 flex items-center gap-2"
                >
                  View Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link> */}
              </div>

              {/* Topic-wise Practice */}
              <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Topic-wise Practice</h3>
                <p className="text-neutral-600 mb-4">
                  Practice questions organized by topics. Master each concept before moving forward.
                </p>
                {/* <Link
                  href="/practice"
                  className="text-neutral-800 font-semibold hover:text-neutral-900 flex items-center gap-2"
                >
                  Start Practice
                  <ArrowRight className="w-4 h-4" />
                </Link> */}
              </div>

              {/* Detailed Solutions */}
              <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Detailed Solutions</h3>
                <p className="text-neutral-600 mb-4">
                  Every question comes with step-by-step solutions. Learn the right approach and methodology.
                </p>
                {/* <Link
                  href="/solutions"
                  className="text-neutral-800 font-semibold hover:text-neutral-900 flex items-center gap-2"
                >
                  Explore Solutions
                  <ArrowRight className="w-4 h-4" />
                </Link> */}
              </div>

              {/* Performance Analytics */}
              <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-neutral-700" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">Performance Analytics</h3>
                <p className="text-neutral-600 mb-4">
                  Get insights into your performance with detailed analytics and recommendations.
                </p>
                {/* <Link
                  href="/analytics"
                  className="text-neutral-800 font-semibold hover:text-neutral-900 flex items-center gap-2"
                >
                  View Analytics
                  <ArrowRight className="w-4 h-4" />
                </Link> */}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-neutral-50 border-t border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
              <Zap className="w-4 h-4 text-neutral-700" />
              <span className="text-sm font-medium text-neutral-700">Ready to Excel?</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-6 text-neutral-900">
              Start Your Journey to Success Today
            </h2>
            <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already practicing and improving 
              their exam performance with 10tracker.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="px-8 py-4 bg-neutral-900 text-white rounded-lg font-semibold text-lg hover:bg-neutral-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Get Started Free
              </Link>
              <Link
                href="/exams"
                className="px-8 py-4 bg-white border border-neutral-300 text-neutral-800 rounded-lg font-semibold text-lg hover:bg-neutral-50 transition-all duration-200"
              >
                Browse Exams
              </Link>
            </div>
        </div>
        </section>
      </div>
      <Toaster position="top-right" />
    </>
  );
}
