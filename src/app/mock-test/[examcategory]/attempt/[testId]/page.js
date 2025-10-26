"use client";
import React, { 
  useState, 
  useReducer, 
  useEffect, 
  useCallback, 
  useMemo,
  memo,
  lazy,
  Suspense 
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { createClient } from "@supabase/supabase-js";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import {
  Clock, ChevronRight, ChevronLeft, BookOpen, LineChart, AlertTriangle,
  CheckCircle, XCircle, Flag, Timer, Trophy, Target, Menu, X, Play,
  BarChart3, Zap, Brain, Star, Award, TrendingUp, Save, SkipForward,
  RefreshCw, Wifi, WifiOff, Battery, Signal, ArrowLeft, Home,
  Calendar, User, CheckSquare, AlertCircle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Enhanced utility functions
const sanitizeData = (value, type = 'string', defaultValue = null) => {
  if (value === null || value === undefined) return defaultValue;
  
  switch (type) {
    case 'number':
      const num = Number(value);
      return isNaN(num) ? (defaultValue || 0) : num;
    case 'array':
      return Array.isArray(value) ? value.filter(item => item != null) : (defaultValue || []);
    case 'object':
      return typeof value === 'object' && value !== null ? value : (defaultValue || {});
    case 'boolean':
      return Boolean(value);
    default:
      return String(value).trim();
  }
};

const calculateComprehensiveStats = (answerHistory, questionsQueue, markedForReview, timeData) => {
  const totalQuestions = sanitizeData(questionsQueue?.length, 'number', 0);
  const answers = sanitizeData(answerHistory, 'array', []);
  const marked = sanitizeData(markedForReview, 'array', []);
  
  const attempted = answers.length;
  const correct = answers.filter(a => a?.isCorrect === true).length;
  const incorrect = answers.filter(a => a?.isCorrect === false).length;
  const skipped = Math.max(0, totalQuestions - attempted);
  const markedCount = marked.length;
  
  const score = correct * 100;
  const percentage = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 10000) / 100 : 0;
  const attemptPercentage = totalQuestions > 0 ? Math.round((attempted / totalQuestions) * 10000) / 100 : 0;
  
  // Subject-wise analysis
  const subjectStats = {};
  answers.forEach(answer => {
    if (answer?.subject) {
      const subject = answer.subject;
      if (!subjectStats[subject]) {
        subjectStats[subject] = { attempted: 0, correct: 0, incorrect: 0, totalTime: 0 };
      }
      subjectStats[subject].attempted++;
      if (answer.isCorrect) subjectStats[subject].correct++;
      else subjectStats[subject].incorrect++;
      subjectStats[subject].totalTime += sanitizeData(answer.timeSpent, 'number', 0);
    }
  });
  
  Object.keys(subjectStats).forEach(subject => {
    const stats = subjectStats[subject];
    stats.percentage = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 10000) / 100 : 0;
    stats.avgTime = stats.attempted > 0 ? Math.round(stats.totalTime / stats.attempted) : 0;
  });
  
  return {
    totalQuestions,
    attempted,
    correct,
    incorrect,
    skipped,
    markedCount,
    score,
    percentage,
    attemptPercentage,
    subjectStats,
    timeSpent: sanitizeData(timeData?.totalTimeSpent, 'number', 0),
    avgTimePerQuestion: attempted > 0 ? Math.round(timeData?.totalTimeSpent / attempted) : 0
  };
};

// Enhanced state management with better mobile handling
const initialState = {
  // Core test data
  currentQuestion: null,
  userAnswer: "",
  questionsQueue: [],
  currentQuestionIndex: 0,
  
  // Answer tracking with dual storage
  answerHistory: [],
  answerSummary: {},
  answeredQuestionIds: [],
  markedForReview: [],
  
  // Test state
  testStarted: false,
  testDuration: 0,
  testStartTime: null,

  
  // Statistics
  questionsAnswered: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  points: 0,
  
  // UI state - Mobile-first
  sidebarOpen: false,
  showQuestionGrid: false,
  showStats: false,
  isOnline: true,
  autoSaveEnabled: true,
  lastSaved: null,
  
  // Mobile-specific
  swipeDirection: null,
  touchStart: null,
  showMobileMenu: false,
  
  // Performance tracking
  questionStartTime: 0,
  navigationHistory: [],
  interactionLog: []
};

const reducer = (state, action) => {
  const newState = { ...state };
  
  switch (action.type) {
    case "LOAD_TEST":
      return { ...newState, ...action.payload };
      
      case "START_TEST":
        return { 
          ...newState, 
          ...action.payload, 
          testStarted: true,
          testStartTime: Date.now(), // Add this
          questionStartTime: Date.now(),
          sidebarOpen: false
        };
      
      
    case "ANSWER_QUESTION":
      const interactionLog = [...state.interactionLog, {
        type: 'answer',
        questionId: state.currentQuestion?.id,
        answer: action.payload.userAnswer,
        timestamp: Date.now(),
        timeSpent: action.payload.timeSpent || 0
      }];
      
      return { 
        ...newState, 
        ...action.payload,
        interactionLog: interactionLog.slice(-100)
      };
      
    case "NEXT_QUESTION":
      const navigationLog = [...state.navigationHistory, {
        from: state.currentQuestionIndex,
        to: action.payload.currentQuestionIndex,
        timestamp: Date.now()
      }];
      
      return { 
        ...newState, 
        ...action.payload, 
        timeSpent: 0,
        questionStartTime: Date.now(),
        navigationHistory: navigationLog.slice(-50),
        showQuestionGrid: false,
        sidebarOpen: false
      };
      
    // case "UPDATE_TIME":
    //   return { 
    //     ...newState, 
    //     timeSpent: state.timeSpent + 1, 
    //     totalTime: state.totalTime + 1,
    //     timeRemaining: Math.max(0, state.timeRemaining - 1)
    //   };
      
    case "MARK_FOR_REVIEW":
      return { ...newState, ...action.payload };
      
    case "TOGGLE_SIDEBAR":
      return { ...newState, sidebarOpen: !state.sidebarOpen };
      
    case "TOGGLE_QUESTION_GRID":
      return { ...newState, showQuestionGrid: !state.showQuestionGrid };
      
    case "TOGGLE_MOBILE_MENU":
      return { ...newState, showMobileMenu: !state.showMobileMenu };
      
    case "UPDATE_CONNECTION":
      return { ...newState, isOnline: action.payload };
      
    case "AUTO_SAVE_SUCCESS":
      return { ...newState, lastSaved: new Date().toISOString() };
      
    case "SET_SWIPE":
      return { ...newState, swipeDirection: action.payload };
      
    case "RESET_TEST":
      return { ...initialState };
      
    default:
      return newState;
  }
};

// Memoized Progress Ring Component
const ProgressRing = memo(({ progress, size = 60, strokeWidth = 4, className = "", showPercentage = true }) => {
  const validProgress = Math.max(0, Math.min(100, sanitizeData(progress, 'number', 0)));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (validProgress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-600 transition-all duration-500 ease-out"
          strokeLinecap="round"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold text-gray-700">
            {Math.round(validProgress)}%
          </span>
        </div>
      )}
    </div>
  );
});

ProgressRing.displayName = 'ProgressRing';

// REPLACE your existing TimerDisplay with this self-contained version:
const TimerDisplay = memo(({ 
  testDuration, 
  testStarted, 
  testStartTime,
  onTimeEnd, 
  onTimeWarning,
  className = "" 
}) => {
  const [timeRemaining, setTimeRemaining] = useState(testDuration);

  const formatTime = useCallback((seconds) => {
    const validSeconds = Math.max(0, sanitizeData(seconds, 'number', 0));
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    const secs = validSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!testStarted || !testStartTime) {
      setTimeRemaining(testDuration);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - testStartTime) / 1000);
      const remaining = Math.max(0, testDuration - elapsed);
      
      setTimeRemaining(remaining);

      // Handle warnings
      if (remaining === 600) {
        onTimeWarning?.(remaining, '⚠️ 10 minutes left!');
      } else if (remaining === 300) {
        onTimeWarning?.(remaining, '🚨 5 minutes left!');
      } else if (remaining === 60) {
        onTimeWarning?.(remaining, '⏰ Final minute!');
      }

      if (remaining === 0) {
        onTimeEnd?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [testStarted, testStartTime, testDuration, onTimeEnd, onTimeWarning]);

  const progress = testDuration > 0 ? ((testDuration - timeRemaining) / testDuration) * 100 : 0;
  const isWarning = timeRemaining <= 300;
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <ProgressRing 
        progress={progress} 
        size={32} 
        strokeWidth={3} 
        showPercentage={false}
        className={isWarning ? 'text-red-500' : 'text-blue-500'}
      />
      <div className={`font-mono text-sm md:text-lg font-bold ${
        isWarning ? 'text-red-600' : 'text-gray-800'
      }`}>
        {formatTime(timeRemaining)}
      </div>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';


// Mobile Connection Status Component
const ConnectionStatus = memo(({ isOnline, lastSaved }) => (
  <div className="flex items-center space-x-1 text-xs">
    {isOnline ? (
      <Wifi className="h-3 w-3 text-green-500" />
    ) : (
      <WifiOff className="h-3 w-3 text-red-500" />
    )}
    <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
      {isOnline ? 'Online' : 'Offline'}
    </span>
    {lastSaved && (
      <span className="text-gray-500 hidden sm:inline">
        • Saved {new Date(lastSaved).toLocaleTimeString()}
      </span>
    )}
  </div>
));

ConnectionStatus.displayName = 'ConnectionStatus';

// Mobile-First Question Grid Component
const QuestionGrid = memo(({ 
  questions, 
  currentIndex, 
  answeredIds, 
  markedIds, 
  onNavigate, 
  onClose 
}) => {
  const getQuestionStatus = useCallback((questionId, index) => {
    const isAnswered = answeredIds.includes(questionId);
    const isMarked = markedIds.includes(questionId);
    const isCurrent = index === currentIndex;

    if (isCurrent) return "bg-blue-600 text-white scale-105 ring-2 ring-blue-300";
    if (isAnswered && isMarked) return "bg-purple-500 text-white";
    if (isAnswered) return "bg-green-500 text-white";
    if (isMarked) return "bg-yellow-500 text-white";
    return "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400";
  }, [answeredIds, markedIds, currentIndex]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Questions</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-96">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {questions.map((q, index) => (
              <button
                key={q.id || index}
                className={`
                  p-3 text-sm font-semibold rounded-lg transition-all duration-200 
                  touch-manipulation active:scale-95
                  ${getQuestionStatus(q.id, index)}
                `}
                onClick={() => {
                  onNavigate(index);
                  onClose();
                }}
                title={`Question ${index + 1}`}
              >
                {index + 1}
                {markedIds.includes(q.id) && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
          
          {/* Mobile Legend */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h5 className="text-xs font-semibold text-gray-700 mb-2">Legend</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Marked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-200 rounded"></div>
                <span>Pending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

QuestionGrid.displayName = 'QuestionGrid';

// Previous Attempt Check Component
const PreviousAttemptCard = memo(({ attempt, onViewResult, onRetakeTest }) => (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <CheckCircle className="h-8 w-8 text-green-600" />
        <div>
          <h3 className="text-xl font-bold text-gray-900">Test Already Attempted</h3>
          <p className="text-gray-600">You have previously taken this test</p>
        </div>
      </div>
    </div>
    
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="text-center p-3 bg-blue-50 rounded-lg">
        <div className="text-2xl font-bold text-blue-700">{attempt.score || 0}</div>
        <div className="text-blue-600 text-sm">Score</div>
      </div>
      <div className="text-center p-3 bg-green-50 rounded-lg">
        <div className="text-2xl font-bold text-green-700">{attempt.percentage || 0}%</div>
        <div className="text-green-600 text-sm">Percentage</div>
      </div>
      <div className="text-center p-3 bg-purple-50 rounded-lg">
        <div className="text-2xl font-bold text-purple-700">{attempt.attempted_questions || 0}</div>
        <div className="text-purple-600 text-sm">Attempted</div>
      </div>
      <div className="text-center p-3 bg-orange-50 rounded-lg">
        <div className="text-2xl font-bold text-orange-700">{attempt.duration_taken || 0}m</div>
        <div className="text-orange-600 text-sm">Time Taken</div>
      </div>
    </div>
    
    <div className="mb-6">
      <p className="text-sm text-gray-600 mb-2">
        <Calendar className="h-4 w-4 inline mr-1" />
        Attempted on: {new Date(attempt.submitted_at).toLocaleDateString()}
      </p>
      <p className="text-sm text-gray-600">
        <User className="h-4 w-4 inline mr-1" />
        Status: <span className="font-semibold capitalize">{attempt.status}</span>
      </p>
    </div>
    
    <div className="flex flex-col sm:flex-row gap-3">
      {attempt.status === 'completed' ? (
        <button
        onClick={onViewResult}
        className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <Trophy className="h-5 w-5 mr-2" />
        View Results
      </button>
      ) : 
      <button
        onClick={onRetakeTest}
        className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
      >
        <RefreshCw className="h-5 w-5 mr-2" />
        Start Test
      </button>}
    </div>
  </div>
));

PreviousAttemptCard.displayName = 'PreviousAttemptCard';

// Main Component
export default function EnhancedMobileMockTestPage() {
    const { examcategory, testId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [testInfo, setTestInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [previousAttempt, setPreviousAttempt] = useState(null);
  const [allowRetake, setAllowRetake] = useState(false);

 // Optimized MathJax config
 const config = useMemo(() => ({
  "fast-preview": { disabled: false },
  tex: { 
    inlineMath: [["$", "$"], ["\\(", "\\)"]], 
    displayMath: [["$$", "$$"], ["\\[", "\\]"]],
    processEscapes: true,
  },
  messageStyle: "none",
  showMathMenu: false,
}), []);

console.log("Running");
  // Enhanced time formatting - MOVED INSIDE COMPONENT
  const formatTime = useCallback((seconds) => {
    const validSeconds = sanitizeData(seconds, 'number', 0);
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    const secs = validSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memoized calculations
  const currentStats = useMemo(() => 
    calculateComprehensiveStats(
      state.answerHistory, 
      state.questionsQueue, 
      state.markedForReview,
      { totalTimeSpent: state.totalTime }
    ), [state.answerHistory, state.questionsQueue, state.markedForReview, state.totalTime]
  );

  // Touch/Swipe handlers for mobile navigation
  const handleTouchStart = useCallback((e) => {
    const touchStartX = e.touches[0].clientX;
    dispatch({ type: "SET_SWIPE", payload: { startX: touchStartX } });
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!state.swipeDirection?.startX) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - state.swipeDirection.startX;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0 && state.currentQuestionIndex > 0) {
        handleNavigation('prev');
      } else if (deltaX < 0 && state.currentQuestionIndex < state.questionsQueue.length - 1) {
        handleNavigation('next');
      }
    }
    
    dispatch({ type: "SET_SWIPE", payload: null });
  }, [state.swipeDirection, state.currentQuestionIndex, state.questionsQueue.length]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: "UPDATE_CONNECTION", payload: true });
      setNetworkError(false);
    };
    const handleOffline = () => {
      dispatch({ type: "UPDATE_CONNECTION", payload: false });
      setNetworkError(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for previous attempts
  const checkPreviousAttempts = useCallback(async () => {
    if (!user?.email || !testId) return;

    try {
      const { data: attempts, error } = await supabase
        .from('user_test_attempts')
        .select(`
          id, submitted_at, score, percentage, attempted_questions, 
          duration_taken, status, is_completed
        `)
        .eq('test_id', testId)
        .eq('user_email', user.email)
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      console.log(attempts);

      if (attempts && attempts.length > 0) {
        setPreviousAttempt(attempts[0]);
        setAllowRetake(true);
      }
    } catch (error) {
      console.error('Error checking previous attempts:', error);
    }
  }, [user?.email, testId]);

  // Auto-save functionality - optimized
  const performAutoSave = useCallback(async () => {
    if (!attemptId || !state.answerHistory.length || !state.isOnline) return;

    try {
      const stats = currentStats;

      await supabase
        .from('user_test_attempts')
        .update({
          answers: state.answerHistory,
          answer2: state.answerSummary,
          attempted_questions: stats.attempted,
          correct_answers: stats.correct,
          wrong_answers: stats.incorrect,
          marked_for_review_count: stats.markedCount,
          current_question_index: state.currentQuestionIndex,
          time_spent: state.totalTime,
          last_updated: new Date().toISOString(),
          examcategory:examcategory.toUpperCase(),
          quick_stats: {
            progress: stats.attemptPercentage,
            score: stats.score,
            percentage: stats.percentage,
            subjects: Object.keys(stats.subjectStats),
            topSubject: Object.entries(stats.subjectStats)
              .sort((a, b) => b[1].percentage - a[1].percentage)[0]?.[0] || 'None'
          }
        })
        .eq('id', attemptId);

      dispatch({ type: "AUTO_SAVE_SUCCESS" });
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  }, [attemptId, state.answerHistory, state.isOnline, currentStats, state.answerSummary, state.currentQuestionIndex, state.totalTime]);

  // Auto-save effect
  useEffect(() => {
    if (state.testStarted && state.autoSaveEnabled && state.isOnline && attemptId) {
      const autoSaveInterval = setInterval(performAutoSave, 30000);
      return () => clearInterval(autoSaveInterval);
    }
  }, [state.testStarted, state.autoSaveEnabled, state.isOnline, attemptId, performAutoSave]);

  const handleTimeEnd = useCallback(async () => {
    toast.error('⏰ Time up! Auto-submitting...', { duration: 5000 });
    await submitTest(true);
  }, []);
  
  const handleTimeWarning = useCallback((timeRemaining, message) => {
    toast.error(message, { 
      duration: timeRemaining <= 60 ? 8000 : timeRemaining <= 300 ? 4000 : 3000 
    });
  }, []);
  // Load test data
  useEffect(() => {
    if (testId && user) {
      fetchTestInfo();
    }
  }, [testId, user]);

  // Check previous attempts on load
  useEffect(() => {
    if (testId && user) {
      checkPreviousAttempts();
    }
  }, [testId, user, checkPreviousAttempts]);

  const fetchTestInfo = async () => {
    try {
      setIsLoading(true);
      
      const { data: testData, error: testError } = await supabase
        .from('mock_tests')
        .select(`
          id, name, description, duration, total_questions, difficulty, category
        `)
        .eq('id', testId)
        .eq('is_active', true)
        .single();

      if (testError) throw testError;

      setTestInfo(testData);
      await fetchQuestions(testData);
    } catch (error) {
      console.error('Error fetching test:', error);
      toast.error('Failed to load test');
      router.push(`/mock-test/${examcategory}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (testData) => {
    try {
      const { data: questionData, error: questionError } = await supabase
        .from('mock_test_questions')
        .select(`question_id, question_order, subject, topic, difficulty`)
        .eq('test_id', testId)
        .order('question_order');

      if (questionError) throw questionError;
      if (!questionData?.length) {
        toast.error('No questions available');
        return;
      }

      const questionIds = questionData.map(q => q.question_id).filter(Boolean);
      const batchSize = 20;
      let allQuestions = [];

      for (let i = 0; i < questionIds.length; i += batchSize) {
        const batch = questionIds.slice(i, i + batchSize);
        const { data: batchQuestions, error: batchError } = await supabase
          .from('examtracker')
          .select(`
            _id, question, options_A, options_B, options_C, options_D, 
            correct_option, solution, subject, topic, difficulty
          `)
          .in('_id', batch);

        if (batchError) throw batchError;
        allQuestions = [...allQuestions, ...batchQuestions];
      }

      const orderedQuestions = questionData.map(orderInfo => {
        const questionDetail = allQuestions.find(q => q._id === orderInfo.question_id);
        if (!questionDetail) return null;
        
        return {
          ...questionDetail,
          id: questionDetail._id,
          order: sanitizeData(orderInfo.question_order, 'number', 0),
          subject: sanitizeData(questionDetail.subject || orderInfo.subject, 'string', 'General'),
          topic: sanitizeData(questionDetail.topic || orderInfo.topic, 'string', 'General'),
          difficulty: sanitizeData(questionDetail.difficulty || orderInfo.difficulty, 'string', 'medium')
        };
      }).filter(Boolean);

      if (!orderedQuestions.length) {
        toast.error('No valid questions found');
        return;
      }

      const testDurationInSeconds = sanitizeData(testData.duration, 'number', 60) * 60;

      dispatch({
        type: "LOAD_TEST",
        payload: {
          questionsQueue: orderedQuestions,
          currentQuestion: orderedQuestions[0],
          currentQuestionIndex: 0,
          testDuration: testDurationInSeconds,
          timeRemaining: testDurationInSeconds,
          answerHistory: [],
          answerSummary: {},
          answeredQuestionIds: [],
          markedForReview: []
        },
      });
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    }
  };

  const startTestAttempt = async () => {
    try {
      const { data: attemptData, error: attemptError } = await supabase
        .from('user_test_attempts')
        .insert({
          test_id: testId,
          user_email: sanitizeData(user?.email, 'string', 'anonymous@test.com'),
          total_questions: state.questionsQueue.length,
          started_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      setAttemptId(attemptData.id);
      dispatch({ type: "START_TEST", payload: { testStarted: true } });
      toast.success('🚀 Test started!', { duration: 2000 });
    } catch (error) {
      console.error('Error starting test:', error);
      toast.error('Failed to start test');
    }
  };

  const handleAnswerSelect = useCallback((selectedAnswer) => {
    if (!state.currentQuestion || !selectedAnswer) return;

    const questionId = state.currentQuestion.id;
    const isCorrect = selectedAnswer === state.currentQuestion.correct_option;
    const timeSpent = state.timeSpent;
    const currentTime = Date.now();

    const existingIndex = state.answerHistory.findIndex(a => a.questionId === questionId);
    
    let newAnswerHistory = [...state.answerHistory];
    let newAnswerSummary = { ...state.answerSummary };
    let newAnsweredIds = [...state.answeredQuestionIds];
    let statsUpdate = {
      questionsAnswered: state.questionsAnswered,
      correctAnswers: state.correctAnswers,
      incorrectAnswers: state.incorrectAnswers,
      points: state.points
    };

    const detailedAnswer = {
      questionId,
      question: state.currentQuestion.question,
      userAnswer: selectedAnswer,
      correctAnswer: state.currentQuestion.correct_option,
      isCorrect,
      timeSpent,
      timestamp: currentTime,
      subject: state.currentQuestion.subject,
      topic: state.currentQuestion.topic,
      difficulty: state.currentQuestion.difficulty,
      order: state.currentQuestion.order
    };

    const summaryAnswer = {
      q: questionId,
      a: selectedAnswer,
      c: state.currentQuestion.correct_option,
      r: isCorrect ? 1 : 0,
      t: timeSpent,
      s: state.currentQuestion.subject,
      d: state.currentQuestion.difficulty,
      o: state.currentQuestion.order
    };

    if (existingIndex >= 0) {
      const oldAnswer = newAnswerHistory[existingIndex];
      const wasCorrect = oldAnswer.isCorrect;
      
      newAnswerHistory[existingIndex] = detailedAnswer;
      newAnswerSummary[questionId] = summaryAnswer;
      
      if (wasCorrect !== isCorrect) {
        if (isCorrect) {
          statsUpdate.correctAnswers++;
          statsUpdate.incorrectAnswers = Math.max(0, statsUpdate.incorrectAnswers - 1);
          statsUpdate.points += 100;
        } else {
          statsUpdate.correctAnswers = Math.max(0, statsUpdate.correctAnswers - 1);
          statsUpdate.incorrectAnswers++;
          statsUpdate.points = Math.max(0, statsUpdate.points - 100);
        }
      }
    } else {
      newAnswerHistory.push(detailedAnswer);
      newAnswerSummary[questionId] = summaryAnswer;
      
      if (!newAnsweredIds.includes(questionId)) {
        newAnsweredIds.push(questionId);
        statsUpdate.questionsAnswered++;
      }
      
      if (isCorrect) {
        statsUpdate.correctAnswers++;
        statsUpdate.points += 100;
      } else {
        statsUpdate.incorrectAnswers++;
      }
    }

    dispatch({
      type: "ANSWER_QUESTION",
      payload: {
        userAnswer: selectedAnswer,
        answerHistory: newAnswerHistory,
        answerSummary: newAnswerSummary,
        answeredQuestionIds: newAnsweredIds,
        timeSpent,
        ...statsUpdate
      },
    });

    // Mobile feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    
    toast.success('✓ Saved', { duration: 1000 });
  }, [state]);

  const handleNavigation = useCallback((direction) => {
    let newIndex;
    if (direction === 'next') {
      newIndex = Math.min(state.currentQuestionIndex + 1, state.questionsQueue.length - 1);
    } else if (direction === 'prev') {
      newIndex = Math.max(state.currentQuestionIndex - 1, 0);
    } else {
      newIndex = direction;
    }

    if (newIndex !== state.currentQuestionIndex && state.questionsQueue[newIndex]) {
      const newQuestion = state.questionsQueue[newIndex];
      const existingAnswer = state.answerHistory.find(a => a.questionId === newQuestion.id);
      
      dispatch({
        type: "NEXT_QUESTION",
        payload: {
          currentQuestionIndex: newIndex,
          currentQuestion: newQuestion,
          userAnswer: existingAnswer?.userAnswer || "",
        },
      });
    }
  }, [state.currentQuestionIndex, state.questionsQueue, state.answerHistory]);

  const handleMarkForReview = useCallback(() => {
    if (!state.currentQuestion?.id) return;
    
    const questionId = state.currentQuestion.id;
    const isMarked = state.markedForReview.includes(questionId);
    const newMarked = isMarked 
      ? state.markedForReview.filter(id => id !== questionId)
      : [...state.markedForReview, questionId];
    
    dispatch({
      type: "MARK_FOR_REVIEW",
      payload: { markedForReview: newMarked }
    });
    
    toast.success(isMarked ? '🏳️ Unmarked' : '🚩 Marked for review', { duration: 1500 });
  }, [state.currentQuestion?.id, state.markedForReview]);

  const handleAutoSubmit = async () => {
    toast.error('⏰ Time up! Auto-submitting...', { duration: 5000 });
    await submitTest(true);
  };

  const submitTest = async (isAutoSubmit = false) => {
    if (!attemptId) {
      toast.error('No test session found');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const stats = currentStats;
      const timeSpentMinutes = Math.max(1, Math.round(state.totalTime / 60));

      // Create answered questions lookup map
      const answeredMap = new Map();
      state.answerHistory.forEach(answer => {
        answeredMap.set(answer.questionId, answer);
      });

      // Create lightweight answer2 object
      const answer2 = {};
      state.questionsQueue.forEach(question => {
        const userResponse = answeredMap.get(question.id);
        
        answer2[question.id] = {
          q: question.id,
          a: userResponse?.userAnswer || null,
          c: question.correct_option,
          r: userResponse?.isCorrect ? 1 : 0,
          t: userResponse?.timeSpent || 0,
          s: question.subject,
          d: question.difficulty,
          o: question.order,
          attempted: !!userResponse,
          marked: state.markedForReview.includes(question.id)
        };
      });

      // Create efficient all_questions with user response data
      const allQuestions = state.questionsQueue.map(q => {
        const userResponse = answeredMap.get(q.id);
        
        return {
          id: q.id,
          order: q.order,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty,
          correct_option: q.correct_option,
          userAnswer: userResponse?.userAnswer || null,
          isCorrect: userResponse?.isCorrect || false,
          timeSpent: userResponse?.timeSpent || 0,
          isAttempted: !!userResponse,
          isMarkedForReview: state.markedForReview.includes(q.id),
          hasContent: true
        };
      });

      // Prepare comprehensive stats
      const finalStats = {
        totalQuestions: stats.totalQuestions,
        attempted: stats.attempted,
        correct: stats.correct,
        incorrect: stats.incorrect,
        skipped: stats.skipped,
        score: stats.score,
        percentage: stats.percentage,
        subjectStats: stats.subjectStats,
        timeMetrics: {
          totalTime: state.totalTime,
          avgTimePerQuestion: stats.avgTimePerQuestion
        }
      };

      // Main submission with optimized data structure
      const submissionData = {
        submitted_at: new Date().toISOString(),
        duration_taken: timeSpentMinutes,
        attempted_questions: stats.attempted,
        correct_answers: stats.correct,
        wrong_answers: stats.incorrect,
        unanswered: stats.skipped,
        score: stats.score,
        percentage: stats.percentage,
        examcategory:examcategory.toUpperCase(),
        is_completed: true,
        completion_type: isAutoSubmit ? 'auto_submit' : 'manual_submit',
        status: 'completed',
        
        // Optimized dual storage
        answers: state.answerHistory,
        answer2: answer2,
        all_questions: allQuestions,
        
        // Comprehensive analytics
        quick_stats: {
          progress: stats.attemptPercentage,
          score: stats.score,
          percentage: stats.percentage,
          subjects: Object.keys(stats.subjectStats),
          topSubject: Object.entries(stats.subjectStats)
            .sort((a, b) => b[1].percentage - a[1].percentage)[0]?.[0] || 'None'
        },
        
        subject_performance: stats.subjectStats,
        final_stats: finalStats,
        
        // Performance metrics
        avg_time_per_question: stats.avgTimePerQuestion,
        total_interactions: state.interactionLog.length,
        completion_rate: stats.attemptPercentage,
        marked_for_review_count: state.markedForReview.length,
        
        // Navigation data
        navigation_pattern: {
          totalNavigations: state.navigationHistory.length,
          backtrackCount: state.navigationHistory.filter(nav => nav.to < nav.from).length,
          jumpCount: state.navigationHistory.filter(nav => Math.abs(nav.to - nav.from) > 1).length
        }
      };

      // Update main attempt
      const { error: updateError } = await supabase
        .from('user_test_attempts')
        .update(submissionData)
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Save individual responses - ALL questions
      const responses = allQuestions.map(question => ({
        attempt_id: attemptId,
        question_id: question.id,
        question_order: question.order,
        user_answer: question.userAnswer,
        correct_answer: question.correct_option,
        is_correct: question.isCorrect,
        time_taken: question.timeSpent,
        marked_for_review: question.isMarkedForReview,
        subject: question.subject,
        topic: question.topic,
        difficulty: question.difficulty,
        response_type: question.isAttempted ? 'answered' : 'skipped',
        is_unanswered: !question.isAttempted
      }));

      // Insert responses in batches
      const batchSize = 50;
      for (let i = 0; i < responses.length; i += batchSize) {
        const batch = responses.slice(i, i + batchSize);
        const { error: batchError } = await supabase
          .from('user_question_responses')
          .insert(batch);
        
        if (batchError) {
          console.error(`Batch ${i / batchSize + 1} error:`, batchError);
        }
      }

      // Success message based on performance
      let message = '🎉 Test submitted successfully!';
      if (stats.attempted === 0) {
        message = '📝 Test submitted with no answers';
      } else if (stats.percentage >= 90) {
        message = `🏆 Outstanding! ${stats.percentage}% score!`;
      } else if (stats.percentage >= 75) {
        message = `🎯 Excellent! ${stats.percentage}% score!`;
      } else if (stats.percentage >= 60) {
        message = `👍 Good job! ${stats.percentage}% score!`;
      } else {
        message = `📊 Test completed! ${stats.percentage}% score`;
      }

      toast.success(message, { duration: 4000 });
      
      // Clear local storage backup
      localStorage.removeItem(`test_backup_${attemptId}`);
      
      router.push(`/mock-test/${examcategory}/results/${attemptId}`);

    } catch (error) {
      console.error('Submission error:', error);
      
      // Create comprehensive backup
      const backup = {
        attemptId,
        testId,
        timestamp: new Date().toISOString(),
        userEmail: user?.email,
        answerHistory: state.answerHistory,
        questionsQueue: state.questionsQueue.map(q => ({
          id: q.id,
          order: q.order,
          subject: q.subject,
          correct_option: q.correct_option
        })),
        markedForReview: state.markedForReview,
        stats: currentStats,
        timeData: {
          totalTime: state.totalTime,
          timeRemaining: state.timeRemaining,
          testDuration: state.testDuration
        }
      };
      
      localStorage.setItem(`test_backup_${attemptId}`, JSON.stringify(backup));
      
      toast.error('Submission failed but data is backed up locally. Please contact support.', { 
        duration: 10000 
      });
      
      router.push(`/mock-test/${examcategory}/results/${attemptId}?backup=true`);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionStatus = useCallback((questionId, index) => {
    const isAnswered = state.answeredQuestionIds.includes(questionId);
    const isMarked = state.markedForReview.includes(questionId);
    const isCurrent = index === state.currentQuestionIndex;

    if (isCurrent) return "bg-blue-600 text-white scale-105 ring-2 ring-blue-300";
    if (isAnswered && isMarked) return "bg-purple-500 text-white";
    if (isAnswered) return "bg-green-500 text-white";
    if (isMarked) return "bg-yellow-500 text-white";
    return "bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400";
  }, [state.answeredQuestionIds, state.markedForReview, state.currentQuestionIndex]);

  // Handle previous attempt actions
  const handleViewResult = useCallback(() => {
    router.push(`/mock-test/${examcategory}/results/${previousAttempt.id}`);
  }, [router, previousAttempt]);

  const handleRetakeTest = useCallback(() => {
    setPreviousAttempt(null);
    toast.success('You can now retake the test', { duration: 2000 });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-sm md:text-base">Loading test...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-xl p-6 md:p-8 max-w-sm md:max-w-md w-full">
          <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6 text-sm md:text-base">Please sign in to take the test.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!testInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl shadow-xl p-6 md:p-8 max-w-sm md:max-w-md w-full">
          <AlertTriangle className="h-12 w-12 md:h-16 md:w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Test Not Found</h2>
          <p className="text-gray-600 mb-6 text-sm md:text-base">The requested test is not available.</p>
          <button 
            onClick={() => router.push(`/mock-test/${examcategory}`)}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
          >
            Browse Tests
          </button>
        </div>
      </div>
    );
  }

  // Pre-test screen with previous attempt check
  if (!state.testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-4 md:py-8">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6 md:hidden">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-sm font-bold text-gray-900 truncate">{testInfo.name}</h1>
            <button
              onClick={() => router.push(`/mock-test/${examcategory}`)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Home className="h-6 w-6" />
            </button>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Desktop Header */}
            <div className="text-center mb-6 md:mb-8 hidden md:block">
              <Trophy className="h-12 w-12 md:h-16 md:w-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {testInfo.name}
              </h1>
              <p className="text-lg md:text-xl text-gray-600">
                {examcategory.toUpperCase()} Mock Test Experience
              </p>
            </div>

            {/* Previous Attempt Check */}
            {previousAttempt && (
              <PreviousAttemptCard 
                attempt={previousAttempt}
                onViewResult={handleViewResult}
                onRetakeTest={handleRetakeTest}
              />
            )}

            {/* Only show test start if no previous attempt or retake is allowed */}
{(!previousAttempt) && (
  <>
    {/* Test Overview - Mobile First */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          Test Overview
        </h2>
        
        {/* Mobile-first grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Target className="h-6 w-6 md:h-8 md:w-8 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-gray-600">Questions</p>
              <p className="text-lg md:text-xl font-bold">{testInfo.total_questions}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            <Timer className="h-6 w-6 md:h-8 md:w-8 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-gray-600">Duration</p>
              <p className="text-lg md:text-xl font-bold">
                {Math.floor(testInfo.duration / 60)}h {testInfo.duration % 60}m
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            <Zap className="h-6 w-6 md:h-8 md:w-8 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-gray-600">Difficulty</p>
              <p className="text-lg md:text-xl font-bold capitalize">{testInfo.difficulty}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            <Award className="h-6 w-6 md:h-8 md:w-8 text-orange-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm text-gray-600">Max Score</p>
              <p className="text-lg md:text-xl font-bold">{testInfo.total_questions * 100}</p>
            </div>
          </div>
        </div>

        {/* Additional Test Details */}
        <div className="border-t pt-4 mb-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3">Test Details</h3>
          <div className="space-y-3">
             
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                Avg. Time per Question
              </span>
              <span className="text-sm font-medium">{Math.round(testInfo.duration / testInfo.total_questions * 60)} seconds</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600 flex items-center">
                <Brain className="h-4 w-4 mr-2 text-purple-500" />
                Question Type
              </span>
              <span className="text-sm font-medium">Multiple Choice (MCQ)</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 flex items-center">
                <Flag className="h-4 w-4 mr-2 text-yellow-500" />
                Review Option
              </span>
              <span className="text-sm font-medium">Available</span>
            </div>
          </div>
        </div>

        {/* {testInfo.description && (
          <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Description</h4>
            <p className="text-sm md:text-base text-gray-700">{testInfo.description}</p>
          </div>
        )} */}

        {/* Preparation Tips - Mobile */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg md:hidden">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <Star className="h-4 w-4 mr-1" />
            Quick Tips
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Manage time: ~{Math.round(testInfo.duration / testInfo.total_questions * 60)} sec per question</li>
            <li>• Mark difficult questions for later review</li>
            <li>• Don&apos;t spend too long on any single question</li>
            <li>• Review marked questions if time permits</li>
          </ul>
        </div>
      </div>

      {/* Instructions - Mobile Optimized */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-3 md:mb-4">
          <BookOpen className="h-4 w-4 md:h-5 md:w-5 inline mr-2" />
          Instructions
        </h3>
        
        <div className="space-y-4">
          {/* Navigation Instructions */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Navigation</h4>
            <ul className="space-y-2 text-xs md:text-sm text-blue-800">
              <li className="flex items-start">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Swipe left/right or use nav buttons
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Jump to any question using grid
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Questions auto-saved on selection
              </li>
            </ul>
          </div>

          {/* Answering Instructions */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Answering</h4>
            <ul className="space-y-2 text-xs md:text-sm text-blue-800">
              <li className="flex items-start">
                <Flag className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Mark questions for review
              </li>
              <li className="flex items-start">
                <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Clear/change answers anytime
              </li>
              <li className="flex items-start">
                <SkipForward className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Skip difficult questions first
              </li>
            </ul>
          </div>

          {/* System Features */}
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Features</h4>
            <ul className="space-y-2 text-xs md:text-sm text-blue-800">
              <li className="flex items-start">
                <Save className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Auto-save every 30 seconds
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Time warnings at 10, 5, 1 minute
              </li>
              <li className="flex items-start">
                <RefreshCw className="h-3 w-3 md:h-4 md:w-4 mr-2 mt-0.5 flex-shrink-0" />
                Auto-submit when time ends
              </li>
            </ul>
          </div>

          {/* Mobile Specific Instructions */}
          <div className="md:hidden bg-white/50 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Mobile Tips</h4>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• Use portrait mode for best experience</li>
              <li>• Tap menu button for question overview</li>
              <li>• Double-tap to zoom in on questions</li>
              <li>• Progress saved offline if connection lost</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    {/* Subject Breakdown - If available */}
    {/* {state.questionsQueue.length > 0 && ( */}
      {/* <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 md:mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Brain className="h-5 w-5 mr-2 text-purple-600" />
          Subject Distribution
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Calculate subject distribution */}
          {/* {Object.entries(
            state.questionsQueue.reduce((acc, q) => {
              acc[q.subject] = (acc[q.subject] || 0) + 1;
              return acc;
            }, {})
          ).map(([subject, count]) => (
            <div key={subject} className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-gray-800">{count}</div>
              <div className="text-xs text-gray-600 capitalize">{subject}</div>
              <div className="text-xs text-blue-600 font-medium">
                {Math.round((count / state.questionsQueue.length) * 100)}%
              </div>
            </div>
          ))}
        </div> */}
      {/* </div> } */}
    {/* )} */}

     

    {/* Start Test Button - Enhanced Mobile */}
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t p-4 md:relative md:bg-transparent md:border-0 md:p-0">
      <div className="text-center">
        <button
          onClick={startTestAttempt}
          disabled={!state.questionsQueue.length}
          className="w-full md:w-auto inline-flex items-center justify-center px-6 md:px-8 py-4 md:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg md:text-xl font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 min-h-[56px]"
        >
          <Play className="h-6 w-6 md:h-7 md:w-7 mr-3" />
          <span>Start {testInfo.total_questions} Question Test</span>
        </button>
        
        {/* Additional info below button - Mobile */}
        <div className="mt-3 md:mt-4 text-center">
          <p className="text-sm text-gray-600">
            🔒 Secure Test Environment
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Test will start immediately after clicking. Ensure stable internet connection.
          </p>
        </div>
      </div>
    </div>

    {/* Pre-test Checklist - Mobile Optimized */}
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-4 md:hidden">
      <h4 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        Before You Start
      </h4>
      <div className="space-y-2 text-xs text-yellow-700">
        <label className="flex items-center">
          <input type="checkbox" className="mr-2 rounded" />
          Stable internet connection
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2 rounded" />
          Quiet environment for {Math.floor(testInfo.duration / 60)} hours
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2 rounded" />
          Device battery above 20%
        </label>
        <label className="flex items-center">
          <input type="checkbox" className="mr-2 rounded" />
          No distractions or interruptions
        </label>
      </div>
    </div>
  </>
)}

          </div>
        </div>
      </div>
    );
  }

  // Main test interface - Mobile First
return (
  <div className="min-h-screen bg-gray-50">
    {/* Network Status Bar */}
    {networkError && (
      <div className="bg-red-600 text-white px-4 py-2 text-center text-xs md:text-sm">
        <WifiOff className="h-3 w-3 md:h-4 md:w-4 inline mr-2" />
        No internet connection. Your progress is saved locally.
      </div>
    )}

    <div className="container mx-auto px-2 md:px-4 py-2 md:py-4">
      {state.currentQuestion ? (
        <MathJaxContext config={config}>
          {/* Mobile Header Bar */}
          <div className="bg-white rounded-lg md:rounded-xl shadow-lg p-3 md:p-4 lg:p-6 mb-2 md:mb-4">
            {/* Top row - Mobile first */}
            <div className="flex items-center justify-between mb-3 md:mb-4">
              {/* Left side - Test info */}
              <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
                <div className="hidden md:block w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm md:text-lg font-bold text-gray-900 truncate">
                    {testInfo.name}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600">
                    Q {state.currentQuestionIndex + 1}/{state.questionsQueue.length}
                  </p>
                </div>
              </div>

              {/* Right side - Timer and actions */}
              <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              <TimerDisplay 
  testDuration={state.testDuration}
  testStarted={state.testStarted}
  testStartTime={state.testStartTime}
  onTimeEnd={handleTimeEnd}
  onTimeWarning={handleTimeWarning}
/>

                
                {/* Mobile menu button */}
                <button
                  onClick={() => dispatch({ type: "TOGGLE_QUESTION_GRID" })}
                  className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg active:bg-gray-200"
                >
                  <Menu className="h-5 w-5" />
                </button>
                
                {/* Submit button */}
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  disabled={isSubmitting}
                  className="bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center text-xs md:text-sm active:bg-red-800"
                >
                  <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Submit</span>
                  <span className="sm:hidden">End</span>
                </button>
              </div>
            </div>

            {/* Bottom row - Connection status and progress */}
            <div className="flex justify-between items-center text-xs">
              <ConnectionStatus isOnline={state.isOnline} lastSaved={state.lastSaved} />
              <div className="flex items-center space-x-2 md:space-x-4">
                <span className="text-gray-500">
                  {Math.round(((state.currentQuestionIndex + 1) / state.questionsQueue.length) * 100)}%
                </span>
                <div className="w-16 md:w-20 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${((state.currentQuestionIndex + 1) / state.questionsQueue.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-2 md:gap-4">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-80 bg-white rounded-xl shadow-lg">
              <div className="p-4">
                {/* Progress Overview */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <LineChart className="h-5 w-5 mr-2 text-blue-600" />
                    Progress
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-700">{state.questionsAnswered}</div>
                      <div className="text-green-600 text-sm">Answered</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-700">{state.markedForReview.length}</div>
                      <div className="text-yellow-600 text-sm">Marked</div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <ProgressRing 
                      progress={(state.currentQuestionIndex + 1) / state.questionsQueue.length * 100}
                      size={80}
                      className="mx-auto"
                    />
                  </div>
                </div>

                {/* Question Grid */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Questions</h4>
                  <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto">
                    {state.questionsQueue.map((q, index) => (
                      <button
                        key={q.id || index}
                        className={`relative p-2 text-sm font-semibold rounded-lg transition-all duration-200 ${getQuestionStatus(q.id, index)}`}
                        onClick={() => handleNavigation(index)}
                        title={`Question ${index + 1}`}
                      >
                        {index + 1}
                        {state.markedForReview.includes(q.id) && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2">Legend</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-600 rounded"></div>
                      <span>Current</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-400 rounded"></div>
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                      <span>Marked</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-200 rounded"></div>
                      <span>Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Area - Mobile First */}
            <div 
              className="flex-1 bg-white rounded-lg md:rounded-xl shadow-lg"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="p-3 md:p-6 lg:p-8">
                {/* Question Header - Mobile First */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 space-y-3 md:space-y-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                      {state.currentQuestion.subject}
                    </span>
                    <span className="bg-gray-100 text-gray-700 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
                      {state.currentQuestion.topic}
                    </span>
                    <span className="bg-purple-100 text-purple-700 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm capitalize">
                      {state.currentQuestion.difficulty}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleMarkForReview}
                    className={`flex items-center px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all active:scale-95 ${
                      state.markedForReview.includes(state.currentQuestion.id)
                        ? 'bg-yellow-100 text-yellow-800 border border-yellow-400'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Flag className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    {state.markedForReview.includes(state.currentQuestion.id) ? 'Unmark' : 'Mark'}
                  </button>
                </div>

                {/* Question Content */}
                <MathJax hideUntilTypeset={"first"} inline dynamic>
                  <div
                    dangerouslySetInnerHTML={{ __html: state.currentQuestion.question }}
                    className="text-base md:text-lg mb-6 md:mb-8 prose max-w-none leading-relaxed"
                  />
                  
                  {/* Options - Mobile First */}
                  <div className="space-y-3 md:space-y-4">
                    {["A", "B", "C", "D"].map((option) => (
                      <label
                        key={option}
                        className={`flex items-start p-3 md:p-4 lg:p-5 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all active:scale-[0.98] ${
                          state.userAnswer === option 
                            ? "bg-blue-50 border-blue-500 shadow-md" 
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100"
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={state.userAnswer === option}
                          onChange={() => handleAnswerSelect(option)}
                          className="h-4 w-4 md:h-5 md:w-5 text-blue-600 focus:ring-blue-500 mr-3 md:mr-4 mt-0.5 flex-shrink-0"
                        />
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold mr-3 md:mr-4 flex-shrink-0 ${
                          state.userAnswer === option 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {option}
                        </div>
                        <span
                          dangerouslySetInnerHTML={{ __html: state.currentQuestion[`options_${option}`] }}
                          className="flex-1 text-sm md:text-base leading-relaxed"
                        />
                      </label>
                    ))}
                  </div>
                </MathJax>

                {/* Action Buttons - Mobile First */}
                <div className="mt-6 md:mt-8">
                  {/* Mobile Navigation */}
                  <div className="flex justify-between items-center mb-4 md:hidden">
                    <button
                      onClick={() => handleNavigation('prev')}
                      disabled={state.currentQuestionIndex === 0}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:bg-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </button>
                    
                    <button
                      onClick={() => dispatch({ type: "TOGGLE_QUESTION_GRID" })}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center hover:bg-blue-200 transition-colors active:bg-blue-300"
                    >
                      <Target className="h-4 w-4 mr-1" />
                      {state.currentQuestionIndex + 1}/{state.questionsQueue.length}
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('next')}
                      disabled={state.currentQuestionIndex === state.questionsQueue.length - 1}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:bg-gray-300"
                    >
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="space-y-3 md:hidden">
                    {state.userAnswer && (
                      <button
                        onClick={() => {
                          if (state.currentQuestionIndex + 1 < state.questionsQueue.length) {
                            handleNavigation('next');
                          } else {
                            setShowConfirmSubmit(true);
                          }
                        }}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center active:bg-green-800"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {state.currentQuestionIndex + 1 < state.questionsQueue.length ? 'Save & Next' : 'Save & Finish'}
                      </button>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      {state.userAnswer && (
                        <button
                          onClick={() => dispatch({ type: "ANSWER_QUESTION", payload: { userAnswer: "" } })}
                          className="bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center active:bg-gray-400"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Clear
                        </button>
                      )}
                      
                      {state.currentQuestionIndex + 1 < state.questionsQueue.length && (
                        <button
                          onClick={() => handleNavigation('next')}
                          className="bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center active:bg-blue-800"
                        >
                          <SkipForward className="h-4 w-4 mr-2" />
                          Skip
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Desktop Action Buttons */}
                  <div className="hidden md:flex md:flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0 lg:space-x-3 w-full lg:w-auto">
                    <button
                      onClick={() => handleNavigation('prev')}
                      disabled={state.currentQuestionIndex === 0}
                      className="w-full lg:w-auto bg-gray-100 text-gray-700 px-6 py-3 rounded-lg flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5 mr-2" /> Previous
                    </button>
                    
                    <div className="flex flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3 w-full lg:w-auto">
                      {state.userAnswer && (
                        <button
                          onClick={() => {
                            if (state.currentQuestionIndex + 1 < state.questionsQueue.length) {
                              handleNavigation('next');
                            } else {
                              setShowConfirmSubmit(true);
                            }
                          }}
                          className="w-full lg:w-auto bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {state.currentQuestionIndex + 1 < state.questionsQueue.length ? 'Save & Next' : 'Save & Finish'}
                        </button>
                      )}
                      
                      {state.userAnswer && (
                        <button
                          onClick={() => dispatch({ type: "ANSWER_QUESTION", payload: { userAnswer: "" } })}
                          className="w-full lg:w-auto bg-gray-200 text-gray-700 px-4 py-3 rounded-lg flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Clear
                        </button>
                      )}
                      
                      {state.currentQuestionIndex + 1 < state.questionsQueue.length && (
                        <button
                          onClick={() => handleNavigation('next')}
                          className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                        >
                          <SkipForward className="h-4 w-4 mr-2" />
                          Skip
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Question Grid Modal */}
          {state.showQuestionGrid && (
            <QuestionGrid
              questions={state.questionsQueue}
              currentIndex={state.currentQuestionIndex}
              answeredIds={state.answeredQuestionIds}
              markedIds={state.markedForReview}
              onNavigate={handleNavigation}
              onClose={() => dispatch({ type: "TOGGLE_QUESTION_GRID" })}
            />
          )}
        </MathJaxContext>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-6">No questions available</p>
          <button
            onClick={() => router.push(`/mock-test/${examcategory}`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Tests
          </button>
        </div>
      )}
    </div>

    {/* Submit Confirmation Modal - Mobile Optimized */}
    {showConfirmSubmit && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 md:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-600 flex-shrink-0" />
              <h3 className="text-lg md:text-xl font-bold text-gray-900">Submit Test?</h3>
            </div>
            
            <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
              Are you sure you want to submit? You cannot change answers after submission.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 md:p-4 mb-4 md:mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-semibold">{state.questionsQueue.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-semibold text-green-600">{state.questionsAnswered}</span>
              </div>
              <div className="flex justify-between">
                <span>Skipped:</span>
                <span className="font-semibold text-red-600">{state.questionsQueue.length - state.questionsAnswered}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked:</span>
                <span className="font-semibold text-yellow-600">{state.markedForReview.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Left:</span>
                <span className="font-semibold">{formatTime(state.timeRemaining)}</span>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors active:bg-gray-400"
              >
                Continue Test
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  submitTest();
                }}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center active:bg-red-800"
              >
                {isSubmitting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Time Warning - Mobile Optimized */}
    {state.testStarted && state.timeRemaining <= 300 && state.timeRemaining > 0 && (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-red-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl shadow-2xl animate-pulse z-40">
        <div className="flex items-center space-x-2 md:space-x-3">
          <Clock className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
          <div>
            <div className="font-bold text-sm md:text-base">Time Warning!</div>
            <div className="text-xs md:text-sm">{formatTime(state.timeRemaining)} remaining</div>
          </div>
        </div>
      </div>
    )}

    {/* Mobile-optimized Toast */}
    <Toaster 
      position="top-center"
      toastOptions={{
        duration: 2000,
        style: {
          background: '#fff',
          color: '#333',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '14px',
          padding: '12px 16px',
          maxWidth: '90vw',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  </div>
)
}