"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import { 
  BookOpen, 
  Clock, 
  Users, 
  BarChart3,
  Play,
  Eye,
  Calendar,
  Plus,
  Settings,
  TrendingUp,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  PieChart,
  Timer,
  AlertCircle,
  ChevronRight,
  Activity,
  Flame,
  Star,
  Zap,
  Brain,
  Trophy,
  ArrowRight,
  RefreshCw,
  Home,
  LineChart,
  Layers,
  Sparkles,
  Gauge,
  TrendingDown,
  Hexagon,
  CircularProgress
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Enhanced Loading Components
const FullPageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="relative mb-8">
        <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 w-24 h-24 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-4 w-16 h-16 border-2 border-purple-400 rounded-full border-b-transparent animate-spin animate-reverse" style={{ animationDuration: '1.5s' }}></div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-800 animate-pulse">Loading GATE CSE Dashboard</h3>
        <p className="text-gray-600 animate-pulse">Preparing your analytics and test data...</p>
        <div className="flex items-center justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  </div>
);

const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="flex items-center">
      <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg"></div>
      <div className="ml-4 flex-1">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

const TestCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
      <div className="flex space-x-2 pt-2">
        <div className="flex-1 h-10 bg-blue-200 rounded-lg"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

// Enhanced Stats Card with Animations
const AnimatedStatsCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color = "blue", 
  trend = null,
  delay = 0,
  onClick = null,
  loading = false,
  gradient = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);

  const colorClasses = {
    blue: gradient 
      ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700" 
      : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
    green: gradient 
      ? "bg-gradient-to-br from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700"
      : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100",
    purple: gradient 
      ? "bg-gradient-to-br from-purple-400 to-purple-600 text-white hover:from-purple-500 hover:to-purple-700"
      : "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
    orange: gradient 
      ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700"
      : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100",
    red: gradient 
      ? "bg-gradient-to-br from-red-400 to-red-600 text-white hover:from-red-500 hover:to-red-700"
      : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
    yellow: gradient 
      ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white hover:from-yellow-500 hover:to-yellow-700"
      : "bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100"
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Animate numeric values
      if (typeof value === 'string' && value.includes('%')) {
        const numValue = parseInt(value);
        if (!isNaN(numValue)) {
          let current = 0;
          const increment = numValue / 30;
          const animation = setInterval(() => {
            current += increment;
            if (current >= numValue) {
              setAnimatedValue(numValue);
              clearInterval(animation);
            } else {
              setAnimatedValue(Math.floor(current));
            }
          }, 50);
        }
      } else if (typeof value === 'number') {
        let current = 0;
        const increment = value / 30;
        const animation = setInterval(() => {
          current += increment;
          if (current >= value) {
            setAnimatedValue(value);
            clearInterval(animation);
          } else {
            setAnimatedValue(Math.floor(current));
          }
        }, 50);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  if (loading) {
    return <StatsCardSkeleton />;
  }

  const displayValue = typeof value === 'string' && value.includes('%') 
    ? `${animatedValue}%` 
    : typeof value === 'number' 
      ? animatedValue 
      : value;

  return (
    <div 
      className={`transform transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${onClick ? 'cursor-pointer' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
      onClick={onClick}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group overflow-hidden relative">
        {/* Floating elements for visual appeal */}
        <div className="absolute -top-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-300"></div>
        <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-all duration-300 shadow-lg`}>
              <Icon className="h-7 w-7" />
            </div>
            {trend !== null && (
              <div className={`flex items-center text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 ${
                trend > 0 ? 'bg-green-100 text-green-700' : 
                trend < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : 
                 trend < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                {trend > 0 ? '+' : ''}{trend}%
              </div>
            )}
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2 transition-all duration-200 group-hover:text-blue-600">
            {displayValue}
          </h3>
          <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

// Performance Ring Chart with Animation
const AnimatedPerformanceRing = ({ 
  percentage, 
  size = 140, 
  strokeWidth = 10, 
  color = "#3B82F6", 
  delay = 0,
  showLabel = true,
  label = ""
}) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const increment = percentage / 60;
      const animation = setInterval(() => {
        current += increment;
        if (current >= percentage) {
          setAnimatedPercentage(percentage);
          clearInterval(animation);
        } else {
          setAnimatedPercentage(current);
        }
      }, 30);
    }, delay);

    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="relative inline-flex flex-col items-center justify-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
          <defs>
            <linearGradient id={`gradient-${delay}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={`${color}CC`} />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gradient-${delay})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{Math.round(animatedPercentage)}%</span>
          {showLabel && label && (
            <span className="text-xs text-gray-600 mt-1 text-center">{label}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Test Card
const AnimatedTestCard = ({ test, onStartTest, onPreview, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-gradient-to-r from-green-100 to-green-200';
      case 'medium': return 'text-yellow-600 bg-gradient-to-r from-yellow-100 to-yellow-200';
      case 'hard': return 'text-red-600 bg-gradient-to-r from-red-100 to-red-200';
      case 'mixed': return 'text-purple-600 bg-gradient-to-r from-purple-100 to-purple-200';
      default: return 'text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200';
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div 
      className={`transform transition-all duration-700 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 group relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          <div className="mb-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {test.name}
              </h4>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(test.difficulty)} shadow-sm`}>
                  {test.difficulty || 'Mixed'}
                </span>
                {test.userCompleted && (
                  <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Completed</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {test.description || 'Comprehensive GATE CSE preparation test'}
            </p>
            
            {test.userBestScore !== null && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-800">Your Best Score</span>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span className="text-xl font-bold text-blue-600">{test.userBestScore}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="font-medium">{test.total_questions} Questions</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="font-medium">{formatDuration(test.duration)}</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="font-medium">{test.attemptCount} Attempts</span>
            </div>
            <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-500" />
              <span className="font-medium">{new Date(test.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => onStartTest(test)}
              className={`flex-1 text-white px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center group-hover:scale-105 transform shadow-lg ${
                test.userCompleted 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }`}
            >
              {test.userCompleted ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Attempted - See Solution
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Test
                </>
              )}
              <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onPreview(test)}
              className="bg-gray-100 text-gray-700 px-6 py-4 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center group-hover:scale-105 transform"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Tab Component
const AnimatedTab = ({ tabs, activeTab, onTabChange }) => (
  <div className="mb-8">
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
      <nav className="flex space-x-2" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 relative flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  </div>
);

// Main Component
export default function EnhancedGateCseMockTestPage() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [userStats, setUserStats] = useState({
    completedTests: 0,
    averageScore: 0,
    totalStudyTime: 0,
    bestScore: 0,
    recentAttempts: []
  });
  const [examTrackerStats, setExamTrackerStats] = useState({
    totalAttempts: 0,
    averageAccuracy: 0,
    totalTimeSpent: 0,
    questionsAttempted: 0,
    subjectWisePerformance: [],
    recentAttempts: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingExamTracker, setIsLoadingExamTracker] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('analytics');

  // Check if user is admin
  const isAdmin = user?.email === 'jain10gunjan@gmail.com';

  const tabs = [
    { id: 'analytics', name: 'Analytics & Overview', icon: BarChart3 },
    { id: 'mock-tests', name: 'Mock Tests', icon: BookOpen }
  ];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    setIsLoadingStats(true);
    setIsLoadingExamTracker(true);
    
    try {
      await Promise.all([
        fetchAvailableTests(),
        fetchUserStats(),
        fetchExamTrackerData()
      ]);
      
      toast.success('Dashboard loaded successfully! 🚀', {
        duration: 2000,
        style: {
          background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
          color: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
        },
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  const fetchAvailableTests = async () => {
    try {
      const { data: testsData, error: testsError } = await supabase
        .from('mock_tests')
        .select(`
          id, name, description, duration, total_questions,
          difficulty, category, created_at, created_by
        `)
        .eq('is_active', true)
        .eq('category', 'GATE-CSE')
        .order('created_at', { ascending: false });

      if (testsError) throw testsError;

      const testsWithDetails = await Promise.all(
        testsData.map(async (test) => {
          const { count } = await supabase
            .from('user_test_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', test.id);

          const { data: userAttempt } = await supabase
            .from('user_test_attempts')
            .select('score, completed_at, is_completed')
            .eq('test_id', test.id)
            .or(`user_email.eq.${user.email},user_id.eq.${user.id || 'null'}`)
            .eq('is_completed', true)
            .order('score', { ascending: false })
            .limit(1);

          return {
            ...test,
            attemptCount: count || 0,
            userBestScore: userAttempt?.[0]?.score || null,
            userCompleted: userAttempt?.[0]? true : false,
            lastAttempted: userAttempt?.[0]?.completed_at || null
          };
        })
      );

      setTests(testsWithDetails);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data: completedTests } = await supabase
        .from('user_test_attempts')
        .select(`
          *
        `)
        .eq('user_email', user?.email)
        .eq('is_completed', true)
        .order('completed_at', { ascending: false });

      const completedCount = completedTests?.length || 0;
      const scores = completedTests?.map(test => test.score || 0) || [];
      const averageScore = completedCount > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / completedCount 
        : 0;
      const bestScore = completedCount > 0 ? Math.max(...scores) : 0;
      const totalStudyTime = completedTests?.reduce((sum, test) => sum + (test.duration_taken || 0), 0) || 0;

      setUserStats({
        completedTests: completedCount,
        averageScore: Math.round(averageScore * 100) / 100,
        bestScore: Math.round(bestScore * 100) / 100,
        totalStudyTime: Math.round(totalStudyTime / 60),
        recentAttempts: completedTests?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchExamTrackerData = async () => {
    if (!user) return;

    try {
      const { data: attempts } = await supabase
        .from('user_test_attempts')
        .select(`
          *
        `)
        .eq('user_email', user.email)
        .eq('is_completed', true)
        .order('created_at', { ascending: false });

      const totalAttempts = attempts?.length || 0;
      const totalQuestions = attempts?.reduce((sum, a) => sum + (a.total_questions || 0), 0) || 0;
      const correctAnswers = attempts?.reduce((sum, a) => sum + (a.correct_answers || 0), 0) || 0;
      const averageAccuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      const totalTimeSpent = attempts?.reduce((sum, a) => sum + (a.duration_taken || 0), 0) || 0;

      const subjectPerformance = new Map();
      attempts?.forEach(attempt => {
        try {
          const answersArray = typeof attempt.answers === 'string' 
            ? JSON.parse(attempt.answers) 
            : attempt.answers;
          
          if (Array.isArray(answersArray)) {
            answersArray.forEach(ans => {
              const subject = ans.subject || 'General';
              if (!subjectPerformance.has(subject)) {
                subjectPerformance.set(subject, { correct: 0, total: 0 });
              }
              const subjectData = subjectPerformance.get(subject);
              subjectData.total++;
              if (ans.isCorrect) subjectData.correct++;
            });
          }
        } catch (e) {
          console.error('Error parsing answers JSON:', e);
        }
      });

      const subjectWisePerformance = Array.from(subjectPerformance.entries()).map(([subject, data]) => ({
        subject,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        attempted: data.total,
        correct: data.correct
      }));

      setExamTrackerStats({
        totalAttempts,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        totalTimeSpent: Math.round(totalTimeSpent),
        questionsAttempted: totalQuestions,
        subjectWisePerformance,
        recentAttempts: attempts?.slice(0, 5) || []
      });
    } catch (error) {
      console.error('Error fetching examtracker data:', error);
    } finally {
      setIsLoadingExamTracker(false);
    }
  };

  const handleStartTest = (test) => {
    toast.success(`🚀 Starting ${test.name}...`, {
      style: {
        background: 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)',
        color: '#fff',
        borderRadius: '12px',
      },
    });
    // Navigation logic here
  };

  const handlePreviewTest = (test) => {
    toast.success(`👁️ Opening ${test.name} preview...`);
    // Preview logic here
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (test.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || 
                             (test.difficulty?.toLowerCase() === difficultyFilter);
    return matchesSearch && matchesDifficulty;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md mx-4 transform hover:scale-105 transition-all duration-300">
          <div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to GATE CSE</h2>
          <p className="text-gray-600 mb-6">Sign in to access comprehensive mock tests, detailed analytics, and track your preparation progress</p>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
            Sign In to Continue
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || isLoadingStats || isLoadingExamTracker) {
    return <FullPageLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-2xl border-b border-gray-200 backdrop-blur-sm bg-white/95 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 shadow-lg">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  GATE CSE Mock Tests
                </h1>
                <p className="text-gray-600 mt-2 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Master Computer Science Engineering with AI-powered insights
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center transform hover:scale-105 shadow-lg"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              {isAdmin && (
                <>
                  <Link
                    href="/gate-cse/mock-test/create"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center transform hover:scale-105 shadow-lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Test
                  </Link>
                  <Link
                    href="/gate-cse/mock-test/admin"
                    className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-violet-700 transition-all duration-200 flex items-center transform hover:scale-105 shadow-lg"
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    Admin Panel
                  </Link>
                </>
              )}
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-6 py-3 rounded-xl border border-blue-200 shadow-sm">
                <span className="font-semibold">Hello, {user.email?.split('@')[0]}! 👋</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <AnimatedTab tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Analytics & Overview Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <AnimatedStatsCard
                icon={BookOpen}
                title="Available Tests"
                value={tests.length}
                subtitle="Ready for practice"
                color="blue"
                delay={100}
                loading={isLoading}
                gradient={true}
              />
              <AnimatedStatsCard
                icon={CheckCircle}
                title="Tests Completed"
                value={userStats.completedTests}
                subtitle="Great progress!"
                color="green"
                delay={200}
                loading={isLoadingStats}
                gradient={true}
              />
              <AnimatedStatsCard
                icon={Trophy}
                title="Average Score"
                value={userStats.completedTests > 0 ? `${userStats.averageScore}%` : '--'}
                subtitle="Keep improving"
                color="purple"
                trend={userStats.completedTests > 5 ? 15 : null}
                delay={300}
                loading={isLoadingStats}
                gradient={true}
              />
              <AnimatedStatsCard
                icon={Award}
                title="Best Score"
                value={userStats.completedTests > 0 ? `${userStats.bestScore}%` : '--'}
                subtitle="Personal best"
                color="yellow"
                delay={400}
                loading={isLoadingStats}
                gradient={true}
              />
              <AnimatedStatsCard
                icon={Clock}
                title="Study Time"
                value={`${userStats.totalStudyTime}h`}
                subtitle="Total practice"
                color="orange"
                delay={500}
                loading={isLoadingStats}
                gradient={true}
              />
            </div>

            {/* Performance Analytics */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 px-8 py-6">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <Gauge className="h-6 w-6 mr-3" />
                  Performance Analytics Dashboard
                </h3>
                <p className="text-purple-100 mt-2">Comprehensive insights into your learning journey</p>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                  <div className="text-center">
                    <AnimatedPerformanceRing 
                      percentage={Math.min(examTrackerStats.totalAttempts * 10, 100)} 
                      color="#8B5CF6" 
                      delay={200}
                      label="Test Sessions"
                    />
                    <h4 className="text-xl font-bold text-gray-900 mt-4">Test Sessions</h4>
                    <p className="text-3xl font-bold text-purple-600">{examTrackerStats.totalAttempts}</p>
                    <p className="text-sm text-gray-600">Total attempts</p>
                  </div>
                  
                  <div className="text-center">
                    <AnimatedPerformanceRing 
                      percentage={examTrackerStats.averageAccuracy} 
                      color="#10B981" 
                      delay={400}
                      label="Accuracy"
                    />
                    <h4 className="text-xl font-bold text-gray-900 mt-4">Accuracy</h4>
                    <p className="text-sm text-gray-600">Overall performance</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full w-36 h-36 flex items-center justify-center mx-auto shadow-lg">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600">{examTrackerStats.questionsAttempted}</div>
                        <div className="text-sm text-blue-700 font-medium">Questions</div>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mt-4">Questions Attempted</h4>
                    <p className="text-sm text-gray-600">Practice volume</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-orange-100 to-red-200 rounded-full w-36 h-36 flex items-center justify-center mx-auto shadow-lg">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-orange-600">{Math.round(examTrackerStats.totalTimeSpent / 60)}h</div>
                        <div className="text-sm text-orange-700 font-medium">Study Time</div>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900 mt-4">Time Invested</h4>
                    <p className="text-sm text-gray-600">Learning dedication</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Performance & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Subject Performance */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Subject-wise Performance
                  </h3>
                </div>
                <div className="p-6">
                  {examTrackerStats.subjectWisePerformance.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg text-gray-600 font-medium">No subject data available</p>
                      <p className="text-sm text-gray-500 mt-2">Complete tests to see detailed analytics</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {examTrackerStats.subjectWisePerformance.map((subject, index) => (
                        <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-gray-900">{subject.subject}</h4>
                            <span className={`text-lg font-bold px-3 py-1 rounded-full ${
                              subject.accuracy >= 80 ? 'text-green-600 bg-green-100' :
                              subject.accuracy >= 60 ? 'text-yellow-600 bg-yellow-100' :
                              subject.accuracy >= 40 ? 'text-orange-600 bg-orange-100' : 'text-red-600 bg-red-100'
                            }`}>
                              {subject.accuracy.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600 mb-3">
                            <span className="font-medium">{subject.correct}/{subject.attempted} correct</span>
                            <span>{subject.attempted} questions total</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                            <div
                              className={`h-3 rounded-full transition-all duration-1000 shadow-sm ${
                                subject.accuracy >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                subject.accuracy >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                subject.accuracy >= 40 ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 
                                'bg-gradient-to-r from-red-400 to-red-600'
                              }`}
                              style={{ width: `${subject.accuracy}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Test Sessions */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Recent Test Sessions
                  </h3>
                </div>
                <div className="p-6">
                  {examTrackerStats.recentAttempts.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg text-gray-600 font-medium">No test attempts found</p>
                      <p className="text-sm text-gray-500 mt-2">Start practicing to see your progress</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {examTrackerStats.recentAttempts.map((attempt, index) => (
                        <div key={attempt.id} className="p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-gray-900">Test Session #{examTrackerStats.recentAttempts.length - index}</h4>
                              <p className="text-sm text-gray-600 font-medium">
                                {new Date(attempt.created_at).toLocaleDateString()} • {new Date(attempt.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${getScoreColor(attempt.percentage)}`}>
                                {attempt.percentage}%
                              </p>
                              <p className="text-sm text-gray-600 font-medium">
                                {attempt.correct_answers}/{attempt.total_questions} correct
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="text-center p-3 bg-blue-100 rounded-lg">
                              <p className="text-blue-600 font-bold text-lg">{attempt.attempted_questions}</p>
                              <p className="text-blue-700 font-medium">Attempted</p>
                            </div>
                            <div className="text-center p-3 bg-green-100 rounded-lg">
                              <p className="text-green-600 font-bold text-lg">{attempt.correct_answers}</p>
                              <p className="text-green-700 font-medium">Correct</p>
                            </div>
                            <div className="text-center p-3 bg-red-100 rounded-lg">
                              <p className="text-red-600 font-bold text-lg">{attempt.wrong_answers}</p>
                              <p className="text-red-700 font-medium">Wrong</p>
                            </div>
                            <div className="text-center p-3 bg-gray-100 rounded-lg">
                              <p className="text-gray-600 font-bold text-lg">{attempt.unanswered}</p>
                              <p className="text-gray-700 font-medium">Skipped</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-between items-center">
                            <div className="text-sm text-gray-600 font-medium">
                              <Clock className="h-4 w-4 inline mr-1" />
                              Duration: {formatDuration(attempt.duration_taken)}
                            </div>
                            <Link
                              href={`/gate-cse/mock-test/results/${attempt.id}`}
                              className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center transition-colors bg-blue-50 px-3 py-1 rounded-lg hover:bg-blue-100"
                            >
                              View Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl border border-blue-200 p-8 shadow-lg">
              <h3 className="text-2xl font-bold mb-6 flex items-center text-blue-900">
                <Zap className="h-6 w-6 mr-3" />
                AI Performance Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur p-6 rounded-xl shadow-sm">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Strong Areas
                  </h4>
                  <p className="text-blue-800">
                    {examTrackerStats.subjectWisePerformance
                      .filter(s => s.accuracy >= 70)
                      .map(s => s.subject)
                      .join(', ') || 'Keep practicing to discover your strengths! 💪'}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur p-6 rounded-xl shadow-sm">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Focus Areas
                  </h4>
                  <p className="text-blue-800">
                    {examTrackerStats.subjectWisePerformance
                      .filter(s => s.accuracy < 60)
                      .map(s => s.subject)
                      .join(', ') || 'Excellent progress across all areas! 🎯'}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur p-6 rounded-xl shadow-sm">
                  <h4 className="font-bold text-blue-900 mb-2 flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    AI Recommendation
                  </h4>
                  <p className="text-blue-800">
                    {examTrackerStats.averageAccuracy >= 70 
                      ? 'Ready for harder challenges! Try advanced level tests 🚀' 
                      : 'Focus on fundamentals. Review concepts and practice more 📚'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mock Tests Tab */}
        {activeTab === 'mock-tests' && (
          <div className="space-y-8">
            {/* Enhanced Search and Filter */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tests by name, description, or topic..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
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
            </div>

            {/* Tests Grid */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Hexagon className="h-6 w-6 mr-3 text-blue-600" />
                  Available Tests ({filteredTests.length})
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Layers className="h-4 w-4" />
                  <span>Updated live</span>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map(i => <TestCardSkeleton key={i} />)}
                </div>
              ) : filteredTests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl shadow-2xl border border-gray-100">
                  <div className="bg-gradient-to-br from-gray-100 to-blue-100 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
                    <BookOpen className="h-16 w-16 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-600 mb-4">
                    {searchTerm || difficultyFilter !== 'all' ? 'No tests found' : 'No tests available'}
                  </h3>
                  <p className="text-gray-500 mb-8 text-lg">
                    {searchTerm || difficultyFilter !== 'all' 
                      ? 'Try adjusting your search criteria or filters' 
                      : 'New comprehensive tests will appear here soon'}
                  </p>
                  {(searchTerm || difficultyFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setDifficultyFilter('all');
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 font-semibold shadow-lg"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredTests.map((test, index) => (
                    <AnimatedTestCard
                      key={test.id}
                      test={test}
                      onStartTest={handleStartTest}
                      onPreview={handlePreviewTest}
                      delay={index * 100}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <Link href="/gate-cse/mock-test/results" className="group">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                    Detailed Results
                  </h3>
                  <p className="text-gray-600 mt-1">Complete performance analysis with insights</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/gate-cse/mock-test/analytics" className="group">
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                    Advanced Analytics
                  </h3>
                  <p className="text-gray-600 mt-1">AI-powered insights & learning trends</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/practice" className="group">
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-orange-100">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-4 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                    Practice Questions
                  </h3>
                  <p className="text-gray-600 mt-1">Individual question practice with tracking</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(90deg, #1F2937 0%, #374151 100%)',
            color: '#F9FAFB',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
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