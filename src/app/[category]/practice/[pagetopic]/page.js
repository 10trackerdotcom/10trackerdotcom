"use client";

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Clock } from "lucide-react";

// Lazy-loaded components
const QuestionCard = dynamic(() => import("@/components/QuestionCard"), { 
  ssr: false,
  loading: () => <QuestionSkeleton />
});
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"), { ssr: false });

// Constants
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "jain10gunjan@gmail.com";
const QUESTIONS_PER_PAGE = 5;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum cache entries
const POINTS_PER_CORRECT_ANSWER = 100;

// Utility: Parse page number from URL
const parsePageFromUrl = (searchParams) => {
  const pageFromUrl = searchParams?.get("page");
  const parsed = parseInt(pageFromUrl || "1", 10);
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
};

// Utility: Format topic name
const formatTopicName = (pagetopic) => {
  return pagetopic?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "";
};

// Utility: Error handler
const handleError = (error, userMessage, logMessage) => {
  if (process.env.NODE_ENV === 'development' && logMessage) {
    console.error(logMessage, error);
  }
  toast.error(userMessage);
};

// Simple Skeleton
const QuestionSkeleton = memo(() => (
  <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
    <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
      ))}
    </div>
  </div>
));

QuestionSkeleton.displayName = 'QuestionSkeleton';

// Simple Difficulty Button
const DifficultyButton = memo(({ difficulty, count, active, onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
      active 
        ? "bg-neutral-900 text-white" 
        : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
    }`}
  >
    <span className="capitalize">{difficulty}</span>
    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
      active ? "bg-white/20" : "bg-neutral-100"
    }`}>
      {count || 0}
    </span>
  </button>
));

DifficultyButton.displayName = 'DifficultyButton';

const Pagetracker = memo(() => {
  const mathJaxConfig = useMemo(() => ({
    "fast-preview": { disabled: false },
    tex: { 
      inlineMath: [["$", "$"], ["\\(", "\\)"]], 
      displayMath: [["$$", "$$"], ["\\[", "\\]"]],
      processEscapes: true,
    },
    messageStyle: "none",
    showMathMenu: false,
  }), []);

  const { category, pagetopic } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setShowAuthModal } = useAuth();

  // State
  const [questions, setQuestions] = useState([]);
  const [counts, setCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  const [activeDifficulty, setActiveDifficulty] = useState("easy");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [progress, setProgress] = useState({
    completed: [],
    correct: [],
    points: 0
  });
  const [difficultyQuestionIds, setDifficultyQuestionIds] = useState(new Set()); // Store question IDs for current difficulty
  const [currentPage, setCurrentPage] = useState(() => parsePageFromUrl(searchParams));

  // Refs for optimization
  const pendingUpdatesRef = useRef(new Map());
  const cacheRef = useRef(new Map());
  const isSavingRef = useRef(false);
  const saveRequestIdRef = useRef(0);

  // Cache helpers with cleanup
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cacheRef.current.entries());
    
    // Remove expired entries
    entries.forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_TTL) {
        cacheRef.current.delete(key);
      }
    });

    // Limit cache size
    if (cacheRef.current.size > MAX_CACHE_SIZE) {
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, cacheRef.current.size - MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => cacheRef.current.delete(key));
    }
  }, []);

  const getCached = useCallback((key) => {
    cleanupCache();
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      cacheRef.current.delete(key);
    }
    return null;
  }, [cleanupCache]);

  const setCached = useCallback((key, data) => {
    cleanupCache();
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, [cleanupCache]);

  // Fetch counts with optimized query
  const fetchCounts = useCallback(async () => {
    if (!category || !pagetopic) return;

    const cacheKey = `counts-${category}-${pagetopic}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setCounts(cached);
      return;
    }

    try {
      // Fetch all difficulties in one query, count in database
      const { data, error } = await supabase
        .from("examtracker")
        .select("difficulty")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase());

      if (error) throw error;

      // Count in memory (more efficient than multiple queries)
      const countsData = { easy: 0, medium: 0, hard: 0 };
      if (data) {
        data.forEach(q => {
          if (q.difficulty && countsData.hasOwnProperty(q.difficulty)) {
            countsData[q.difficulty]++;
          }
        });
      }

      setCounts(countsData);
      setCached(cacheKey, countsData);
    } catch (error) {
      handleError(error, "Failed to load question counts", "Error fetching counts:");
    }
  }, [category, pagetopic, getCached, setCached]);

  // Fetch all question IDs for current difficulty (for progress calculation)
  const fetchDifficultyQuestionIds = useCallback(async (difficulty) => {
    if (!pagetopic || !category) return;

    const cacheKey = `questionIds-${category}-${pagetopic}-${difficulty}`;
    const cached = getCached(cacheKey);
    
    if (cached) {
      setDifficultyQuestionIds(new Set(cached));
      return;
    }

    try {
      const { data, error } = await supabase
        .from("examtracker")
        .select("_id")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase())
        .eq("difficulty", difficulty);

      if (error) throw error;

      const ids = (data || []).map(q => q._id);
      setDifficultyQuestionIds(new Set(ids));
      setCached(cacheKey, ids);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching question IDs:", error);
      }
    }
  }, [category, pagetopic, getCached, setCached]);

  // Fetch questions with pagination
  const fetchQuestions = useCallback(async (difficulty, page = 1) => {
    if (!pagetopic || !category) return;

    setIsLoadingQuestions(true);
    try {
      const cacheKey = `questions-${category}-${pagetopic}-${difficulty}-${page}`;
      const cached = getCached(cacheKey);
      
      if (cached) {
        setQuestions(cached);
        setIsLoadingQuestions(false);
        return;
      }

      const { data, error } = await supabase
        .from("examtracker")
        .select("_id, question, options_A, options_B, options_C, options_D, correct_option, solution, difficulty, year, subject, order_index, directionHTML")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase())
        .eq("difficulty", difficulty)
        .order("order_index", { ascending: true })
        .range((page - 1) * QUESTIONS_PER_PAGE, page * QUESTIONS_PER_PAGE - 1);

      if (error) throw error;

      const questionsData = data || [];
      setQuestions(questionsData);
      setCached(cacheKey, questionsData);
    } catch (error) {
      handleError(error, "Failed to load questions", "Error fetching questions:");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [category, pagetopic, getCached, setCached]);

  // Fetch user progress
  const fetchUserProgress = useCallback(async () => {
    if (!user?.id || !pagetopic || !category) {
      setProgress({ completed: [], correct: [], points: 0 });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("completedquestions, correctanswers, points")
        .eq("user_id", user.id)
        .eq("topic", pagetopic)
        .eq("area", category)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const completed = Array.isArray(data?.completedquestions) ? data.completedquestions : [];
      const correct = Array.isArray(data?.correctanswers) ? data.correctanswers : [];
      const points = typeof data?.points === 'number' ? data.points : 0;

      setProgress({ completed, correct, points });
    } catch (error) {
      handleError(error, "Failed to load progress", "Error fetching user progress:");
      setProgress({ completed: [], correct: [], points: 0 });
    }
  }, [user, pagetopic, category]);

  // Helper: Fetch existing progress from database
  const fetchExistingProgress = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_progress")
      .select("completedquestions, correctanswers, points")
      .eq("user_id", user.id)
      .eq("topic", pagetopic)
      .eq("area", category)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return {
      completed: Array.isArray(data?.completedquestions) ? data.completedquestions : [],
      correct: Array.isArray(data?.correctanswers) ? data.correctanswers : [],
      points: typeof data?.points === 'number' ? data.points : 0
    };
  }, [user, pagetopic, category]);

  // Helper: Merge progress updates
  const mergeProgressUpdates = useCallback((existing, updates) => {
    const aggregated = updates.reduce((acc, update) => ({
      completed: [...new Set([...acc.completed, ...update.completed])],
      correct: [...new Set([...acc.correct, ...update.correct])],
      points: acc.points + (update.points || 0)
    }), { completed: [], correct: [], points: 0 });

    return {
      completed: [...new Set([...existing.completed, ...aggregated.completed])],
      correct: [...new Set([...existing.correct, ...aggregated.correct])],
      points: existing.points + aggregated.points
    };
  }, []);

  // Helper: Save progress to database
  const saveProgressToDatabase = useCallback(async (progressData) => {
    // Try upsert first
    let { error: saveError } = await supabase
      .from("user_progress")
      .upsert(progressData, { 
        onConflict: "user_id,topic,area"
      });

    // If upsert fails, try insert then update
    if (saveError) {
      const { error: insertError } = await supabase
        .from("user_progress")
        .insert(progressData);

      if (insertError) {
        const { error: updateError } = await supabase
          .from("user_progress")
          .update({
            completedquestions: progressData.completedquestions,
            correctanswers: progressData.correctanswers,
            points: progressData.points,
            email: progressData.email,
          })
          .eq("user_id", user.id)
          .eq("topic", pagetopic)
          .eq("area", category);

        if (updateError) {
          throw updateError;
        }
      }
    }
  }, [user, pagetopic, category]);

  // Save progress with race condition protection
  const saveProgress = useCallback(async (immediate = false) => {
    if (!user) return;
    if (isSavingRef.current) return; // Prevent concurrent saves

    if (pendingUpdatesRef.current.size === 0) return;

    const requestId = ++saveRequestIdRef.current;
    isSavingRef.current = true;

    const updates = Array.from(pendingUpdatesRef.current.values());
    pendingUpdatesRef.current.clear();

    try {
      // Fetch existing progress
      const existing = await fetchExistingProgress();

      // Merge updates
      const merged = mergeProgressUpdates(existing, updates);

      // Prepare data
      const progressData = {
        user_id: user.id,
        email: user?.emailAddresses[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress,
        topic: pagetopic,
        completedquestions: merged.completed,
        correctanswers: merged.correct,
        points: merged.points,
        area: category,
      };

      // Save to database
      await saveProgressToDatabase(progressData);

      // Only update local state if this is still the latest request
      if (requestId === saveRequestIdRef.current) {
        setProgress(prev => mergeProgressUpdates(prev, updates));
        if (immediate) {
          toast.success("Progress saved!", { duration: 2000 });
        }
      }
    } catch (error) {
      handleError(error, "Failed to save progress. Retrying...", "Error saving progress:");
      // Re-add to queue for retry (limit retries)
      if (updates.length < 10) {
        updates.forEach(update => {
          pendingUpdatesRef.current.set(Date.now(), update);
        });
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [user, pagetopic, category, fetchExistingProgress, mergeProgressUpdates, saveProgressToDatabase]);

  // Immediate save function
  const saveProgressImmediate = useCallback(() => {
    saveProgress(true);
  }, [saveProgress]);

  // Handle answer
  const handleAnswer = useCallback((questionId, isCorrect) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Optimistic update
    setProgress(prev => ({
      completed: [...new Set([...prev.completed, questionId])],
      correct: isCorrect 
        ? [...new Set([...prev.correct, questionId])]
        : prev.correct.filter(id => id !== questionId),
      points: prev.points + (isCorrect ? POINTS_PER_CORRECT_ANSWER : 0)
    }));

    // Queue for batch save
    pendingUpdatesRef.current.set(questionId, {
      completed: [questionId],
      correct: isCorrect ? [questionId] : [],
      points: isCorrect ? POINTS_PER_CORRECT_ANSWER : 0
    });

    // Save immediately
    saveProgressImmediate();
  }, [user, setShowAuthModal, saveProgressImmediate]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((difficulty) => {
    if (difficulty === activeDifficulty || isLoadingQuestions) return;
    setActiveDifficulty(difficulty);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const query = params.toString();
    router.push(query ? `?${query}` : "?", { scroll: false });
  }, [activeDifficulty, isLoadingQuestions, router, searchParams]);

  // Initial load
  useEffect(() => {
    if (!category || !pagetopic) return;
    
    const load = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCounts(), 
        fetchQuestions(activeDifficulty, currentPage),
        fetchDifficultyQuestionIds(activeDifficulty)
      ]);
      setIsLoading(false);
    };
    load();
  }, [category, pagetopic, activeDifficulty, currentPage]); // Removed function dependencies

  // Fetch question IDs when difficulty changes
  useEffect(() => {
    if (category && pagetopic && activeDifficulty) {
      fetchDifficultyQuestionIds(activeDifficulty);
    }
  }, [activeDifficulty, category, pagetopic, fetchDifficultyQuestionIds]);

  // Sync current page with URL changes
  useEffect(() => {
    const page = parsePageFromUrl(searchParams);
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  }, [searchParams, currentPage]);

  // Load progress when user changes
  useEffect(() => {
    fetchUserProgress();
  }, [user?.id, pagetopic, category]); // More specific dependencies

  // Cleanup and save on unmount
  useEffect(() => {
    return () => {
      if (pendingUpdatesRef.current.size > 0 && user) {
        // Use sendBeacon for reliable save on unmount
        const data = JSON.stringify({
          updates: Array.from(pendingUpdatesRef.current.values()),
          userId: user.id,
          topic: pagetopic,
          area: category,
          email: user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress
        });
        
        // Try sendBeacon first, fallback to sync save
        if (navigator.sendBeacon) {
          try {
            navigator.sendBeacon('/api/save-progress', new Blob([data], { type: 'application/json' }));
          } catch (e) {
            // Fallback to immediate save
            saveProgress(true);
          }
        } else {
          saveProgress(true);
        }
      }
    };
  }, [user, pagetopic, category, saveProgress]);

  // Save progress before page unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (pendingUpdatesRef.current.size > 0 && user) {
        const data = JSON.stringify({
          updates: Array.from(pendingUpdatesRef.current.values()),
          userId: user.id,
          topic: pagetopic,
          area: category,
          email: user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress
        });
        
        // Use sendBeacon for reliable background save
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/save-progress', new Blob([data], { type: 'application/json' }));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, pagetopic, category]);

  // Pagination helpers - must be defined before stats useMemo
  const totalQuestionsForDifficulty = useMemo(
    () => counts[activeDifficulty] || 0,
    [counts, activeDifficulty]
  );

  // Calculate stats with optimized memoization - based on overall progress for current difficulty
  const stats = useMemo(() => {
    const total = totalQuestionsForDifficulty;
    
    if (total === 0 || difficultyQuestionIds.size === 0) {
      return {
        completed: 0,
        correct: 0,
        total: 0,
        completionPercentage: 0,
        accuracy: 0,
        points: progress.points
      };
    }

    // Filter progress to only include questions from current difficulty
    const completedForDifficulty = progress.completed.filter(id => difficultyQuestionIds.has(id));
    const correctForDifficulty = progress.correct.filter(id => difficultyQuestionIds.has(id));
    
    const completed = completedForDifficulty.length;
    const correct = correctForDifficulty.length;
    
    return {
      completed,
      correct,
      total,
      completionPercentage: total ? Math.round((completed / total) * 100) : 0,
      accuracy: completed ? Math.round((correct / completed) * 100) : 0,
      points: progress.points
    };
  }, [totalQuestionsForDifficulty, difficultyQuestionIds, progress.completed, progress.correct, progress.points]);
  
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalQuestionsForDifficulty / QUESTIONS_PER_PAGE) || 1),
    [totalQuestionsForDifficulty]
  );

  const goToPage = useCallback(
    (page) => {
      if (
        page === currentPage ||
        page < 1 ||
        page > totalPages ||
        isLoadingQuestions
      ) {
        return;
      }

      setCurrentPage(page);

      const params = new URLSearchParams(searchParams.toString());
      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", String(page));
      }
      const query = params.toString();
      router.push(query ? `?${query}` : "?", { scroll: false });
    },
    [currentPage, totalPages, isLoadingQuestions, router, searchParams]
  );

  // Format topic name
  const topicName = useMemo(() => formatTopicName(pagetopic), [pagetopic]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MetaDataJobs
          seoTitle={`${topicName} ${category?.toUpperCase()} Practice`}
          seoDescription={`Practice ${topicName} questions with detailed solutions.`}
        />
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] pt-16 px-4">
          <div className="bg-white p-8 rounded-lg border border-neutral-200 flex items-center space-x-4">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
            <div>
              <h3 className="text-lg font-medium text-neutral-900">Loading questions</h3>
              <p className="text-sm text-neutral-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-neutral-50">
        <MetaDataJobs
          seoTitle={`${topicName} ${category?.toUpperCase()} Practice`}
          seoDescription={`Practice ${topicName} questions with detailed solutions.`}
        />
        <div className="bg-neutral-50 pt-4 overflow-x-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
            {/* Header with Stats */}
            <div className="mb-4 sm:mb-8 mt-16">
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">
                {topicName}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 mb-4">
                {totalQuestionsForDifficulty} questions available
              </p>
              
              {/* Stats Row */}
              <div className="bg-white rounded-lg border border-neutral-200 p-3 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Completion</p>
                    <p className="text-lg font-semibold text-neutral-900">{stats.completionPercentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Correct</p>
                    <p className="text-lg font-semibold text-neutral-900">{stats.correct}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Accuracy</p>
                    <p className="text-lg font-semibold text-neutral-900">{stats.accuracy}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-600 mb-1">Points</p>
                    <p className="text-lg font-semibold text-neutral-900">{stats.points}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-4">
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs sm:text-sm mb-2">
                  <span className="text-neutral-700">Progress</span>
                  <span className="text-neutral-600">{stats.completed}/{stats.total} questions</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Difficulty Buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {["easy", "medium", "hard"].map((difficulty) => (
                  <DifficultyButton
                    key={difficulty}
                    difficulty={difficulty}
                    count={counts[difficulty]}
                    active={activeDifficulty === difficulty}
                    loading={isLoadingQuestions}
                    onClick={() => handleDifficultyChange(difficulty)}
                  />
                ))}
              </div>

              {/* Sign in prompt */}
              {!user && (
                <div className="bg-neutral-50 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-neutral-900">Sign in to track progress</p>
                    <p className="text-xs text-neutral-600">Save your answers and track your improvement</p>
                  </div>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-800 whitespace-nowrap"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="space-y-4 w-full overflow-x-hidden">
              <MathJaxContext config={mathJaxConfig}>
                <MathJax>
                  {isLoadingQuestions && questions.length === 0 ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <QuestionSkeleton key={i} />)}
                    </div>
                  ) : questions.length > 0 ? (
                    <>
                      {questions.map((question, index) => (
                        <QuestionCard
                          key={question._id}
                          category={category}
                          question={question}
                          index={index}
                          onAnswer={(isCorrect) => handleAnswer(question._id, isCorrect)}
                          isCompleted={progress.completed.includes(question._id)}
                          isCorrect={progress.correct.includes(question._id)}
                          isAdmin={user?.email === ADMIN_EMAIL || user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL}
                        />
                      ))}
                      {/* Pagination controls */}
                      {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 text-sm text-neutral-700">
                          <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1 || isLoadingQuestions}
                            className="px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors w-full sm:w-auto"
                          >
                            Previous
                          </button>
                          <span className="text-xs sm:text-sm">
                            Page <span className="font-semibold">{currentPage}</span> of{" "}
                            <span className="font-semibold">{totalPages}</span>
                          </span>
                          <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || isLoadingQuestions}
                            className="px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors w-full sm:w-auto"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                      <Clock size={36} className="mx-auto text-neutral-400 mb-3" />
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">No questions available</h3>
                      <p className="text-sm text-neutral-600">No questions found for {activeDifficulty} difficulty.</p>
                    </div>
                  )}
                </MathJax>
              </MathJaxContext>
            </div>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </>
  );
});

Pagetracker.displayName = 'Pagetracker';

export default Pagetracker;
