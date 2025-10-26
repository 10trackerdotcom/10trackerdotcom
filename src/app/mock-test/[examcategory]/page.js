"use client";
import React, { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import { 
  BookOpen, Clock, Users, BarChart3, Play, Eye, Calendar, Target, CheckCircle,
  Filter, Search, ChevronRight, Activity, Star, Zap, Brain, Trophy, ArrowRight,
  TrendingUp, Award, Sparkles, Gauge, TrendingDown, ChevronLeft, Grid, History,
  FileText, BarChart2, PieChart, User, Lock, Unlock, BarChart, TrendingUp as TrendingUpIcon,
  Bookmark, Settings, Bell, Menu, X, Plus, Minus, RefreshCw, Download, Share2
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import { useParams, useRouter } from 'next/navigation';

// Supabase configuration with connection pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
  }
);

// Optimized utility functions
const sanitizeData = (value, type = 'string', defaultValue = null) => {
  if (value === null || value === undefined) return defaultValue;
  switch (type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? (defaultValue || 0) : num;
    case 'array':
      return Array.isArray(value) ? value : (defaultValue || []);
    case 'object':
      return typeof value === 'object' && value !== null ? value : (defaultValue || {});
    default:
      return String(value).trim();
  }
};

const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Ultra-fast loading components
const FullPageLoader = (() => (
  <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center z-50 p-3 sm:p-4">
    <div className="text-center max-w-xs w-full">
      <div className="relative mb-4 sm:mb-6">
        <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border-3 sm:border-4 border-blue-200 rounded-full animate-pulse mx-auto"></div>
        <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 border-3 sm:border-4 border-blue-600 rounded-full border-t-transparent animate-spin mx-auto"></div>
      </div>
      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-800 mb-1">Loading Dashboard</h3>
      <p className="text-xs sm:text-sm text-gray-600">Preparing analytics...</p>
    </div>
  </div>
));

// Modern Tab Navigation Component
const TabNavigation = memo(function TabNavigation({ activeTab, onTabChange, isAuthenticated }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Grid, requiresAuth: false },
    { id: 'tests', label: 'Mock Tests', icon: BookOpen, requiresAuth: false },
    { id: 'sessions', label: 'Recent Sessions', icon: History, requiresAuth: true },
    { id: 'subjects', label: 'Subject Analysis', icon: PieChart, requiresAuth: true }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.requiresAuth && !isAuthenticated;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`
                flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : isDisabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {isDisabled && <Lock className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
});

// Public Dashboard Component for Non-Authenticated Users
const PublicDashboard = memo(function PublicDashboard({ tests, examcategory }) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">Welcome to {examcategory?.toUpperCase() || 'GATE CSE'} Mock Tests</h2>
          <p className="text-blue-100 mb-4">Practice with comprehensive mock tests and track your progress</p>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{tests.length} Tests Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>Join 10,000+ Students</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tests.length}</p>
              <p className="text-sm text-gray-600">Available Tests</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">1000+</p>
              <p className="text-sm text-gray-600">Questions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">180m</p>
              <p className="text-sm text-gray-600">Avg Duration</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Trophy className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">95%</p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Tests */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Star className="h-5 w-5 mr-2" />
            Featured Mock Tests
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tests.slice(0, 6).map((test) => (
              <div key={test.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{test.name}</h4>
                    <p className="text-sm text-gray-600">{test.total_questions} Questions</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    test.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    test.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {test.difficulty || 'Mixed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{test.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{test.attemptCount} attempts</span>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all">
                  Sign In to Start
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200">
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Start Your Journey?</h3>
          <p className="text-gray-600 mb-4">Sign in to access detailed analytics, track your progress, and unlock personalized insights</p>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg">
            Sign In to Continue
          </button>
        </div>
      </div>
    </div>
  );
});

// Enhanced Analytics Tab Component
const AnalyticsTab = memo(function AnalyticsTab({ examTrackerStats, userStats }) {
  if (!examTrackerStats.subjectWisePerformance.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <BarChart className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Analytics Data Yet</h3>
        <p className="text-gray-500">Complete some mock tests to see detailed analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Performance */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <TrendingUpIcon className="h-5 w-5 mr-2" />
            Overall Performance
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{examTrackerStats.overallStats?.totalQuestions || 0}</p>
              <p className="text-sm text-blue-700">Total Questions</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{examTrackerStats.overallStats?.overallAccuracy || 0}%</p>
              <p className="text-sm text-green-700">Accuracy</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <p className="text-2xl font-bold text-purple-600">{examTrackerStats.overallStats?.overallAttemptRate || 0}%</p>
              <p className="text-sm text-purple-700">Attempt Rate</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-600">{examTrackerStats.overallStats?.totalSubjects || 0}</p>
              <p className="text-sm text-orange-700">Subjects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Subject-wise Performance
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examTrackerStats.subjectWisePerformance.map((subject, index) => (
              <SubjectPerformanceCard key={`${subject.subject}-${index}`} subject={subject} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// Enhanced Recent Sessions Tab Component
const RecentSessionsTab = memo(function RecentSessionsTab({ examTrackerStats, examcategory }) {
  if (!examTrackerStats.recentAttempts.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <History className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recent Sessions</h3>
        <p className="text-gray-500">Start taking mock tests to see your session history</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <History className="h-5 w-5 mr-2" />
            Recent Test Sessions
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examTrackerStats.recentAttempts.map((attempt) => (
              <RecentTestSession key={attempt.id} attempt={attempt} examcategory={examcategory} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const StatsCardSkeleton = (() => (
  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-2 sm:p-3 lg:p-4 animate-pulse">
    <div className="flex items-center space-x-2 sm:space-x-3">
      <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-2 sm:h-2.5 lg:h-3 bg-gray-200 rounded w-12 sm:w-16 mb-1 sm:mb-2"></div>
        <div className="h-3 sm:h-4 lg:h-5 bg-gray-200 rounded w-8 sm:w-10 lg:w-12"></div>
      </div>
    </div>
  </div>
));

// Highly optimized stats card with reduced re-renders
const AnimatedStatsCard = (({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = "blue", 
  trend = null,
  delay = 0,
  loading = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const colorClasses = useMemo(() => ({
    blue: "bg-gradient-to-br from-blue-400 to-blue-600 text-white",
    green: "bg-gradient-to-br from-green-400 to-green-600 text-white",
    purple: "bg-gradient-to-br from-purple-400 to-purple-600 text-white",
    orange: "bg-gradient-to-br from-orange-400 to-orange-600 text-white",
    red: "bg-gradient-to-br from-red-400 to-red-600 text-white",
    yellow: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white"
  }), []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (loading) return <StatsCardSkeleton />;

  return (
    <div 
      className={`transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-2 sm:p-3 lg:p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-lg sm:rounded-xl ${colorClasses[color]} shadow-sm flex-shrink-0`}>
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
          </div>
          {trend !== null && (
            <div className={`flex items-center text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full ${
              trend > 0 ? 'bg-green-100 text-green-700' : 
              trend < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {trend > 0 ? <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> : 
               trend < 0 ? <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" /> : null}
              <span className="text-xs">{trend > 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-0.5 sm:mb-1 leading-tight truncate">{value}</h3>
        <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-0.5 sm:mb-1 leading-tight truncate">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 leading-tight truncate">{subtitle}</p>}
      </div>
    </div>
  );
});

// Mobile-optimized test list item
const TestListItem = (({ test, onStartTest, onPreview, examcategory }) => {
  const getDifficultyColor = useMemo(() => {
    switch (test.difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }, [test.difficulty]);

  const formatDuration = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, []);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 lg:p-6 hover:shadow-md transition-shadow duration-200">
      {/* Mobile-first layout */}
      <div className="space-y-3 sm:space-y-4">
        {/* Header with icon and title */}
        <div className="flex items-start space-x-3">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-200 p-1.5 sm:p-2 rounded-lg sm:rounded-xl flex-shrink-0">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 truncate pr-2">{test.name}</h4>
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${getDifficultyColor}`}>
                    {test.difficulty || 'Mixed'}
                  </span>
                  {test.userCompleted && <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-500" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid - responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center space-x-1 truncate">
            <Target className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
            <span className="truncate">{test.total_questions} Questions</span>
          </div>
          <div className="flex items-center space-x-1 truncate">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
            <span className="truncate">{formatDuration(test.duration)}</span>
          </div>
          <div className="flex items-center space-x-1 truncate">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
            <span className="truncate">{test.attemptCount} Attempts</span>
          </div>
        </div>

        {/* Best Score */}
        {test.userCompleted && test.userBestScore !== undefined && (
          <div className="flex items-center space-x-2 bg-yellow-50 p-2 rounded-lg">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-yellow-700">
              Best Score: {test.userBestScore}%
            </span>
          </div>
        )}
        
        {/* Action buttons - mobile optimized */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3 pt-2">
          {test.userCompleted ? (
            <button
              onClick={() => onStartTest(test)}
              className="flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-colors"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Attempted - See Solution
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            </button>
          ) : (
            <button
              onClick={() => onStartTest(test)}
              className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors"
            >
              <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Start
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Optimized recent test session
const RecentTestSession = (({ attempt, examcategory }) => {
  const getScoreColor = useCallback((score) => {
    const validScore = sanitizeData(score, 'number', 0);
    if (validScore >= 80) return 'bg-green-500 text-white';
    if (validScore >= 60) return 'bg-yellow-500 text-white';
    if (validScore >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  }, []);

  const formatDuration = useCallback((minutes) => {
    const validMinutes = sanitizeData(minutes, 'number', 0);
    const hours = Math.floor(validMinutes / 60);
    const mins = validMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, []);

  const {
    percentage,
    attemptedQuestions,
    correctAnswers,
    wrongAnswers,
    unanswered,
    durationTaken,
    testName
  } = useMemo(() => ({
    percentage: sanitizeData(attempt.percentage || attempt.score, 'number', 0),
    attemptedQuestions: sanitizeData(attempt.attempted_questions, 'number', 0),
    correctAnswers: sanitizeData(attempt.correct_answers, 'number', 0),
    wrongAnswers: sanitizeData(attempt.wrong_answers, 'number', 0),
    unanswered: sanitizeData(attempt.unanswered, 'number', 0),
    durationTaken: sanitizeData(attempt.duration_taken, 'number', 0),
    testName: attempt.test_name || `Test #${attempt.test_id?.slice(0,8) || 'Unknown'}`
  }), [attempt]);

  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-2 sm:space-x-3 mb-3">
        <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm lg:text-base flex-shrink-0 ${getScoreColor(percentage)}`}>
          {Math.round(percentage)}%
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-xs sm:text-sm lg:text-base">{testName}</h4>
          <p className="text-xs sm:text-sm text-gray-600">
            {new Date(attempt.created_at || attempt.submitted_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-3">
        <div className="text-center p-1.5 sm:p-2 bg-blue-50 rounded-lg">
          <p className="text-blue-600 font-bold text-xs sm:text-sm">{attemptedQuestions}</p>
          <p className="text-blue-700 text-xs">Attempted</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-green-50 rounded-lg">
          <p className="text-green-600 font-bold text-xs sm:text-sm">{correctAnswers}</p>
          <p className="text-green-700 text-xs">Correct</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-red-50 rounded-lg">
          <p className="text-red-600 font-bold text-xs sm:text-sm">{wrongAnswers}</p>
          <p className="text-red-700 text-xs">Wrong</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-gray-50 rounded-lg">
          <p className="text-gray-600 font-bold text-xs sm:text-sm">{unanswered}</p>
          <p className="text-gray-700 text-xs">Skipped</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm space-y-1 sm:space-y-0">
        <div className="flex items-center text-gray-600">
          <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
          Duration: {formatDuration(durationTaken)}
        </div>
        <Link
          href={`/mock-test/${examcategory}/results/${attempt.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium flex items-center self-end"
        >
          Details
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
});

// Mobile-optimized subject performance card
const SubjectPerformanceCard = (({ subject }) => {
  const performanceColor = useMemo(() => {
    if (subject.accuracy >= 80) return 'border-green-300 bg-green-50';
    if (subject.accuracy >= 60) return 'border-yellow-300 bg-yellow-50';
    if (subject.accuracy >= 40) return 'border-orange-300 bg-orange-50';
    return 'border-red-300 bg-red-50';
  }, [subject.accuracy]);

  const accuracyColor = useMemo(() => {
    if (subject.accuracy >= 80) return 'from-green-400 to-green-600';
    if (subject.accuracy >= 60) return 'from-yellow-400 to-yellow-600';
    if (subject.accuracy >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  }, [subject.accuracy]);

  const badgeColor = useMemo(() => {
    if (subject.accuracy >= 80) return 'bg-green-100 text-green-700';
    if (subject.accuracy >= 60) return 'bg-yellow-100 text-yellow-700';
    if (subject.accuracy >= 40) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  }, [subject.accuracy]);

  return (
    <div className={`rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 hover:shadow-lg transition-shadow duration-300 ${performanceColor}`}>
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg mb-1 truncate">{subject.subject}</h4>
          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
            {subject.topicsIncluded?.slice(0, 2).join(', ')}
            {subject.topicsIncluded?.length > 2 && ` +${subject.topicsIncluded.length - 2} more`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${badgeColor}`}>
            {subject.accuracy.toFixed(1)}%
          </span>
          <p className="text-xs text-gray-500 mt-1">{subject.performanceLevel}</p>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">Accuracy</span>
            <span className="text-gray-600">{subject.correctAnswers}/{subject.attemptedQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className={`h-1.5 sm:h-2 rounded-full bg-gradient-to-r ${accuracyColor} transition-all duration-1000`}
              style={{ width: `${subject.accuracy}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">Attempt Rate</span>
            <span className="text-gray-600">{subject.attemptedQuestions}/{subject.totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
            <div
              className="h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000"
              style={{ width: `${subject.attemptRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-3 sm:mb-4">
        <div className="text-center p-1.5 sm:p-2 bg-white/70 rounded">
          <p className="text-blue-600 font-bold text-xs sm:text-sm">{subject.totalQuestions}</p>
          <p className="text-blue-700 text-xs">Total</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-white/70 rounded">
          <p className="text-green-600 font-bold text-xs sm:text-sm">{subject.correctAnswers}</p>
          <p className="text-green-700 text-xs">Correct</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-white/70 rounded">
          <p className="text-red-600 font-bold text-xs sm:text-sm">{subject.wrongAnswers}</p>
          <p className="text-red-700 text-xs">Wrong</p>
        </div>
        <div className="text-center p-1.5 sm:p-2 bg-white/70 rounded">
          <p className="text-gray-600 font-bold text-xs sm:text-sm">{subject.unanswered}</p>
          <p className="text-gray-700 text-xs">Skipped</p>
        </div>
      </div>

      <div className="text-xs text-gray-600 space-y-1 mb-2 sm:mb-3">
        <div className="flex justify-between">
          <span>Avg Time:</span>
          <span className="font-medium">{subject.avgTimePerQuestion}s</span>
        </div>
        <div className="flex justify-between">
          <span>Tests:</span>
          <span className="font-medium">{subject.testsIncluded?.length || 0}</span>
        </div>
      </div>

      <div className="pt-2 sm:pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-medium text-gray-700">💡 Tip:</span> {subject.recommendedAction}
        </p>
      </div>
    </div>
  );
});

// Smart pagination with mobile optimization
const Pagination = (({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = (() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const delta = 1;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-6 sm:mt-8 px-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      
      {/* Desktop pagination */}
      <div className="hidden sm:flex items-center space-x-1">
        {getVisiblePages.map((page, index) => (
          <button
            key={index}
            onClick={() => page !== '...' && onPageChange(page)}
            disabled={page === '...' || page === currentPage}
            className={`min-w-[2.5rem] px-3 py-2 text-sm rounded-lg transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : page === '...'
                ? 'text-gray-400 cursor-default'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            aria-label={page === '...' ? 'More pages' : `Go to page ${page}`}
          >
            {page}
          </button>
        ))}
      </div>
      
      {/* Mobile pagination */}
      <div className="sm:hidden px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg min-w-[4rem] text-center">
        {currentPage} / {totalPages}
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
});

// Keep the analysis function (unchanged for performance)
const analyzeSubjectPerformance = (allUserAttempts, testNameLookup) => {
  const subjectAnalysis = new Map();
  let totalQuestions = 0;
  let totalAttempted = 0;
  let totalCorrect = 0;

  allUserAttempts.forEach((attempt) => {
    const testName = testNameLookup[attempt.test_id] || `Test-${attempt.test_id?.slice(0,8) || 'Unknown'}`;
    
    try {
      const allQuestions = sanitizeData(attempt.all_questions, 'array', []);
      
      allQuestions.forEach((question) => {
        const subject = question.subject || 'General';
        totalQuestions++;
        
        if (!subjectAnalysis.has(subject)) {
          subjectAnalysis.set(subject, {
            totalQuestions: 0,
            attemptedQuestions: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            unanswered: 0,
            totalTimeSpent: 0,
            tests: new Set(),
            topics: new Set()
          });
        }
        
        const subjectData = subjectAnalysis.get(subject);
        subjectData.totalQuestions++;
        subjectData.tests.add(testName);
        subjectData.topics.add(question.topic || 'Unknown');
        
        if (question.isAttempted) {
          subjectData.attemptedQuestions++;
          totalAttempted++;
          
          const timeSpent = sanitizeData(question.timeSpent, 'number', 0);
          subjectData.totalTimeSpent += timeSpent;
          
          if (question.isCorrect) {
            subjectData.correctAnswers++;
            totalCorrect++;
          } else {
            subjectData.wrongAnswers++;
          }
        } else {
          subjectData.unanswered++;
        }
      });
    } catch (error) {
      console.error('Error processing attempt:', error);
    }
  });

  const subjectWisePerformance = Array.from(subjectAnalysis.entries())
    .map(([subject, data]) => {
      const accuracy = data.attemptedQuestions > 0 ? 
        Math.round((data.correctAnswers / data.attemptedQuestions) * 10000) / 100 : 0;
      
      const attemptRate = data.totalQuestions > 0 ? 
        Math.round((data.attemptedQuestions / data.totalQuestions) * 10000) / 100 : 0;
      
      const avgTimePerQuestion = data.attemptedQuestions > 0 ? 
        Math.round((data.totalTimeSpent / data.attemptedQuestions) * 100) / 100 : 0;
      
      return {
        subject,
        totalQuestions: data.totalQuestions,
        attemptedQuestions: data.attemptedQuestions,
        correctAnswers: data.correctAnswers,
        wrongAnswers: data.wrongAnswers,
        unanswered: data.unanswered,
        accuracy,
        attemptRate,
        avgTimePerQuestion,
        testsIncluded: Array.from(data.tests),
        topicsIncluded: Array.from(data.topics),
        performanceLevel: accuracy >= 80 ? 'Excellent' : 
                         accuracy >= 60 ? 'Good' : 
                         accuracy >= 40 ? 'Average' : 'Needs Improvement',
        recommendedAction: accuracy < 50 ? 'Focus on fundamentals' :
                          attemptRate < 70 ? 'Practice more questions' :
                          avgTimePerQuestion > 120 ? 'Work on speed' : 'Maintain performance'
      };
    })
    .filter(item => item.totalQuestions > 0)
    .sort((a, b) => b.accuracy - a.accuracy);

  const overallStats = {
    totalQuestions,
    totalAttempted,
    totalCorrect,
    overallAccuracy: totalAttempted > 0 ? 
      Math.round((totalCorrect / totalAttempted) * 10000) / 100 : 0,
    overallAttemptRate: totalQuestions > 0 ? 
      Math.round((totalAttempted / totalQuestions) * 10000) / 100 : 0,
    totalSubjects: subjectWisePerformance.length
  };

  return { subjectWisePerformance, overallStats };
};

// Main optimized dashboard component
export default function OptimizedMockTestDashboard() {
  const { user } = useAuth();
  const { examcategory } = useParams();
  const router = useRouter();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [tests, setTests] = useState([]);
  const [userStats, setUserStats] = useState({
    completedTests: 0,
    averageScore: 0,
    totalStudyTime: 0,
    bestScore: 0,
    recentAttempts: [],
    totalQuestions: 0,
    improvement: 0,
    streak: 0
  });
  const [examTrackerStats, setExamTrackerStats] = useState({
    totalAttempts: 0,
    averageAccuracy: 0,
    totalTimeSpent: 0,
    questionsAttempted: 0,
    subjectWisePerformance: [],
    recentAttempts: [],
    strongestSubject: '',
    weakestSubject: '',
    overallStats: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const testsPerPage = 10;

  // Optimized debounced search with cleanup
  const debouncedSearch = useCallback(
    debounce((term) => {
      setSearchTerm(term);
      setCurrentPage(1);
    }, 200),
    []
  );

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending debounced calls
      if (debouncedSearch.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [debouncedSearch]);

  // Highly optimized fetch functions with better error handling
  const fetchAvailableTests = useCallback(async () => {
    try {
      const normalized = examcategory?.toUpperCase?.() || '';
      const normalizedAlt = normalized.replace('-', '_');
      // Always fetch basic test data for public access
      const testsResponse = await supabase
        .from('mock_tests')
        .select('id, name, description, duration, total_questions, difficulty, category, created_at')
        .eq('is_active', true)
        .in('category', [normalized, normalizedAlt])
        .order('created_at', { ascending: false });

        console.log(testsResponse)

      if (testsResponse.error) throw testsResponse.error;

      let testsWithDetails = (testsResponse.data || []).map(test => ({
        ...test,
        attemptCount: 0,
        userBestScore: null,
        userCompleted: false
      }));


      // If user is authenticated, fetch additional data
      if (user?.email) {
        const catList = [normalized, normalizedAlt];
        const [userAttemptsResponse, allAttemptsResponse] = await Promise.all([
          supabase
            .from('user_test_attempts')
            .select('id, test_id, score, percentage, submitted_at')
            .eq('user_email', user.email)
            .eq('is_completed', true)
            .order('submitted_at', { ascending: false }),
            supabase
            .from('user_test_attempts')
            .select('test_id')
            .eq('is_completed', true)
        ]);

        if (userAttemptsResponse.error) throw userAttemptsResponse.error;
        if (allAttemptsResponse.error) throw allAttemptsResponse.error;

        // Get test IDs for current category
        const currentCategoryTestIds = new Set(testsWithDetails.map(test => test.id));

        // Filter attempts to only include those for tests in current category
        const filteredUserAttempts = (userAttemptsResponse.data || []).filter(attempt => 
          currentCategoryTestIds.has(attempt.test_id)
        );
        const filteredAllAttempts = (allAttemptsResponse.data || []).filter(attempt => 
          currentCategoryTestIds.has(attempt.test_id)
        );

        // Process data efficiently with null checks
        const attemptCounts = filteredAllAttempts.reduce((acc, attempt) => {
          if (attempt?.test_id) {
            acc[attempt.test_id] = (acc[attempt.test_id] || 0) + 1;
          }
          return acc;
        }, {});

        const userBestScores = filteredUserAttempts.reduce((acc, attempt) => {
          if (attempt?.test_id) {
            const score = sanitizeData(attempt.percentage || attempt.score, 'number', 0);
            // Store the score if it's the first attempt for this test, or if it's better than the current best
            if (acc[attempt.test_id] === undefined || score > acc[attempt.test_id]) {
              acc[attempt.test_id] = score;
            }
          }
          return acc;
        }, {});

        const userLatestAttempts = filteredUserAttempts.reduce((acc, attempt) => {
          if (attempt?.test_id && attempt?.id) {
            // Since we ordered by submitted_at desc, the first occurrence is the latest
            if (!acc[attempt.test_id]) {
              acc[attempt.test_id] = attempt.id;
            }
          }
          return acc;
        }, {});

        // Create a set of all attempted test IDs (regardless of score)
        const attemptedTestIds = new Set(filteredUserAttempts.map(attempt => attempt.test_id));

        testsWithDetails = testsWithDetails.map(test => ({
          ...test,
          attemptCount: attemptCounts[test.id] || 0,
          userBestScore: userBestScores[test.id] || null,
          userCompleted: attemptedTestIds.has(test.id),
          userLatestAttemptId: userLatestAttempts[test.id] || null
        }));
      }

      setTests(testsWithDetails);
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('Failed to load tests');
      setTests([]);
    }
  }, [user?.email, examcategory]);

  const fetchOptimizedUserStats = useCallback(async () => {
    if (!user?.email) return;

    try {
      const normalized = examcategory?.toUpperCase?.() || '';
      const normalizedAlt = normalized.replace('-', '_');
      const catList = [normalized, normalizedAlt];
      const { data: allUserAttempts, error: allAttemptsError } = await supabase
        .from('user_test_attempts')
        .select('id, test_id, score, percentage, duration_taken, attempted_questions, correct_answers, wrong_answers, unanswered, all_questions, created_at, submitted_at')
        .eq('user_email', user.email)
        .eq('is_completed', true)
        .in('examcategory', catList)
        .order('created_at', { ascending: false });

      if (allAttemptsError) throw allAttemptsError;

      if (!allUserAttempts || allUserAttempts.length === 0) {
        setUserStats({
          completedTests: 0,
          averageScore: 0,
          totalStudyTime: 0,
          bestScore: 0,
          recentAttempts: [],
          totalQuestions: 0,
          improvement: 0,
          streak: 0
        });
        setExamTrackerStats({
          totalAttempts: 0,
          averageAccuracy: 0,
          totalTimeSpent: 0,
          questionsAttempted: 0,
          subjectWisePerformance: [],
          recentAttempts: [],
          strongestSubject: '',
          weakestSubject: '',
          overallStats: null
        });
        return;
      }

      // Get test names efficiently with null check
      const testIds = [...new Set(allUserAttempts.map(a => a?.test_id).filter(Boolean))];
      const { data: mockTests } = await supabase
        .from('mock_tests')
        .select('id, name')
        .in('id', testIds);

      const testNameLookup = (mockTests || []).reduce((acc, test) => {
        if (test?.id && test?.name) {
          acc[test.id] = test.name;
        }
        return acc;
      }, {});

      // Calculate stats efficiently with null checks
      const totalAttempts = allUserAttempts.length;
      const uniqueTests = testIds.length;
      
      const scores = allUserAttempts
        .map(attempt => sanitizeData(attempt?.percentage || attempt?.score, 'number', 0))
        .filter(score => score > 0);
      
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      
      const totalStudyTime = allUserAttempts.reduce((sum, attempt) => 
        sum + sanitizeData(attempt?.duration_taken, 'number', 0), 0
      );
      
      const totalQuestionsFromAttempts = allUserAttempts.reduce((sum, attempt) => 
        sum + sanitizeData(attempt?.attempted_questions, 'number', 0), 0
      );

      // Optimized subject analysis with error handling
      const { subjectWisePerformance, overallStats } = analyzeSubjectPerformance(
        allUserAttempts, 
        testNameLookup
      );

      // Calculate improvement with null checks
      const halfPoint = Math.floor(allUserAttempts.length / 2);
      const recentHalf = allUserAttempts.slice(0, halfPoint);
      const olderHalf = allUserAttempts.slice(halfPoint);
      
      const recentAvg = recentHalf.length > 0 ? 
        recentHalf.reduce((sum, a) => sum + sanitizeData(a?.percentage || a?.score, 'number', 0), 0) / recentHalf.length : 0;
      const olderAvg = olderHalf.length > 0 ? 
        olderHalf.reduce((sum, a) => sum + sanitizeData(a?.percentage || a?.score, 'number', 0), 0) / olderHalf.length : 0;
      const improvement = olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;

      const uniqueDays = [...new Set(allUserAttempts
        .map(a => a?.created_at ? new Date(a.created_at).toDateString() : null)
        .filter(Boolean)
      )];
      const streak = uniqueDays.length;

      // Add test names to attempts with null checks
      const attemptsWithNames = allUserAttempts.map(attempt => ({
        ...attempt,
        test_name: testNameLookup[attempt?.test_id] || `Test #${attempt?.test_id?.slice(0,8) || 'Unknown'}`,
        score: sanitizeData(attempt?.score, 'number', 0),
        percentage: sanitizeData(attempt?.percentage, 'number', 0)
      }));

      // Set final stats
      setUserStats({
        completedTests: uniqueTests,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore: Math.round(bestScore * 100) / 100,
        totalStudyTime: Math.round(totalStudyTime / 60),
        recentAttempts: attemptsWithNames.slice(0, 3),
        totalQuestions: totalQuestionsFromAttempts,
        improvement: Math.round(improvement),
        streak
      });

      setExamTrackerStats({
        totalAttempts,
        averageAccuracy: overallStats?.overallAccuracy || 0,
        totalTimeSpent: Math.round(totalStudyTime),
        questionsAttempted: overallStats?.totalAttempted || 0,
        subjectWisePerformance,
        recentAttempts: attemptsWithNames.slice(0, 8),
        strongestSubject: subjectWisePerformance.length > 0 ? subjectWisePerformance[0].subject : '',
        weakestSubject: subjectWisePerformance.length > 0 ? subjectWisePerformance[subjectWisePerformance.length - 1].subject : '',
        overallStats
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
      toast.error('Failed to load performance data');
    }
  }, [user?.email, examcategory]);

  // Optimized data fetching with better loading states and memory leak prevention
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        // Always fetch tests (public data)
        await fetchAvailableTests();
        
        // Only fetch user stats if authenticated
        if (user?.email && isMounted) {
          await fetchOptimizedUserStats();
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching data:', error);
          toast.error('Failed to load dashboard');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [user?.email, fetchAvailableTests, fetchOptimizedUserStats]);

  // Memoized event handlers
  const handleStartTest = useCallback((test) => {
    if (!test?.id) return;
    
    if (test.userCompleted && test.userLatestAttemptId) {
      // Navigate to results page for completed tests
      toast.success(`Opening ${test.name} results...`);
      router.push(`/mock-test/${examcategory}/results/${test.userLatestAttemptId}`);
    } else {
      // Navigate to attempt page for new tests
      toast.success(`Starting ${test.name}...`);
      router.push(`/mock-test/${examcategory}/attempt/${test.id}`);
    }
  }, [router, examcategory]);

  const handlePreviewTest = useCallback((test) => {
    if (!test?.name) return;
    toast.success(`Opening ${test.name} preview...`);
  }, []);

  // Highly optimized filtered and paginated tests
  const { filteredTests, paginatedTests, totalPages } = useMemo(() => {
    const filtered = tests.filter(test => {
      if (!test) return false;
      
      const matchesSearch = !searchTerm || 
        test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDifficulty = difficultyFilter === 'all' || 
        (test.difficulty?.toLowerCase() === difficultyFilter);
      
      return matchesSearch && matchesDifficulty;
    });

    const totalPages = Math.ceil(filtered.length / testsPerPage);
    const startIndex = (currentPage - 1) * testsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + testsPerPage);

    return { filteredTests: filtered, paginatedTests: paginated, totalPages };
  }, [tests, searchTerm, difficultyFilter, currentPage, testsPerPage]);

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user ? (
          <div className="space-y-6">
            {/* Authenticated User Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <AnimatedStatsCard
                icon={BookOpen}
                title="Available Tests"
                value={tests.length}
                subtitle="Ready to practice"
                color="blue"
                delay={50}
              />
              <AnimatedStatsCard
                icon={CheckCircle}
                title="Tests Completed"
                value={userStats.completedTests}
                subtitle="Unique tests finished"
                color="green"
                delay={100}
              />
              <AnimatedStatsCard
                icon={Trophy}
                title="Average Score"
                value={userStats.completedTests > 0 ? `${userStats.averageScore}%` : '--'}
                subtitle="Keep improving"
                color="purple"
                trend={userStats.improvement || null}
                delay={150}
              />
              <AnimatedStatsCard
                icon={Award}
                title="Best Score"
                value={userStats.completedTests > 0 ? `${userStats.bestScore}%` : '--'}
                subtitle="Personal best"
                color="yellow"
                delay={200}
              />
              <AnimatedStatsCard
                icon={FileText}
                title="Total Questions"
                value={userStats.totalQuestions}
                subtitle="Questions attempted"
                color="orange"
                delay={250}
              />
              <AnimatedStatsCard
                icon={Clock}
                title="Study Time"
                value={`${userStats.totalStudyTime}h`}
                subtitle="Total practice"
                color="red"
                delay={300}
              />
            </div>
          </div>
        ) : (
          <PublicDashboard tests={tests} examcategory={examcategory} />
        );
      
      case 'tests':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Grid className="h-5 w-5 mr-2" />
                Available Mock Tests
              </h3>
            </div>
            
            {/* Search and Filter */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col space-y-3 sm:flex-row sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tests..."
                    onChange={(e) => debouncedSearch(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  <select
                    value={difficultyFilter}
                    onChange={(e) => {
                      setDifficultyFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 sm:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tests List */}
            <div className="p-6">
              {filteredTests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    {searchTerm || difficultyFilter !== 'all' ? 'No tests found' : 'No tests available'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || difficultyFilter !== 'all' 
                      ? 'Try adjusting your search criteria or filters' 
                      : 'New comprehensive tests will appear here soon'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedTests.map((test) => (
                    <TestListItem
                      key={test.id}
                      test={test}
                      onStartTest={handleStartTest}
                      onPreview={handlePreviewTest}
                      examcategory={examcategory}
                    />
                  ))}
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </div>
        );
      
      case 'analytics':
        return <AnalyticsTab examTrackerStats={examTrackerStats} userStats={userStats} />;
      
      case 'sessions':
        return <RecentSessionsTab examTrackerStats={examTrackerStats} examcategory={examcategory} />;
      
      case 'subjects':
        return <AnalyticsTab examTrackerStats={examTrackerStats} userStats={userStats} />;
      
      default:
        return <PublicDashboard tests={tests} examcategory={examcategory} />;
    }
  };

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Navbar />
      
      <div className="max-w-7xl mt-16 sm:mt-20 mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8">
        {/* Modern Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-6 lg:p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-white opacity-10 rounded-full -mr-16 sm:-mr-24 lg:-mr-32 -mt-16 sm:-mt-24 lg:-mt-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 lg:w-48 lg:h-48 bg-white opacity-10 rounded-full -ml-12 sm:-ml-18 lg:-ml-24 -mb-12 sm:-mb-18 lg:-mb-24"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                  {examcategory?.toUpperCase() || 'GATE CSE'} Mock Tests
                </h1>
                <p className="text-base lg:text-lg text-blue-100 mb-4 leading-relaxed">
                  Master your skills with comprehensive practice tests and AI-powered insights
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">AI Analytics</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Performance Tracking</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">Personalized Learning</span>
                  </div>
                </div>
              </div>
              
              <div className="lg:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
                  <div className="text-2xl lg:text-3xl font-bold mb-2">{tests.length}</div>
                  <div className="text-sm text-blue-100">Available Tests</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isAuthenticated={!!user} 
        />

        {/* Tab Content */}
        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
          <div className="animate-fade-in">
            {renderTabContent()}
          </div>
        </Suspense>


      </div>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: 'linear-gradient(90deg, #1F2937 0%, #374151 100%)',
            color: '#F9FAFB',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            fontSize: '14px',
            padding: '12px 16px',
            maxWidth: '90vw',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}
