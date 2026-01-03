"use client";

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import debounce from "lodash/debounce";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Clock, ArrowLeft } from "lucide-react";

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
const QUESTIONS_PER_PAGE = 10;
const BATCH_DELAY = 3000;
const CACHE_TTL = 5 * 60 * 1000;

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

const ChapterPracticePage = memo(() => {
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

  const { category, subject, chaptername } = useParams();
  const router = useRouter();
  const { user, setShowAuthModal } = useAuth();

  // Simplified state
  const [questions, setQuestions] = useState([]);
  const [counts, setCounts] = useState({ easy: 0, medium: 0, hard: 0 });
  const [totalQuestions, setTotalQuestions] = useState(0);
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

  // Helper function to normalize chapter names (same as API)
  const normalizeChapterName = useCallback((name) => {
    if (!name) return '';
    return name.toLowerCase().trim().replace(/\s+/g, ' ').replace(/-/g, ' ');
  }, []);

  // Normalize chapter name for querying (matches API normalization)
  const normalizedChapter = useMemo(() => {
    if (!chaptername) return null;
    // Convert URL slug back to chapter name format (same as API)
    // The API normalizes by replacing hyphens with spaces and lowercasing
    // But we need to query with the actual chapter name format from DB
    // So we'll try both formats - with spaces and with hyphens
    return chaptername.replace(/-/g, " ");
  }, [chaptername]);

  // Fetch counts efficiently via API
  const fetchCounts = useCallback(async () => {
    if (!category || !normalizedChapter) return;
    
    const cacheKey = `counts-chapter-${category}-${normalizedChapter}`;
    const cached = getCached(cacheKey);
    if (cached) {
      setCounts(cached);
      return;
    }

    try {
      // Use optimized API endpoint
      const encodedCategory = encodeURIComponent(category);
      const encodedChapter = encodeURIComponent(normalizedChapter);
      const response = await fetch(
        `/api/questions/chapter/counts?category=${encodedCategory}&chapter=${encodedChapter}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch counts');
      
      const result = await response.json();
      const countsData = {
        easy: result.easy || 0,
        medium: result.medium || 0,
        hard: result.hard || 0
      };

      setCounts(countsData);
      setTotalQuestions(result.total || 0);
      setCached(cacheKey, countsData);
    } catch (error) {
      console.error("Error fetching counts:", error);
      // Set default counts on error
      setCounts({ easy: 0, medium: 0, hard: 0 });
    }
  }, [category, normalizedChapter, getCached, setCached]);

  // Fetch questions efficiently via API with proper pagination
  const fetchQuestions = useCallback(async (difficulty, page = 1, append = false) => {
    if (!normalizedChapter || !category) return;

    setIsLoadingQuestions(true);
    try {
      const cacheKey = `questions-chapter-${category}-${normalizedChapter}-${difficulty}-${page}`;
      const cached = getCached(cacheKey);
      
      if (cached) {
        if (append) {
          setQuestions(prev => [...prev, ...cached.questions]);
        } else {
          setQuestions(cached.questions);
        }
        setHasMore(cached.hasMore);
        setIsLoadingQuestions(false);
        return;
      }

      // Use optimized API endpoint
      const encodedCategory = encodeURIComponent(category);
      const encodedChapter = encodeURIComponent(normalizedChapter);
      const response = await fetch(
        `/api/questions/chapter?category=${encodedCategory}&chapter=${encodedChapter}&difficulty=${difficulty}&page=${page}&limit=${QUESTIONS_PER_PAGE}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch questions');
      
      const result = await response.json();
      const questionsData = result.questions || [];
      
      if (append) {
        setQuestions(prev => [...prev, ...questionsData]);
      } else {
        setQuestions(questionsData);
      }
      
      setHasMore(result.hasMore || false);
      setCached(cacheKey, { questions: questionsData, hasMore: result.hasMore });
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load questions");
      setQuestions([]);
      setHasMore(false);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [category, normalizedChapter, getCached, setCached]);

  // Fetch user progress - aggregate from all topics in chapter
  const fetchUserProgress = useCallback(async () => {
    // Clerk user ID is user.id
    const userId = user?.id;
    if (!userId || !normalizedChapter || !category) {
      setProgress({ completed: [], correct: [], points: 0 });
      return;
    }

    try {
      // For chapter-wise, we need to get all topics in the chapter and aggregate progress
      // First, get all unique topics in this chapter - MUST SELECT chapter field!
      const { data: topicsData, error: topicsError } = await supabase
        .from("examtracker")
        .select("topic, chapter")
        .eq("category", category.toUpperCase())
        .limit(5000); // Increased limit to get all topics

      if (topicsError) {
        console.error("❌ [Progress] Error fetching topics:", topicsError);
        throw topicsError;
      }

      console.log("🔍 [Progress] Fetched topics data:", {
        totalRows: topicsData?.length || 0,
        sampleRow: topicsData?.[0],
        queryChapter: normalizedChapter
      });

      // Filter topics that belong to this chapter (with normalization)
      const chapterTopics = (topicsData || [])
        .filter(row => {
          if (!row.topic || !row.chapter) return false;
          // Normalize chapter names for comparison
          const rowChapter = normalizeChapterName(row.chapter);
          const queryChapter = normalizeChapterName(normalizedChapter);
          const matches = rowChapter === queryChapter;
          if (matches) {
            console.log("✅ [Progress] Chapter match found:", {
              rowChapter,
              queryChapter,
              topic: row.topic
            });
          }
          return matches;
        })
        .map(row => row.topic)
        .filter(Boolean);

      const uniqueTopics = [...new Set(chapterTopics)];
      
      console.log("📚 [Progress] Found topics for chapter:", {
        chapter: normalizedChapter,
        topicCount: uniqueTopics.length,
        topics: uniqueTopics.slice(0, 5) // Log first 5 for debugging
      });

      if (uniqueTopics.length === 0) {
        console.warn("⚠️ [Progress] No topics found for chapter:", normalizedChapter);
        setProgress({ completed: [], correct: [], points: 0 });
        return;
      }

      // Fetch progress for all topics in this chapter
      // Try both lowercase and original case for area
      const areaVariants = [category?.toLowerCase(), category];
      let progressData = null;
      let error = null;

      for (const area of areaVariants) {
        const { data, error: queryError } = await supabase
          .from("user_progress")
          .select("completedquestions, correctanswers, points, topic")
          .eq("user_id", userId)
          .eq("area", area)
          .in("topic", uniqueTopics);

        if (!queryError && data && data.length > 0) {
          progressData = data;
          error = null;
          console.log(`✅ [Progress] Found progress with area: ${area}`, {
            records: data.length,
            topics: data.map(d => d.topic)
          });
          break;
        } else if (queryError && queryError.code !== "PGRST116") {
          error = queryError;
        }
      }

      if (error && error.code !== "PGRST116") {
        console.error("❌ [Progress] Error fetching progress:", error);
        throw error;
      }

      if (error && error.code !== "PGRST116") {
        console.error("❌ [Progress] Error fetching progress:", error);
        throw error;
      }

      // Aggregate progress from all topics
      const completed = new Set();
      const correct = new Set();
      let totalPoints = 0;

      if (progressData && progressData.length > 0) {
        progressData.forEach(item => {
          const completedQs = Array.isArray(item.completedquestions) ? item.completedquestions : [];
          const correctQs = Array.isArray(item.correctanswers) ? item.correctanswers : [];
          const points = typeof item.points === 'number' ? item.points : 0;
          
          console.log(`📊 [Progress] Processing topic ${item.topic}:`, {
            completed: completedQs.length,
            correct: correctQs.length,
            points
          });
          
          completedQs.forEach(id => completed.add(id));
          correctQs.forEach(id => correct.add(id));
          totalPoints += points;
        });
      } else {
        console.log("ℹ️ [Progress] No progress data found for any topics");
      }

      console.log("✅ [Progress] Loaded chapter progress:", {
        completed: completed.size,
        correct: correct.size,
        points: totalPoints,
        topicsWithProgress: progressData?.length || 0,
        totalTopics: uniqueTopics.length
      });

      setProgress({
        completed: Array.from(completed),
        correct: Array.from(correct),
        points: totalPoints
      });
    } catch (error) {
      console.error("❌ [Progress] Error fetching user progress:", error);
      setProgress({ completed: [], correct: [], points: 0 });
    }
  }, [user, normalizedChapter, category, normalizeChapterName]);

  // Save progress - save to all topics in chapter (like topic-wise but for each topic)
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

    // Clerk user ID is user.id
    const userId = user?.id;
    if (!userId) {
      console.warn("⚠️ [Progress] Cannot save: user ID not available");
      return;
    }

    console.log("💾 [Progress] Saving chapter progress:", {
      updatesCount: updates.length,
      immediate,
      userId: userId,
      chapter: normalizedChapter,
      area: category
    });

    try {
      // Get all topics in this chapter
      const { data: topicsData, error: topicsError } = await supabase
        .from("examtracker")
        .select("topic, chapter")
        .eq("category", category.toUpperCase())
        .limit(5000);

      if (topicsError) throw topicsError;

      // Filter topics that belong to this chapter
      const chapterTopics = (topicsData || [])
        .filter(row => {
          if (!row.topic || !row.chapter) return false;
          const rowChapter = normalizeChapterName(row.chapter);
          const queryChapter = normalizeChapterName(normalizedChapter);
          return rowChapter === queryChapter;
        })
        .map(row => row.topic)
        .filter(Boolean);

      const uniqueTopics = [...new Set(chapterTopics)];
      
      if (uniqueTopics.length === 0) {
        console.warn("⚠️ [Progress] No topics found for chapter");
        return;
      }

      // Aggregate new updates
      const newUpdates = updates.reduce((acc, update) => ({
        completed: [...new Set([...acc.completed, ...update.completed])],
        correct: [...new Set([...acc.correct, ...update.correct])],
        points: acc.points + (update.points || 0)
      }), { completed: [], correct: [], points: 0 });

      // Get user email (Clerk format: primaryEmailAddress.emailAddress)
      const userEmail = user?.primaryEmailAddress?.emailAddress || null;

      // For each topic in the chapter, update progress
      // We'll merge the chapter-level progress with each topic's existing progress
      const progressPromises = uniqueTopics.map(async (topic) => {
        try {
          // Fetch existing progress for this topic
          const { data: existingProgress, error: fetchError } = await supabase
            .from("user_progress")
            .select("completedquestions, correctanswers, points")
            .eq("user_id", userId)
            .eq("topic", topic)
            .eq("area", category?.toLowerCase())
            .maybeSingle();

          if (fetchError && fetchError.code !== "PGRST116") {
            console.error(`❌ [Progress] Error fetching progress for topic ${topic}:`, fetchError);
            return { success: false, topic, error: fetchError };
          }

          // Get existing arrays
          const existingCompleted = Array.isArray(existingProgress?.completedquestions) 
            ? existingProgress.completedquestions 
            : [];
          const existingCorrect = Array.isArray(existingProgress?.correctanswers) 
            ? existingProgress.correctanswers 
            : [];
          const existingPoints = typeof existingProgress?.points === 'number' 
            ? existingProgress.points 
            : 0;

          // Merge existing with new updates
          const mergedCompleted = [...new Set([...existingCompleted, ...newUpdates.completed])];
          const mergedCorrect = [...new Set([...existingCorrect, ...newUpdates.correct])];
          const mergedPoints = existingPoints + newUpdates.points;

          // Upsert progress for this topic
          // Use lowercase area to match topic-wise practice format
          const area = category?.toLowerCase();
          const progressData = {
            user_id: userId,
            email: userEmail,
            topic: topic,
            completedquestions: mergedCompleted,
            correctanswers: mergedCorrect,
            points: mergedPoints,
            area: area,
          };

          // Try upsert first
          let { error: saveError, data: savedData } = await supabase
            .from("user_progress")
            .upsert(progressData, { 
              onConflict: "user_id,topic,area"
            })
            .select();

          // If upsert fails, try insert then update
          if (saveError) {
            console.warn(`⚠️ [Progress] Upsert failed for topic ${topic}, trying insert/update:`, saveError);
            
            // Try to insert first
            const { error: insertError } = await supabase
              .from("user_progress")
              .insert(progressData);

            // If insert fails (likely due to existing record), try update
            if (insertError) {
              console.log(`ℹ️ [Progress] Insert failed for topic ${topic} (record exists), trying update`);
              const { error: updateError } = await supabase
                .from("user_progress")
              .update({
                completedquestions: mergedCompleted,
                correctanswers: mergedCorrect,
                points: mergedPoints,
                email: userEmail,
              })
              .eq("user_id", userId)
              .eq("topic", topic)
              .eq("area", category?.toLowerCase());

              if (updateError) {
                console.error(`❌ [Progress] Update also failed for topic ${topic}:`, updateError);
                return { success: false, topic, error: updateError };
              }
            }
          } else {
            console.log(`✅ [Progress] Upsert successful for topic ${topic}`);
          }

          return { success: true, topic };
        } catch (error) {
          console.error(`❌ [Progress] Error processing topic ${topic}:`, error);
          return { success: false, topic, error };
        }
      });

      // Wait for all promises and check results
      const results = await Promise.allSettled(progressPromises);
      const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));
      
      if (failed.length > 0) {
        console.warn(`⚠️ [Progress] ${failed.length} topics failed to save:`, failed);
        // Don't throw - we still want to update local state if some succeeded
      }

      // Update local state with merged data
      setProgress(prev => ({
        completed: [...new Set([...prev.completed, ...newUpdates.completed])],
        correct: [...new Set([...prev.correct, ...newUpdates.correct])],
        points: prev.points + newUpdates.points
      }));

      console.log("✅ [Progress] Chapter progress saved successfully");
      toast.success("Progress saved!", { duration: 2000 });
    } catch (error) {
      console.error("❌ [Progress] Error saving progress:", error);
      toast.error("Failed to save progress. Retrying...");
      // Re-add to queue for retry
      updates.forEach(update => {
        pendingUpdatesRef.current.set(Date.now(), update);
      });
    }
  }, [user, normalizedChapter, category, normalizeChapterName]);

  const debouncedSave = useMemo(
    () => debounce(() => saveProgress(false), BATCH_DELAY),
    [saveProgress]
  );

  const saveProgressImmediate = useCallback(() => {
    saveProgress(true);
  }, [saveProgress]);

  // Handle answer
  const handleAnswer = useCallback((questionId, isCorrect) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setProgress(prev => ({
      completed: [...new Set([...prev.completed, questionId])],
      correct: isCorrect 
        ? [...new Set([...prev.correct, questionId])]
        : prev.correct.filter(id => id !== questionId),
      points: prev.points + (isCorrect ? 100 : 0)
    }));

    pendingUpdatesRef.current.set(questionId, {
      completed: [questionId],
      correct: isCorrect ? [questionId] : [],
      points: isCorrect ? 100 : 0
    });

    saveProgressImmediate();
  }, [user, setShowAuthModal, saveProgressImmediate]);

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
      if (pendingUpdatesRef.current.size > 0 && user) {
        saveProgress(true);
      }
    };
  }, [debouncedSave, user, saveProgress]);

  // Save progress before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUpdatesRef.current.size > 0 && user) {
        saveProgress(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, saveProgress]);

  // Calculate stats - use total from counts for accurate display
  const stats = useMemo(() => {
    const completed = questions.filter(q => progress.completed.includes(q._id)).length;
    const correct = questions.filter(q => progress.correct.includes(q._id)).length;
    // Use the count for current difficulty as the total for accurate metrics
    const totalForDifficulty = counts[activeDifficulty] || 0;
    // Total across all difficulties
    const totalAll = totalQuestions || (counts.easy + counts.medium + counts.hard);
    
    return {
      completed,
      correct,
      total: totalForDifficulty, // Show total for current difficulty
      totalAll, // Total across all difficulties
      completionPercentage: totalForDifficulty ? Math.round((completed / totalForDifficulty) * 100) : 0,
      accuracy: completed ? Math.round((correct / completed) * 100) : 0,
      points: progress.points
    };
  }, [questions, progress, counts, activeDifficulty, totalQuestions]);

  // Format chapter name
  const chapterName = useMemo(() => 
    normalizedChapter?.replace(/\b\w/g, (char) => char.toUpperCase()) || "",
    [normalizedChapter]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MetaDataJobs
          seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
          seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
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
        seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
        seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
      />
      <div className="bg-neutral-50 pt-4 overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link
              href={`/${category}/${subject}/${chaptername}`}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Chapter Topics</span>
            </Link>
          </div>

          {/* Header with Stats */}
          <div className="mb-4 sm:mb-8 mt-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">
              {chapterName} - Chapter Practice
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mb-4">
              {stats.total} {activeDifficulty} questions • {stats.totalAll} total questions
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
                        isAdmin={user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL}
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

ChapterPracticePage.displayName = 'ChapterPracticePage';

export default ChapterPracticePage;

