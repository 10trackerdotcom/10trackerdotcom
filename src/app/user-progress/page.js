"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { 
  TrendingUp,
  BookOpen,
  Trophy,
  Target,
  CheckCircle,
  BarChart3,
  ArrowRight,
  Sparkles,
  Award,
  Clock,
  Zap,
  Calendar
} from "lucide-react";
import { getCachedData } from "@/lib/utils/apiCache";

export default function UserProgressPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/sign-in?redirect=/user-progress');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch user progress with caching
  useEffect(() => {
    if (!user?.id) return;

    const fetchProgress = async () => {
      try {
        const data = await getCachedData(
          `user-progress-${user.id}`,
          async () => {
            const response = await fetch(`/api/user/progress?userId=${encodeURIComponent(user.id)}`);
            const result = await response.json();
            if (result.success) {
              return result.data || [];
            }
            return [];
          },
          2 * 60 * 1000 // 2 minutes cache
        );
        setProgressData(data);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching progress:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user?.id]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const totalExams = progressData.length;
    const totalTopics = progressData.reduce((sum, exam) => sum + exam.topicsCount, 0);
    const totalQuestions = progressData.reduce((sum, exam) => sum + exam.totalCompleted, 0);
    const totalCorrect = progressData.reduce((sum, exam) => sum + exam.totalCorrect, 0);
    const totalPoints = progressData.reduce((sum, exam) => sum + exam.totalPoints, 0);
    const overallAccuracy = totalQuestions > 0 
      ? Math.round((totalCorrect / totalQuestions) * 100) 
      : 0;

    return {
      totalExams,
      totalTopics,
      totalQuestions,
      totalCorrect,
      totalPoints,
      overallAccuracy,
    };
  }, [progressData]);

  // Format exam name
  const formatExamName = (area) => {
    return area
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toUpperCase())
      .join(' ');
  };

  // Get exam icon
  const getExamIcon = (area) => {
    const icons = {
      'gate-cse': '💻',
      'cat': '📊',
      'upsc': '📚',
      'jee': '⚛️',
      'neet': '🧬',
      'ssc': '📋',
    };
    return icons[area] || '📖';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading your progress...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const displayedExams = selectedExam 
    ? progressData.filter(exam => exam.area === selectedExam)
    : progressData;

  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      {/* Hero Section */}
      <section className="bg-neutral-50 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
              <Sparkles className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">Your Progress Dashboard</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold mb-6 leading-tight text-neutral-900">
              Track Your Progress
            </h1>
            
            <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              View your performance across all exams, topics, and questions in one place.
            </p>

            {/* Overall Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 max-w-5xl mx-auto mt-12">
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900">
                  {overallStats.totalExams}
                </div>
                <div className="text-neutral-600 text-xs sm:text-sm">Exams</div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900">
                  {overallStats.totalTopics}
                </div>
                <div className="text-neutral-600 text-xs sm:text-sm">Topics</div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900">
                  {overallStats.totalQuestions.toLocaleString()}
                </div>
                <div className="text-neutral-600 text-xs sm:text-sm">Questions</div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900">
                  {overallStats.overallAccuracy}%
                </div>
                <div className="text-neutral-600 text-xs sm:text-sm">Accuracy</div>
              </div>
              <div className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-6 shadow-sm col-span-2 sm:col-span-1">
                <div className="text-2xl sm:text-3xl font-bold mb-2 text-neutral-900">
                  {overallStats.totalPoints.toLocaleString()}
                </div>
                <div className="text-neutral-600 text-xs sm:text-sm">Points</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Progress Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {progressData.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No Progress Yet</h3>
              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                Start practicing questions to see your progress here. Your performance will be tracked automatically.
              </p>
              <Link
                href="/exams"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors"
              >
                Browse Exams
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* Filter by Exam */}
              {progressData.length > 1 && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedExam(null)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !selectedExam
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      All Exams
                    </button>
                    {progressData.map((exam) => (
                      <button
                        key={exam.area}
                        onClick={() => setSelectedExam(exam.area)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedExam === exam.area
                            ? 'bg-neutral-900 text-white'
                            : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {formatExamName(exam.area)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayedExams.map((exam) => (
                  <div
                    key={exam.area}
                    className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    {/* Exam Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center text-3xl">
                          {getExamIcon(exam.area)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-neutral-900 mb-1">
                            {formatExamName(exam.area)}
                          </h3>
                          <p className="text-sm text-neutral-600">
                            {exam.topicsCount} topic{exam.topicsCount !== 1 ? 's' : ''} practiced
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/${exam.area}`}
                        className="text-neutral-400 hover:text-neutral-900 transition-colors"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>

                    {/* Progress Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-neutral-900 mb-1">
                          {exam.totalCompleted.toLocaleString()}
                        </div>
                        <div className="text-xs text-neutral-600">Questions</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-neutral-900 mb-1">
                          {exam.overallAccuracy}%
                        </div>
                        <div className="text-xs text-neutral-600">Accuracy</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-neutral-900 mb-1">
                          {exam.totalCorrect.toLocaleString()}
                        </div>
                        <div className="text-xs text-neutral-600">Correct</div>
                      </div>
                      <div className="bg-neutral-50 rounded-lg p-4">
                        <div className="text-2xl font-bold text-neutral-900 mb-1">
                          {exam.totalPoints.toLocaleString()}
                        </div>
                        <div className="text-xs text-neutral-600">Points</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-600">Overall Progress</span>
                        <span className="font-semibold text-neutral-900">
                          {exam.overallAccuracy}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div
                          className="bg-neutral-900 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${exam.overallAccuracy}%` }}
                        />
                      </div>
                    </div>

                    {/* Top Topics */}
                    {exam.topics.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-700 mb-3">
                          Top Topics
                        </h4>
                        <div className="space-y-2">
                          {exam.topics
                            .sort((a, b) => b.completedQuestions - a.completedQuestions)
                            .slice(0, 5)
                            .map((topic) => (
                              <Link
                                key={topic.topic}
                                href={`/${exam.area}/practice/${topic.topic}`}
                                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-neutral-900 truncate">
                                    {topic.topic.replace(/-/g, ' ')}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-600">
                                    <span>{topic.completedQuestions} questions</span>
                                    <span>•</span>
                                    <span>{topic.accuracy}% accuracy</span>
                                  </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                              </Link>
                            ))}
                        </div>
                        {exam.topics.length > 5 && (
                          <Link
                            href={`/${exam.area}`}
                            className="mt-3 text-sm text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1"
                          >
                            View all {exam.topics.length} topics
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {progressData.length > 0 && (
        <section className="py-16 sm:py-20 bg-white border-t border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-100 border border-neutral-200 mb-6">
              <Zap className="w-4 h-4 text-neutral-700" />
              <span className="text-sm font-medium text-neutral-700">Keep Practicing!</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold mb-6 text-neutral-900">
              Continue Your Learning Journey
            </h2>
            <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
              Keep practicing to improve your accuracy and master more topics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/exams"
                className="px-8 py-4 bg-neutral-900 text-white rounded-lg font-semibold text-lg hover:bg-neutral-800 transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto text-center"
              >
                Browse More Exams
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
      )}
    </div>
  );
}

