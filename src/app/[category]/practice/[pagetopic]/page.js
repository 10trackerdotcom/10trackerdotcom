"use client";

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import debounce from "lodash/debounce";
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

// Optimized Supabase config
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ADMIN_EMAIL = "jain10gunjan@gmail.com";
const QUESTIONS_PER_PAGE = 10; // Reduced initial load
const BATCH_DELAY = 3000; // Increased delay for less frequent updates
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

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
  const { user, setShowAuthModal } = useAuth();

  // Simplified state
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
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Refs for optimization
  const pendingUpdatesRef = useRef(new Map());
  const cacheRef = useRef(new Map());
  const batchTimeoutRef = useRef(null);

  // Cache helper
  const getCached = useCallback((key) => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cacheRef.current.delete(key);
    return null;
  }, []);

  const setCached = useCallback((key, data) => {
    cacheRef.current.set(key, { data, timestamp: Date.now() });
  }, []);

  // Fetch counts once (cached)
  const fetchCounts = useCallback(async () => {
    const cacheKey = `counts-${category}-${pagetopic}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setCounts(cached);
      return;
    }

    try {
      // Single query for all counts
      const { data, error } = await supabase
        .from("examtracker")
        .select("difficulty")
        .eq("topic", pagetopic)
        .eq("category", category?.toUpperCase());

      if (error) throw error;

      const countsData = { easy: 0, medium: 0, hard: 0 };
      data?.forEach(q => {
        if (countsData.hasOwnProperty(q.difficulty)) {
          countsData[q.difficulty]++;
        }
      });

      setCounts(countsData);
      setCached(cacheKey, countsData);
    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  }, [category, pagetopic, getCached, setCached]);

  // Fetch questions with pagination
  const fetchQuestions = useCallback(async (difficulty, page = 1, append = false) => {
    if (!pagetopic || !category) return;

    setIsLoadingQuestions(true);
    try {
      const cacheKey = `questions-${category}-${pagetopic}-${difficulty}-${page}`;
      const cached = getCached(cacheKey);
      
      if (cached) {
        if (append) {
          setQuestions(prev => [...prev, ...cached]);
        } else {
          setQuestions(cached);
        }
        setHasMore(cached.length === QUESTIONS_PER_PAGE);
        setIsLoadingQuestions(false);
        return;
      }

      const { data, error } = await supabase
        .from("examtracker")
        .select("_id, question, options_A, options_B, options_C, options_D, correct_option, solution, difficulty")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase())
        .eq("difficulty", difficulty)
        .order("_id")
        .range((page - 1) * QUESTIONS_PER_PAGE, page * QUESTIONS_PER_PAGE - 1);

      if (error) throw error;

      const questionsData = data || [];
      
      if (append) {
        setQuestions(prev => [...prev, ...questionsData]);
      } else {
        setQuestions(questionsData);
      }
      
      setHasMore(questionsData.length === QUESTIONS_PER_PAGE);
      setCached(cacheKey, questionsData);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [category, pagetopic, getCached, setCached]);

  // Fetch user progress (simplified)
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
        .maybeSingle(); // Use maybeSingle to handle no record case gracefully

      if (error && error.code !== "PGRST116") {
        console.error("❌ [Progress] Error fetching progress:", error);
        throw error;
      }

      // Ensure arrays are valid (handle null/undefined)
      const completed = Array.isArray(data?.completedquestions) ? data.completedquestions : [];
      const correct = Array.isArray(data?.correctanswers) ? data.correctanswers : [];
      const points = typeof data?.points === 'number' ? data.points : 0;

      console.log("✅ [Progress] Loaded progress:", {
        completed: completed.length,
        correct: correct.length,
        points: points
      });

      setProgress({
        completed,
        correct,
        points
      });
    } catch (error) {
      console.error("❌ [Progress] Error fetching user progress:", error);
      // Set empty progress on error to prevent UI issues
      setProgress({ completed: [], correct: [], points: 0 });
    }
  }, [user, pagetopic, category]);

  // Batch progress update - properly merges with existing progress
  const saveProgress = useCallback(async (immediate = false) => {
    if (!user) {
      console.warn("⚠️ [Progress] Cannot save: user not logged in");
      return;
    }

    if (pendingUpdatesRef.current.size === 0) {
      console.log("ℹ️ [Progress] No pending updates to save");
      return;
    }

    const updates = Array.from(pendingUpdatesRef.current.values());
    pendingUpdatesRef.current.clear();

    console.log("💾 [Progress] Saving progress:", {
      updatesCount: updates.length,
      immediate,
      userId: user.id,
      topic: pagetopic,
      area: category
    });

    try {
      // First, fetch existing progress from database
      const { data: existingProgress, error: fetchError } = await supabase
        .from("user_progress")
        .select("completedquestions, correctanswers, points")
        .eq("user_id", user.id)
        .eq("topic", pagetopic)
        .eq("area", category)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("❌ [Progress] Error fetching existing progress:", fetchError);
        throw fetchError;
      }

      // Get existing arrays (or empty if no record exists) - ensure they're arrays
      const existingCompleted = Array.isArray(existingProgress?.completedquestions) 
        ? existingProgress.completedquestions 
        : [];
      const existingCorrect = Array.isArray(existingProgress?.correctanswers) 
        ? existingProgress.correctanswers 
        : [];
      const existingPoints = typeof existingProgress?.points === 'number' 
        ? existingProgress.points 
        : 0;

      console.log("📊 [Progress] Existing progress:", {
        completed: existingCompleted.length,
        correct: existingCorrect.length,
        points: existingPoints
      });

      // Aggregate new updates
      const newUpdates = updates.reduce((acc, update) => ({
        completed: [...new Set([...acc.completed, ...update.completed])],
        correct: [...new Set([...acc.correct, ...update.correct])],
        points: acc.points + (update.points || 0) // Sum points instead of max
      }), { completed: [], correct: [], points: 0 });

      console.log("🆕 [Progress] New updates:", {
        completed: newUpdates.completed,
        correct: newUpdates.correct,
        points: newUpdates.points
      });

      // Merge existing with new updates
      const mergedCompleted = [...new Set([...existingCompleted, ...newUpdates.completed])];
      const mergedCorrect = [...new Set([...existingCorrect, ...newUpdates.correct])];
      const mergedPoints = existingPoints + newUpdates.points;

      console.log("🔄 [Progress] Merged progress:", {
        completed: mergedCompleted.length,
        correct: mergedCorrect.length,
        points: mergedPoints
      });

      // Save merged progress - use upsert with proper conflict handling
      const progressData = {
        user_id: user.id,
        email: user.email,
        topic: pagetopic,
        completedquestions: mergedCompleted,
        correctanswers: mergedCorrect,
        points: mergedPoints,
        area: category,
      };

      console.log("💾 [Progress] Attempting to save:", progressData);

      // Try upsert first
      let { error: saveError, data: savedData } = await supabase
        .from("user_progress")
        .upsert(progressData, { 
          onConflict: "user_id,topic,area"
        })
        .select();

      // If upsert fails, try insert then update
      if (saveError) {
        console.warn("⚠️ [Progress] Upsert failed, trying insert/update:", saveError);
        
        // Try to insert first
        const { error: insertError } = await supabase
          .from("user_progress")
          .insert(progressData);

        // If insert fails (likely due to existing record), try update
        if (insertError) {
          console.log("ℹ️ [Progress] Insert failed (record exists), trying update");
          const { error: updateError } = await supabase
            .from("user_progress")
            .update({
              completedquestions: mergedCompleted,
              correctanswers: mergedCorrect,
              points: mergedPoints,
              email: user.email,
            })
            .eq("user_id", user.id)
            .eq("topic", pagetopic)
            .eq("area", category);

          if (updateError) {
            console.error("❌ [Progress] Update also failed:", updateError);
            throw updateError;
          }
        }
      } else {
        console.log("✅ [Progress] Upsert successful:", savedData);
      }

      // Update local state with merged data
      setProgress(prev => ({
        completed: [...new Set([...prev.completed, ...newUpdates.completed])],
        correct: [...new Set([...prev.correct, ...newUpdates.correct])],
        points: prev.points + newUpdates.points
      }));

      console.log("✅ [Progress] Progress saved successfully:", {
        completed: mergedCompleted.length,
        correct: mergedCorrect.length,
        points: mergedPoints
      });

      toast.success("Progress saved!", { duration: 2000 });
    } catch (error) {
      console.error("❌ [Progress] Error saving progress:", error);
      toast.error("Failed to save progress. Retrying...");
      // Re-add to queue for retry
      updates.forEach(update => {
        pendingUpdatesRef.current.set(Date.now(), update);
      });
    }
  }, [user, pagetopic, category]);

  const debouncedSave = useMemo(
    () => debounce(() => saveProgress(false), BATCH_DELAY),
    [saveProgress]
  );

  // Immediate save function (for critical actions)
  const saveProgressImmediate = useCallback(() => {
    saveProgress(true);
  }, [saveProgress]);

  // Handle answer
  const handleAnswer = useCallback((questionId, isCorrect) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    console.log("📝 [Answer] Handling answer:", { questionId, isCorrect });

    // Optimistic update
    setProgress(prev => ({
      completed: [...new Set([...prev.completed, questionId])],
      correct: isCorrect 
        ? [...new Set([...prev.correct, questionId])]
        : prev.correct.filter(id => id !== questionId),
      points: prev.points + (isCorrect ? 100 : 0)
    }));

    // Queue for batch save
    pendingUpdatesRef.current.set(questionId, {
      completed: [questionId],
      correct: isCorrect ? [questionId] : [],
      points: isCorrect ? 100 : 0
    });

    // Save immediately for all user actions to ensure progress is saved
    // This ensures "Mark Complete" and correct answers are saved right away
    saveProgressImmediate();
  }, [user, setShowAuthModal, debouncedSave, saveProgressImmediate]);

  // Handle difficulty change
  const handleDifficultyChange = useCallback((difficulty) => {
    if (difficulty === activeDifficulty || isLoadingQuestions) return;
    setActiveDifficulty(difficulty);
    setCurrentPage(1);
    setHasMore(true);
    fetchQuestions(difficulty, 1, false);
  }, [activeDifficulty, isLoadingQuestions, fetchQuestions]);

  // Load more questions
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingQuestions) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchQuestions(activeDifficulty, nextPage, true);
  }, [hasMore, isLoadingQuestions, currentPage, activeDifficulty, fetchQuestions]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty, 1)]);
      setIsLoading(false);
    };
    load();
  }, [fetchCounts, fetchQuestions, activeDifficulty]);

  // Load progress when user changes
  useEffect(() => {
    fetchUserProgress();
  }, [fetchUserProgress]);

  // Cleanup and save on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      debouncedSave.cancel();
      // Save any pending updates before unmounting
      if (pendingUpdatesRef.current.size > 0 && user) {
        saveProgress(true);
      }
    };
  }, [debouncedSave, user, saveProgress]);

  // Save progress before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUpdatesRef.current.size > 0 && user) {
        // Use sendBeacon or sync save for critical data
        saveProgress(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, saveProgress]);

  // Calculate stats
  const stats = useMemo(() => {
    const completed = questions.filter(q => progress.completed.includes(q._id)).length;
    const correct = questions.filter(q => progress.correct.includes(q._id)).length;
    const total = questions.length;
    
    return {
      completed,
      correct,
      total,
      completionPercentage: total ? Math.round((completed / total) * 100) : 0,
      accuracy: completed ? Math.round((correct / completed) * 100) : 0,
      points: progress.points
    };
  }, [questions, progress]);

  // Format topic name
  const topicName = useMemo(() => 
    pagetopic?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || "",
    [pagetopic]
  );

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
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">
              {topicName}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mb-4">
              {stats.total} questions available
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
                        question={question}
                        index={index}
                        onAnswer={(isCorrect) => handleAnswer(question._id, isCorrect)}
                        isCompleted={progress.completed.includes(question._id)}
                        isCorrect={progress.correct.includes(question._id)}
                        isAdmin={user?.email === ADMIN_EMAIL}
                      />
                    ))}
                    
                    {/* Load More */}
                    {hasMore && (
                      <div className="text-center py-4">
                        <button
                          onClick={loadMore}
                          disabled={isLoadingQuestions}
                          className="px-6 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                        >
                          {isLoadingQuestions ? "Loading..." : "Load More Questions"}
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
