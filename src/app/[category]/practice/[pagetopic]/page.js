"use client";

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import debounce from "lodash/debounce";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { Trophy, Target, CheckCircle2, Star, Clock } from "lucide-react";

// Lazy-loaded components
const QuestionCard = dynamic(() => import("@/components/QuestionCard"), { 
  ssr: false,
  loading: () => <QuestionSkeleton />
});
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Sidebar = dynamic(() => import("@/components/Sidebar"), { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"), { ssr: false });

// Supabase Config with optimized settings
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { 
    fetch: (...args) => fetch(...args),
    db: { schema: 'public' },
    realtime: { params: { eventsPerSecond: 10 } },
    global: { headers: { 'x-my-custom-header': 'my-app-name' } }
  }
);

const ADMIN_EMAIL = "jain10gunjan@gmail.com";
const API_ENDPOINT = "/api/allsubtopics?category=GATE-CSE";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";

// Constants for batching
const BATCH_SIZE = 10;
const BATCH_DELAY = 2000; // 2 seconds
const MAX_RETRY_ATTEMPTS = 3;

// Memoized Skeleton Component
const QuestionSkeleton = memo(() => (
  <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm">
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
          <div className="space-y-1">
            <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
            <div className="h-2 w-12 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-2 h-2 bg-slate-200 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 bg-slate-200 rounded w-4/5 animate-pulse" />
      </div>
      <div className="grid gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-3 border border-slate-100 rounded-xl">
            <div className="w-6 h-6 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-3 bg-slate-100 rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
    </div>
  </div>
));

QuestionSkeleton.displayName = 'QuestionSkeleton';

// Memoized StatCard Component
const StatCard = memo(({ icon: Icon, label, value, color = "slate", isPending = false }) => (
  <div className={`bg-gradient-to-br from-${color}-50 to-${color}-100 p-4 rounded-xl border border-${color}-200/50 relative`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-${color}-600 text-xs font-medium`}>{label}</p>
        <p className={`text-${color}-900 text-lg font-bold`}>{value}</p>
      </div>
      <div className="flex items-center space-x-1">
        <Icon className={`text-${color}-500`} size={20} />
        {isPending && (
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Syncing..." />
        )}
      </div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

// Memoized DifficultyButton Component
const DifficultyButton = memo(({ difficulty, count, active, onClick, loading }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    disabled={loading}
    className={`px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 ${
      active ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : "bg-white text-slate-700 border border-slate-200"
    }`}
  >
    <span className="flex items-center space-x-1">
      <span className="capitalize">{difficulty}</span>
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
        {count || 0}
      </span>
    </span>
  </motion.button>
));

DifficultyButton.displayName = 'DifficultyButton';

const Pagetracker = memo(() => {
  // Optimized MathJax config
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

  // Refs for batch processing
  const pendingUpdatesRef = useRef(new Map());
  const batchTimeoutRef = useRef(null);
  const retryQueueRef = useRef(new Map());

  // Consolidated state with optimistic updates
  const [state, setState] = useState({
    data: [],
    questions: [],
    allQuestionsCounts: { easy: 0, medium: 0, hard: 0 },
    activeDifficulty: "easy",
    progress: { 
      completedquestions: [], 
      correctanswers: [], 
      points: 0,
      // Optimistic state
      pendingCompleted: new Set(),
      pendingCorrect: new Set(),
      pendingPoints: 0
    },
    isLoading: true,
    isDifficultyLoading: false,
    isSidebarOpen: false,
    activeSubject: null,
    syncStatus: 'synced', // 'synced', 'pending', 'error'
    editingQuestionId: null,
  });

  // Batch progress update function
  const processBatch = useCallback(async () => {
    if (!user || pendingUpdatesRef.current.size === 0) return;

    const updates = Array.from(pendingUpdatesRef.current.values());
    pendingUpdatesRef.current.clear();

    // Aggregate all updates
    const aggregated = updates.reduce((acc, update) => ({
      completedquestions: [...new Set([...acc.completedquestions, ...update.completedquestions])],
      correctanswers: [...new Set([...acc.correctanswers, ...update.correctanswers])],
      points: Math.max(acc.points, update.points)
    }), { completedquestions: [], correctanswers: [], points: 0 });

    try {
      setState(prev => ({ ...prev, syncStatus: 'pending' }));
      
      await supabase.from("user_progress").upsert({
        user_id: user.id,
        email: user.email,
        topic: pagetopic,
        completedquestions: aggregated.completedquestions,
        correctanswers: aggregated.correctanswers,
        points: aggregated.points,
        area: category,
      }, { onConflict: ["user_id", "topic"] });

      setState(prev => ({ 
        ...prev, 
        syncStatus: 'synced',
        progress: {
          ...prev.progress,
          pendingCompleted: new Set(),
          pendingCorrect: new Set(),
          pendingPoints: 0
        }
      }));

    } catch (error) {
      console.error("Batch update failed:", error);
      setState(prev => ({ ...prev, syncStatus: 'error' }));
      
      // Add to retry queue
      const retryKey = Date.now();
      retryQueueRef.current.set(retryKey, { ...aggregated, attempts: 1 });
      
      // Retry after delay
      setTimeout(() => retryFailedUpdate(retryKey), 5000);
    }
  }, [user, pagetopic, category]);

  // Retry failed updates
  const retryFailedUpdate = useCallback(async (retryKey) => {
    const retryData = retryQueueRef.current.get(retryKey);
    if (!retryData || retryData.attempts >= MAX_RETRY_ATTEMPTS) {
      retryQueueRef.current.delete(retryKey);
      return;
    }

    try {
      await supabase.from("user_progress").upsert({
        user_id: user.id,
        email: user.email,
        topic: pagetopic,
        completedquestions: retryData.completedquestions,
        correctanswers: retryData.correctanswers,
        points: retryData.points,
        area: category,
      }, { onConflict: ["user_id", "topic"] });

      retryQueueRef.current.delete(retryKey);
      setState(prev => ({ ...prev, syncStatus: 'synced' }));

    } catch (error) {
      retryData.attempts += 1;
      setTimeout(() => retryFailedUpdate(retryKey), 10000 * retryData.attempts);
    }
  }, [user, pagetopic, category]);

  // Debounced batch processor
  const debouncedBatchProcess = useMemo(
    () => debounce(processBatch, BATCH_DELAY),
    [processBatch]
  );

  // Memoized fetch functions (unchanged for brevity)
  const fetchSubjectsData = useCallback(async () => {
    try {
      const cacheKey = `subjects-${category}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedData = JSON.parse(cached);
        setState((prev) => ({ ...prev, data: parsedData, activeSubject: parsedData[0]?.subject }));
        return;
      }

      const response = await fetch(API_ENDPOINT, {
        method: "GET",
        headers: { Authorization: `Bearer ${TOKEN}` },
        cache: "force-cache",
      });
      
      if (!response.ok) throw new Error("Failed to fetch subjects");
      const { subjectsData } = await response.json();
      localStorage.setItem(cacheKey, JSON.stringify(subjectsData));
      setState((prev) => ({ ...prev, data: subjectsData, activeSubject: subjectsData[0]?.subject }));
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setState((prev) => ({ ...prev, data: [] }));
    }
  }, [category]);

  const fetchQuestionCounts = useCallback(async () => {
    if (!pagetopic || !category) return;
    try {
      const difficulties = ["easy", "medium", "hard"];
      const countPromises = difficulties.map(async (difficulty) => {
        const { count } = await supabase
          .from("examtracker")
          .select("*", { count: "exact", head: true })
          .eq("topic", pagetopic)
          .eq("category", category.toUpperCase())
          .eq("difficulty", difficulty);
        return { [difficulty]: count || 0 };
      });
      
      const counts = Object.assign({}, ...(await Promise.all(countPromises)));
      setState((prev) => ({ ...prev, allQuestionsCounts: counts }));
    } catch (error) {
      console.error("Error fetching question counts:", error);
    }
  }, [pagetopic, category]);

  const fetchQuestionsByDifficulty = useCallback(async (difficulty) => {
    if (!pagetopic || !category) return;
    setState((prev) => ({ ...prev, isDifficultyLoading: true }));
    try {
      const { data: questionsData, error } = await supabase
        .from("examtracker")
        .select("*")
        .eq("topic", pagetopic)
        .eq("category", category.toUpperCase())
        .eq("difficulty", difficulty)
        .order("_id");
      if (error) throw error;
      setState((prev) => ({ ...prev, questions: questionsData || [] }));
    } catch (error) {
      console.error("Fetch questions error:", error);
      setState((prev) => ({ ...prev, questions: [] }));
    } finally {
      setState((prev) => ({ ...prev, isDifficultyLoading: false }));
    }
  }, [pagetopic, category]);

  const fetchUserProgress = useCallback(async (userId) => {
    if (!userId || !pagetopic || !category) return;
    try {
      const { data, error } = await supabase
        .from("user_progress")
        .select("completedquestions, correctanswers, points")
        .eq("user_id", userId)
        .eq("topic", pagetopic)
        .eq("area", category)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      setState((prev) => ({ 
        ...prev, 
        progress: { 
          ...(data || { completedquestions: [], correctanswers: [], points: 0 }),
          pendingCompleted: new Set(),
          pendingCorrect: new Set(),
          pendingPoints: 0
        } 
      }));
    } catch (error) {
      console.error("Progress fetch error:", error);
    }
  }, [pagetopic, category]);

  const handleDifficultyChange = useCallback(
    (difficulty) => {
      if (difficulty === state.activeDifficulty || state.isDifficultyLoading) return;
      setState((prev) => ({ ...prev, activeDifficulty: difficulty }));
      fetchQuestionsByDifficulty(difficulty);
    },
    [state.activeDifficulty, state.isDifficultyLoading, fetchQuestionsByDifficulty]
  );

  // Optimized progress update with optimistic UI
  const updateProgress = useCallback(
    (questionId, isCorrect) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
      // Optimistic UI update - immediate response
      setState((prev) => {
        const newPendingCompleted = new Set([...prev.progress.pendingCompleted, questionId]);
        const newPendingCorrect = new Set(prev.progress.pendingCorrect);
        
        if (isCorrect) {
          newPendingCorrect.add(questionId);
        } else {
          newPendingCorrect.delete(questionId);
        }

        const newPendingPoints = prev.progress.pendingPoints + (isCorrect ? 100 : 0);

        // Prepare data for batch update
        const allCompleted = [...new Set([...prev.progress.completedquestions, ...newPendingCompleted])];
        const allCorrect = [...new Set([...prev.progress.correctanswers, ...newPendingCorrect])];
        const totalPoints = prev.progress.points + newPendingPoints;

        // Add to pending batch
        pendingUpdatesRef.current.set(questionId, {
          completedquestions: allCompleted,
          correctanswers: allCorrect,
          points: totalPoints
        });

        return {
          ...prev,
          progress: {
            ...prev.progress,
            pendingCompleted: newPendingCompleted,
            pendingCorrect: newPendingCorrect,
            pendingPoints: newPendingPoints
          },
          syncStatus: 'pending'
        };
      });

      // Trigger batch processing
      debouncedBatchProcess();
    },
    [user, setShowAuthModal, debouncedBatchProcess]
  );

  const handleQuestionEdit = useCallback((questionId, updatedData) => {
    setState((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q._id === questionId
          ? { ...q, ...updatedData, solutiontext: updatedData.solution }
          : q
      ),
      editingQuestionId: null,
    }));
  }, []);

  const handleStartEditing = useCallback((questionId) => {
    setState((prev) => ({
      ...prev,
      editingQuestionId: prev.editingQuestionId === questionId ? null : questionId,
    }));
  }, []);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      await Promise.all([fetchSubjectsData(), fetchQuestionCounts()]);
      await fetchQuestionsByDifficulty(state.activeDifficulty);
      setState((prev) => ({ ...prev, isLoading: false }));
    };
    loadData();
  }, [fetchSubjectsData, fetchQuestionCounts, fetchQuestionsByDifficulty, state.activeDifficulty]);

  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id);
    } else {
      setState((prev) => ({ 
        ...prev, 
        progress: { 
          completedquestions: [], 
          correctanswers: [], 
          points: 0,
          pendingCompleted: new Set(),
          pendingCorrect: new Set(),
          pendingPoints: 0
        } 
      }));
    }
  }, [user, fetchUserProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      debouncedBatchProcess.cancel();
    };
  }, [debouncedBatchProcess]);

  // Memoized stats calculation with optimistic updates
  const stats = useMemo(() => {
    const completedFromDB = state.questions.filter((q) => state.progress.completedquestions.includes(q._id)).length;
    const pendingCompleted = Array.from(state.progress.pendingCompleted).filter(id => 
      state.questions.some(q => q._id === id)
    ).length;
    
    const completed = completedFromDB + pendingCompleted;
    const correct = state.progress.correctanswers.length + state.progress.pendingCorrect.size;
    const total = state.questions.length;
    const points = state.progress.points + state.progress.pendingPoints;
    
    return {
      completed,
      correct,
      points,
      completionPercentage: total ? Math.round((completed / total) * 100) : 0,
      accuracy: completed ? Math.round((correct / completed) * 100) : 0,
      total,
      hasPendingUpdates: state.progress.pendingCompleted.size > 0 || state.progress.pendingCorrect.size > 0
    };
  }, [state.questions, state.progress]);

  // Helper function to check if question is completed (including pending)
  const isQuestionCompleted = useCallback((questionId) => {
    return state.progress.completedquestions.includes(questionId) || 
           state.progress.pendingCompleted.has(questionId);
  }, [state.progress.completedquestions, state.progress.pendingCompleted]);

  // Helper function to check if question is correct (including pending)
  const isQuestionCorrect = useCallback((questionId) => {
    return state.progress.correctanswers.includes(questionId) || 
           state.progress.pendingCorrect.has(questionId);
  }, [state.progress.correctanswers, state.progress.pendingCorrect]);

  // Loading state
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-24 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-4">
              {[1, 2, 3].map((i) => <QuestionSkeleton key={i} />)}
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mb-3" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-3 w-full bg-slate-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <MetaDataJobs
        seoTitle={`${pagetopic?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} ${category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} PYQs`}
        seoDescription={`Practice ${pagetopic?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} questions with detailed solutions.`}
      />
      <Navbar 
        setIsSidebarOpen={(value) => setState((prev) => ({ ...prev, isSidebarOpen: value }))}
        isSidebarOpen={state.isSidebarOpen}
        user={user} 
        setShowAuthModal={setShowAuthModal} 
      />
      <Sidebar 
        isSidebarOpen={state.isSidebarOpen}
        setIsSidebarOpen={(value) => setState((prev) => ({ ...prev, isSidebarOpen: value }))}
        data={state.data}
        activeSubject={state.activeSubject}
        setActiveSubject={(value) => setState((prev) => ({ ...prev, activeSubject: value }))}
      />
      <AnimatePresence>
        {state.isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10 lg:hidden" 
            onClick={() => setState((prev) => ({ ...prev, isSidebarOpen: false }))}
          />
        )}
      </AnimatePresence>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <main className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200/60 rounded-xl shadow-sm mb-6"
            >
              <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                  {pagetopic?.replace(/-/g, " ").toUpperCase()}
                </h1>
                    <p className="text-blue-100 text-sm">Master your concepts with curated questions</p>
                  </div>
                  {state.syncStatus === 'pending' && (
                    <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                      <span className="text-xs text-white">Syncing...</span>
                    </div>
                  )}
                  {state.syncStatus === 'error' && (
                    <div className="flex items-center space-x-2 bg-red-500/20 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-xs text-red-200">Sync failed</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-slate-700">Progress</span>
                    <span className="text-xs text-slate-500">{stats.completed}/{stats.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.completionPercentage}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["easy", "medium", "hard"].map((difficulty) => (
                    <DifficultyButton
                      key={difficulty}
                      difficulty={difficulty}
                      count={state.allQuestionsCounts[difficulty]}
                      active={state.activeDifficulty === difficulty}
                      loading={state.isDifficultyLoading}
                      onClick={() => handleDifficultyChange(difficulty)}
                    />
                  ))}
                </div>
                {!user && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">Sign in to track progress</p>
                      <p className="text-xs text-amber-600">Your answers won&apos;t be saved without an account</p>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setShowAuthModal(true)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium"
                    >
                      Sign In
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
            <MathJaxContext config={mathJaxConfig}>
              <MathJax>
                <AnimatePresence mode="wait">
                  {state.isDifficultyLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                      {[1, 2, 3].map((i) => <QuestionSkeleton key={i} />)}
                    </motion.div>
                  ) : state.questions.length > 0 ? (
                    <motion.div
                      key={`questions-${state.activeDifficulty}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      {state.questions.map((question, index) => (
                        <motion.div
                          key={question._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <QuestionCard
                            question={question}
                            index={index}
                            onAnswer={(isCorrect) => updateProgress(question._id, isCorrect)}
                            isCompleted={isQuestionCompleted(question._id)}
                            isCorrect={isQuestionCorrect(question._id)}
                            isAdmin={user?.email === ADMIN_EMAIL}
                            onEdit={handleQuestionEdit}
                            isEditing={state.editingQuestionId === question._id}
                            onStartEditing={() => handleStartEditing(question._id)}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 bg-white rounded-xl border border-slate-200/60"
                    >
                      <Clock size={36} className="mx-auto text-slate-400 mb-2" />
                      <h3 className="text-lg font-semibold text-slate-700">No questions available</h3>
                      <p className="text-sm text-slate-500">No questions found for {state.activeDifficulty} difficulty.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </MathJax>
            </MathJaxContext>
          </main>
          <aside className="hidden lg:block space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-200/60 rounded-xl p-4"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Trophy size={16} className="mr-1 text-yellow-500" />
                Your Stats
                {stats.hasPendingUpdates && (
                  <div className="ml-2 w-2 h-2 bg-orange-500 rounded-full animate-pulse" title="Updates pending sync" />
                )}
              </h2>
              <div className="grid gap-3">
                <StatCard 
                  icon={Target}
                  label="Completion"
                  value={`${stats.completionPercentage}%`}
                  color="blue"
                  isPending={stats.hasPendingUpdates}
                />
                <StatCard 
                  icon={CheckCircle2}
                  label="Correct"
                  value={stats.correct}
                  color="green"
                  isPending={stats.hasPendingUpdates}
                />
                <StatCard 
                  icon={Star}
                  label="Points"
                  value={stats.points} 
                  color="yellow"
                  isPending={stats.hasPendingUpdates}
                />
                <StatCard 
                  icon={CheckCircle2} 
                  label="Accuracy"
                  value={`${stats.accuracy}%`}
                  color="purple"
                  isPending={stats.hasPendingUpdates}
                />
              </div>
              {stats.completionPercentage === 100 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl border border-green-200 text-center"
                >
                  <h3 className="font-bold text-green-800 text-sm">Completed!</h3>
                  <p className="text-xs text-green-600">Great job finishing all questions!</p>
                </motion.div>
              )}
              {state.syncStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 bg-gradient-to-r from-red-50 to-rose-50 p-3 rounded-xl border border-red-200 text-center"
                >
                  <h3 className="font-bold text-red-800 text-sm">Sync Error</h3>
                  <p className="text-xs text-red-600">Your progress will be retried automatically</p>
                </motion.div>
              )}
            </motion.div>
          </aside>
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
            borderRadius: "8px",
            boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
          },
          success: { style: { background: "#10B981" } },
          error: { style: { background: "#EF4444" } },
        }}
      />
    </div>
  );
});

Pagetracker.displayName = 'Pagetracker';

export default Pagetracker;