"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, BookOpen, ShieldClose } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "@/components/Navbar";
import { getCachedData, invalidateCache } from "@/lib/utils/apiCache";

// ─── Lazy-loaded components ───────────────────────────────────────────────────
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const Alert    = dynamic(() => import("@/components/Alert"),    { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"),  { ssr: false });

// ─── Supabase (singleton) ─────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

// ─── API token (constant – must NOT be in any dependency array) ───────────────
const API_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";

// ─── TTLs ─────────────────────────────────────────────────────────────────────
const TTL_CONTENT  = 10 * 60 * 1000; // 10 min – questions / chapters don't change often
const TTL_PROGRESS =  2 * 60 * 1000; //  2 min – user progress

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Rendering error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex justify-center items-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-neutral-200 max-w-md">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Something went wrong</h1>
            <p className="text-neutral-600 mb-4">Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 transition duration-150"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── GATE category set (stable reference – lives outside the component) ────────
const GATE_CATEGORIES = new Set([
  "gate-cse", "gate-me", "gate-ec", "gate-ee", "gate-ex", "gate-da",
  "general-aptitude", "verbal-reasoning", "non-verbal-reasoning", "verbal-ability",
]);

// =============================================================================
// Component
// =============================================================================
const Examtracker = () => {
  const { category, subject } = useParams();
  const { user, setShowAuthModal } = useAuth();

  // ── Derived constants (never change after first render) ─────────────────────
  const isGateExam = useMemo(
    () => GATE_CATEGORIES.has(category?.toLowerCase()),
    [category]
  );

  const decodedSubject  = subject ? decodeURIComponent(subject) : null;
  const formattedSubject = decodedSubject
    ? decodedSubject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  const encodedCategory = category ? encodeURIComponent(category.toUpperCase()) : "";
  const encodedSubject  = subject  ? encodeURIComponent(subject)               : "";

  // ── State ────────────────────────────────────────────────────────────────────
  const [data,          setData]          = useState([]); // GATE: subjectsData
  const [chapters,      setChapters]      = useState([]); // non-GATE
  const [chapterTopics, setChapterTopics] = useState({}); // { chapterKey → Topic[] }
  const [userProgress,  setUserProgress]  = useState({});
  const [searchTerm,    setSearchTerm]    = useState("");
  const [sortBy,        setSortBy]        = useState("default");
  const [isLoading,     setIsLoading]     = useState(true);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [activeSubject, setActiveSubject] = useState(formattedSubject || "");

  const searchInputRef    = useRef(null);
  const fetchInFlightRef  = useRef(false); // prevent duplicate concurrent fetches

  // ── Cache keys (stable) ──────────────────────────────────────────────────────
  const cacheKeyContent  = `content-${category}-${subject}`;          // chapters+topics OR gate subjects
  const cacheKeyProgress = `progress-${user?.id}-${category}`;

  // ── Sync activeSubject when URL changes ──────────────────────────────────────
  useEffect(() => {
    setActiveSubject(formattedSubject || "");
  }, [formattedSubject]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * GATE exams — single API call returns all subtopics.
   */
  const fetchGateData = useCallback(
    async (forceRefresh = false) => {
      if (fetchInFlightRef.current) return;
      fetchInFlightRef.current = true;
      setIsLoading(true);

      try {
        if (forceRefresh) invalidateCache(cacheKeyContent);

        const subjectsData = await getCachedData(
          cacheKeyContent,
          async () => {
            const res = await fetch(
              `/api/allsubtopics?category=${encodedCategory}`,
              {
                headers: {
                  Authorization: `Bearer ${API_TOKEN}`,
                  "Cache-Control": "max-age=600",
                },
              }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            return json.subjectsData || [];
          },
          TTL_CONTENT
        );

        setData(subjectsData || []);
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("fetchGateData:", err);
      } finally {
        setIsLoading(false);
        fetchInFlightRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKeyContent, encodedCategory]
  );

  /**
   * Non-GATE exams — single call to /api/chapters/with-topics
   * which returns chapters + embedded topics from ONE Supabase query.
   */
  const fetchChaptersWithTopics = useCallback(
    async (forceRefresh = false) => {
      if (fetchInFlightRef.current) return;
      fetchInFlightRef.current = true;
      setIsLoading(true);

      try {
        if (forceRefresh) invalidateCache(cacheKeyContent);

        const cached = await getCachedData(
          cacheKeyContent,
          async () => {
            const url = `/api/chapters/with-topics?category=${encodedCategory}&subject=${encodedSubject}`;
            const res = await fetch(url);

            if (!res.ok) {
              const text = await res.text();
              throw new Error(`HTTP ${res.status}: ${text}`);
            }

            const json = await res.json();
            if (!json.success) throw new Error(json.error || "API error");

            const chapters = json.data?.chapters || [];

            // Build topicsMap from the embedded topics array on each chapter
            const topicsMap = Object.fromEntries(
              chapters.map((ch) => [ch.slug || ch.title, ch.topics || []])
            );

            return { chapters, topicsMap };
          },
          TTL_CONTENT
        );

        setChapters(cached.chapters || []);
        setChapterTopics(cached.topicsMap || {});
      } catch (err) {
        if (process.env.NODE_ENV === "development")
          console.error("fetchChaptersWithTopics:", err);
        setChapters([]);
        setChapterTopics({});
      } finally {
        setIsLoading(false);
        fetchInFlightRef.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKeyContent, encodedCategory, encodedSubject]
  );

  /**
   * User progress — single Supabase query, cached.
   */
  const fetchUserProgress = useCallback(
    async (userId) => {
      if (!userId || !category) return;

      try {
        const progressMap = await getCachedData(
          cacheKeyProgress,
          async () => {
            const { data: rows, error } = await supabase
              .from("user_progress")
              .select("topic, completedquestions, correctanswers, points")
              .eq("user_id", userId)
              .eq("area", category.toLowerCase())
              .limit(500); // reasonable upper bound

            if (error) throw error;

            const map = {};
            rows?.forEach((row) => {
              map[row.topic] = {
                completedQuestions: row.completedquestions || [],
                correctAnswers:     row.correctanswers    || [],
                points:             row.points            || 0,
              };
            });
            return map;
          },
          TTL_PROGRESS
        );

        setUserProgress(progressMap || {});
      } catch (err) {
        if (process.env.NODE_ENV === "development") console.error("fetchUserProgress:", err);
        setUserProgress({});
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKeyProgress, category]
  );

  // ── Mount / category+subject change ─────────────────────────────────────────
  useEffect(() => {
    if (isGateExam) {
      fetchGateData(false);
    } else {
      fetchChaptersWithTopics(false);
    }
    // No polling interval — rely on stale cache + manual refresh button
  }, [isGateExam, fetchGateData, fetchChaptersWithTopics]);

  // ── User change ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user?.id) {
      fetchUserProgress(user.id);
    } else {
      setUserProgress({});
    }
  }, [user?.id, fetchUserProgress]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && searchTerm) setSearchTerm("");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchTerm]);

  // ── Manual refresh ───────────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    if (isGateExam) fetchGateData(true);
    else fetchChaptersWithTopics(true);
  }, [isGateExam, fetchGateData, fetchChaptersWithTopics]);

  // ============================================================================
  // DERIVED DATA (memos)
  // ============================================================================

  const totalQuestionCount = useMemo(
    () =>
      data.reduce(
        (acc, s) =>
          acc + (s.subtopics || []).reduce((sum, t) => sum + (t.count || 0), 0),
        0
      ),
    [data]
  );

  const allSubtopics = useMemo(
    () =>
      data.flatMap((s) =>
        (s.subtopics || []).map((t) => ({
          ...t,
          parentSubject: s.subject,
          uniqueId: `${s.subject}-${t.title}`,
        }))
      ),
    [data]
  );

  // ── GATE: filtered + sorted topics ──────────────────────────────────────────
  const filteredAndSortedTopics = useMemo(() => {
    if (!isGateExam) return [];

    let topics = [];

    if (activeSubject) {
      const normalize = (str) => str.toLowerCase().replace(/[-\s]/g, "");
      const found = data.find(
        (s) =>
          s.subject === activeSubject ||
          s.subject.toLowerCase() === activeSubject.toLowerCase() ||
          normalize(s.subject) === normalize(activeSubject)
      );
      topics = found
        ? (found.subtopics || []).map((t) => ({
            ...t,
            parentSubject: found.subject,
            uniqueId: `${found.subject}-${t.title}`,
          }))
        : allSubtopics;
    } else {
      topics = allSubtopics;
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      topics = topics.filter((t) => t.title.toLowerCase().includes(lower));
    }

    // Immutable sort — never mutate source array
    return [...topics].sort((a, b) => {
      const aComp = userProgress[a.title]?.completedQuestions?.length || 0;
      const bComp = userProgress[b.title]?.completedQuestions?.length || 0;
      const aTotal = a.count || 1;
      const bTotal = b.count || 1;

      switch (sortBy) {
        case "progress":
          return bComp / bTotal - aComp / aTotal;
        case "remaining":
          return (bTotal - bComp) - (aTotal - aComp);
        default:
          return activeSubject
            ? a.title.localeCompare(b.title)
            : a.parentSubject.localeCompare(b.parentSubject) ||
                a.title.localeCompare(b.title);
      }
    });
  }, [isGateExam, activeSubject, allSubtopics, searchTerm, sortBy, userProgress, data]);

  // ── Non-GATE: chapter progress map ──────────────────────────────────────────
  const chapterProgressMap = useMemo(() => {
    if (isGateExam) return {};

    const map = {};
    chapters.forEach((chapter) => {
      const key    = chapter.slug || chapter.title;
      const topics = chapterTopics[key] || [];

      const totalQ     = topics.reduce((s, t) => s + (t.count || 0), 0);
      const completedQ = topics.reduce((s, t) => {
        return s + (userProgress[t.title]?.completedQuestions?.length || 0);
      }, 0);
      const correctA   = topics.reduce((s, t) => {
        return s + (userProgress[t.title]?.correctAnswers?.length || 0);
      }, 0);
      const completedTopicsCount = topics.filter(
        (t) => (userProgress[t.title]?.completedQuestions?.length || 0) > 0
      ).length;

      const effectiveTotal = totalQ || chapter.count || 0;

      map[key] = {
        totalQuestions:      effectiveTotal,
        completedQuestions:  completedQ,
        correctAnswers:      correctA,
        completedTopics:     completedTopicsCount,
        totalTopics:         topics.length,
        progressPercentage:  effectiveTotal ? Math.round((completedQ / effectiveTotal) * 100) : 0,
        accuracy:            completedQ > 0 ? Math.round((correctA / completedQ) * 100) : 0,
        isCompleted:
          topics.length > 0 &&
          completedTopicsCount === topics.length,
      };
    });
    return map;
  }, [chapters, chapterTopics, userProgress, isGateExam]);

  // ── Non-GATE: filtered + sorted chapters ────────────────────────────────────
  const filteredAndSortedChapters = useMemo(() => {
    if (isGateExam) return [];

    let filtered = searchTerm
      ? chapters.filter((ch) =>
          ch.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : chapters;

    return [...filtered].sort((a, b) => {
      const ap = chapterProgressMap[a.slug || a.title] || {};
      const bp = chapterProgressMap[b.slug || b.title] || {};

      switch (sortBy) {
        case "progress":
          return (bp.progressPercentage || 0) - (ap.progressPercentage || 0);
        case "remaining":
          return (
            (ap.totalQuestions || 0) - (ap.completedQuestions || 0) -
            ((bp.totalQuestions || 0) - (bp.completedQuestions || 0))
          );
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [isGateExam, chapters, searchTerm, sortBy, chapterProgressMap]);

  // ── Aggregate progress for sidebar / snapshot ────────────────────────────────
  const aggregateProgress = useMemo(() => {
    if (isGateExam) {
      const totalTopics    = allSubtopics.length;
      const completedTopics = Object.keys(userProgress).filter(
        (k) => (userProgress[k].completedQuestions?.length || 0) > 0
      ).length;
      const totalDone    = Object.values(userProgress).reduce(
        (s, t) => s + (t.completedQuestions?.length || 0), 0
      );
      const totalCorrect = Object.values(userProgress).reduce(
        (s, t) => s + (t.correctAnswers?.length || 0), 0
      );

      return {
        completedCount:              completedTopics,
        completionPercentage:        totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0,
        totalCompletedQuestions:     totalDone,
        totalCorrectAnswers:         totalCorrect,
        questionCompletionPercentage: totalQuestionCount
          ? Math.round((totalDone / totalQuestionCount) * 100)
          : 0,
        accuracy: totalDone > 0 ? Math.round((totalCorrect / totalDone) * 100) : 0,
      };
    }

    // Non-GATE
    const totalChapters     = chapters.length;
    const completedChapters = chapters.filter((ch) => {
      const p = chapterProgressMap[ch.slug || ch.title];
      return p?.isCompleted;
    }).length;

    const totalQ     = chapters.reduce((s, ch) => s + (chapterProgressMap[ch.slug || ch.title]?.totalQuestions || ch.count || 0), 0);
    const completedQ = chapters.reduce((s, ch) => s + (chapterProgressMap[ch.slug || ch.title]?.completedQuestions || 0), 0);
    const correctA   = chapters.reduce((s, ch) => s + (chapterProgressMap[ch.slug || ch.title]?.correctAnswers || 0), 0);

    return {
      completedCount:              completedChapters,
      completionPercentage:        totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0,
      totalCompletedQuestions:     completedQ,
      totalCorrectAnswers:         correctA,
      questionCompletionPercentage: totalQ ? Math.round((completedQ / totalQ) * 100) : 0,
      accuracy: completedQ > 0 ? Math.round((correctA / completedQ) * 100) : 0,
    };
  }, [
    isGateExam,
    allSubtopics.length,
    userProgress,
    totalQuestionCount,
    chapters,
    chapterProgressMap,
  ]);

  // Total questions shown in snapshot
  const snapshotTotalQuestions = useMemo(() => {
    if (isGateExam) return totalQuestionCount;
    return chapters.reduce(
      (s, ch) => s + (chapterProgressMap[ch.slug || ch.title]?.totalQuestions || ch.count || 0),
      0
    );
  }, [isGateExam, totalQuestionCount, chapters, chapterProgressMap]);

  // ── SEO strings ──────────────────────────────────────────────────────────────
  const categoryLabel = category
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const ProgressSidebar = (
    <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-neutral-200 p-5">
      <h3 className="text-lg font-medium text-neutral-900 mb-4">
        {category?.toUpperCase()} Tracker
      </h3>
      {user ? (
        <div className="mb-6 bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
          <h4 className="text-sm font-semibold text-neutral-800 mb-3">Progress</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{isGateExam ? "Topics" : "Chapters"}</span>
                <span>{aggregateProgress.completionPercentage}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-neutral-900 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${aggregateProgress.completionPercentage}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                {isGateExam ? "Topics" : "Chapters"}:{" "}
                {aggregateProgress.completedCount}/
                {isGateExam ? allSubtopics.length : chapters.length}
              </div>
              <div>Questions: {aggregateProgress.totalCompletedQuestions}/{snapshotTotalQuestions}</div>
              <div>Correct: {aggregateProgress.totalCorrectAnswers}</div>
              <div>Accuracy: {aggregateProgress.accuracy}%</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
          <h4 className="text-sm font-medium text-neutral-800 mb-2">Track Your Progress</h4>
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition duration-150"
          >
            Sign In
          </button>
        </div>
      )}
      <div className="mt-2 rounded-2xl bg-neutral-50 border border-neutral-200 p-4">
        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Practice tools</h4>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Use search + sorting above the grid to quickly find what to practice next.
        </p>
      </div>
    </div>
  );

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Suspense fallback={null}>
          <MetaDataJobs
            seoTitle={`${categoryLabel} Practice Tracker`}
            seoDescription={`Practice ${categoryLabel} PYQs Topic-Wise Chapter-Wise.`}
          />
        </Suspense>
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] pt-20 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-4 max-w-md w-full"
          >
            <div className="w-10 h-10 rounded-full border-4 border-t-indigo-600 border-indigo-100 animate-spin flex-shrink-0" />
            <div>
              <h3 className="text-base sm:text-xl font-medium text-neutral-900 mb-1">
                Loading your dashboard
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600">Please wait a moment…</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <MetaDataJobs
          seoTitle={`${categoryLabel} Practice Tracker`}
          seoDescription={`Practice ${categoryLabel} PYQs Topic-Wise Chapter-Wise Date-Wise questions with detailed solutions.`}
        />
      </Suspense>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      <div className="min-h-screen bg-neutral-50 pt-20 pb-24 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">

          {/* ── Hero ─────────────────────────────────────────────────────────── */}
          <section className="mb-6 sm:mb-8 border-b border-neutral-200 pb-5 sm:pb-6 bg-white rounded-3xl shadow-sm">
            <div className="relative overflow-hidden rounded-3xl">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.04),transparent_55%),radial-gradient(circle_at_80%_0%,rgba(0,0,0,0.03),transparent_55%)]" />
              <div className="relative px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
                <div className="flex flex-col gap-5 lg:grid lg:grid-cols-12 lg:items-start">

                  {/* Left */}
                  <div className="lg:col-span-7 min-w-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200">
                      <span className="text-[11px] font-semibold text-neutral-700">
                        {category?.toUpperCase()} • {formattedSubject || "Subject"}
                      </span>
                    </div>
                    <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-900 tracking-tight">
                      {formattedSubject || `${category?.toUpperCase()} practice`}
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-neutral-600 max-w-xl leading-relaxed">
                      Stay on one clean dashboard for this subject: track progress, practice
                      PYQs, run topic tests and attempt mocks without hopping between pages.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          document
                            .getElementById("practice-grid")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        Start practice
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                        aria-label="Refresh data"
                      >
                        <svg
                          className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMobileOptions(true)}
                        className="inline-flex md:hidden items-center gap-2 rounded-xl bg-white border border-neutral-300 text-neutral-800 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-neutral-50 transition-colors"
                        aria-label="Show options and progress"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Options &amp; progress
                      </button>
                    </div>
                  </div>

                  {/* Right: snapshot */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur p-4 sm:p-5">
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                        Snapshot
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm text-neutral-700">
                        {[
                          {
                            value: isGateExam ? allSubtopics.length : chapters.length,
                            label: isGateExam ? "Topics" : "Chapters",
                          },
                          { value: snapshotTotalQuestions, label: "Questions" },
                          { value: `${aggregateProgress.completionPercentage}%`, label: "Completed" },
                        ].map(({ value, label }) => (
                          <div key={label} className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2">
                            <p className="text-base sm:text-lg font-semibold text-neutral-900">{value}</p>
                            <p className="mt-0.5 text-[11px] text-neutral-600">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Body ─────────────────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:space-x-8">

            {/* Sidebar (desktop) */}
            <div className="hidden md:block w-64 flex-shrink-0">
              {ProgressSidebar}
            </div>

            {/* Mobile options drawer */}
            <AnimatePresence>
              {showMobileOptions && (
                <motion.div
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowMobileOptions(false)}
                >
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8 border-t border-neutral-200"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-neutral-900">Options</h3>
                      <button
                        onClick={() => setShowMobileOptions(false)}
                        className="text-neutral-500"
                        aria-label="Close options"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Reuse same sidebar content */}
                    {user ? (
                      <div className="mb-6 bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
                        <h4 className="text-sm font-semibold text-neutral-800 mb-3">Progress</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{isGateExam ? "Topics" : "Chapters"}</span>
                              <span>{aggregateProgress.completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div
                                className="bg-neutral-900 h-2 rounded-full"
                                style={{ width: `${aggregateProgress.completionPercentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              {isGateExam ? "Topics" : "Chapters"}: {aggregateProgress.completedCount}/
                              {isGateExam ? allSubtopics.length : chapters.length}
                            </div>
                            <div>Questions: {aggregateProgress.totalCompletedQuestions}/{snapshotTotalQuestions}</div>
                            <div>Correct: {aggregateProgress.totalCorrectAnswers}</div>
                            <div>Accuracy: {aggregateProgress.accuracy}%</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
                        <h4 className="text-sm font-medium text-neutral-800 mb-2">Track Your Progress</h4>
                        <button
                          onClick={() => { setShowAuthModal(true); setShowMobileOptions(false); }}
                          className="w-full py-2 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition duration-150"
                        >
                          Sign In
                        </button>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 uppercase mb-3">Sort Options</h4>
                      <div className="space-y-1">
                        {["default", "progress", "remaining"].map((option) => (
                          <button
                            key={option}
                            className={`w-full text-left px-3 py-2 rounded-xl transition ${
                              sortBy === option
                                ? "bg-neutral-100 text-neutral-900"
                                : "text-neutral-700 hover:bg-neutral-100"
                            }`}
                            onClick={() => { setSortBy(option); setShowMobileOptions(false); }}
                            aria-pressed={sortBy === option}
                          >
                            Sort by {option.charAt(0).toUpperCase() + option.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main content */}
            <div className="md:flex-1">
              {/* Search + sort bar */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight truncate">
                        {activeSubject || "All Subjects"}
                      </h2>
                      <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                        Showing{" "}
                        <span className="font-semibold text-neutral-800">
                          {isGateExam
                            ? filteredAndSortedTopics.length
                            : filteredAndSortedChapters.length}
                        </span>{" "}
                        {isGateExam ? "topics" : "chapters"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSearchTerm(""); setSortBy("default"); }}
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                      aria-label="Reset search and sort"
                    >
                      <ShieldClose className="w-4 h-4 text-neutral-500" />
                      Reset
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Search */}
                    <div className="relative sm:max-w-xs w-full">
                      <svg className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={`Search ${isGateExam ? "topics" : "chapters"} (Ctrl + /)`}
                        className="pl-10 pr-10 py-2.5 w-full border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 text-sm bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          onClick={() => setSearchTerm("")}
                          aria-label="Clear search"
                        >
                          <svg className="h-5 w-5 text-neutral-400 hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Sort toggle */}
                    <div className="flex-1 flex items-center justify-between gap-3">
                      <p className="text-xs sm:text-sm font-semibold text-neutral-600 whitespace-nowrap">Sort</p>
                      <div className="inline-flex bg-neutral-100 p-1 rounded-2xl">
                        {["default", "progress", "remaining"].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setSortBy(option)}
                            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                              sortBy === option
                                ? "bg-neutral-900 text-white"
                                : "text-neutral-700 hover:bg-neutral-200"
                            }`}
                            aria-pressed={sortBy === option}
                          >
                            {option === "default" ? "Default" : option === "progress" ? "Progress" : "Remaining"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Suspense fallback={null}>
                <Alert
                  type="info"
                  message="We update our question bank daily. Found an issue? Report it — we'll fix it within 48 hrs!"
                  linkText="Learn More"
                  linkHref="https://10tracker.com/about-us"
                  dismissible
                />
              </Suspense>

              {/* ── Grid ─────────────────────────────────────────────────────── */}
              <div id="practice-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {isGateExam
                  ? filteredAndSortedTopics.map((topic) => {
                      const tp           = userProgress[topic.title] || { completedQuestions: [], correctAnswers: [], points: 0 };
                      const completedCnt = tp.completedQuestions?.length || 0;
                      const correctCnt   = tp.correctAnswers?.length    || 0;
                      const pct          = topic.count ? Math.round((completedCnt / topic.count) * 100) : 0;
                      const done         = completedCnt === topic.count && topic.count > 0;
                      const accuracy     = completedCnt > 0 ? Math.round((correctCnt / completedCnt) * 100) : 0;

                      return (
                        <TopicCard
                          key={topic.uniqueId}
                          title={topic.title.replace(/-/g, " ")}
                          subtitle={topic.parentSubject}
                          completedCount={completedCnt}
                          totalCount={topic.count}
                          progressPercentage={pct}
                          isCompleted={done}
                          accuracy={accuracy}
                          href={`/${category}/practice/${topic.title}`}
                          extra={
                            completedCnt > 0 && (
                              <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                                <Pill label="Points" value={tp.points} />
                                <Pill label="Correct" value={correctCnt} />
                              </div>
                            )
                          }
                        />
                      );
                    })
                  : filteredAndSortedChapters.map((chapter) => {
                      const chapterKey = chapter.slug || chapter.title;
                      const cp         = chapterProgressMap[chapterKey] || {
                        totalQuestions: chapter.count || 0,
                        completedQuestions: 0, correctAnswers: 0,
                        completedTopics: 0, totalTopics: 0,
                        progressPercentage: 0, accuracy: 0, isCompleted: false,
                      };
                      const chapterSlug = chapter.slug || chapter.title.toLowerCase().replace(/\s+/g, "-");

                      return (
                        <TopicCard
                          key={chapterKey}
                          title={chapter.title}
                          subtitle={chapter.subject || formattedSubject}
                          completedCount={cp.completedQuestions}
                          totalCount={cp.totalQuestions || chapter.count || 0}
                          progressPercentage={cp.progressPercentage}
                          isCompleted={cp.isCompleted}
                          accuracy={cp.accuracy}
                          detailsHref={`/${category}/${subject}/${chapterSlug}`}
                          href={`/${category}/${subject}/${chapterSlug}/practice`}
                          extra={
                            cp.completedQuestions > 0 && (
                              <div className="flex items-center justify-between text-xs text-neutral-500">
                                <span>Correct: {cp.correctAnswers}</span>
                                <span>Topics: {cp.completedTopics}/{cp.totalTopics}</span>
                              </div>
                            )
                          }
                        />
                      );
                    })}
              </div>

              {/* Empty state */}
              {((isGateExam && filteredAndSortedTopics.length === 0) ||
                (!isGateExam && filteredAndSortedChapters.length === 0)) && (
                <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center border border-neutral-200 mt-4">
                  <svg className="h-10 w-10 text-neutral-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">
                    {isGateExam ? "No topics found" : "No chapters found"}
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {searchTerm
                      ? `No ${isGateExam ? "topics" : "chapters"} match "${searchTerm}"`
                      : activeSubject
                        ? `No ${isGateExam ? "topics" : "chapters"} found for "${activeSubject}"`
                        : `No ${isGateExam ? "topics" : "chapters"} available`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile FAB */}
        <div className="md:hidden fixed bottom-6 right-6 z-30">
          <button
            onClick={() => setShowMobileOptions(true)}
            className="h-14 w-14 rounded-full bg-white text-neutral-800 border border-neutral-300 shadow-md flex items-center justify-center hover:bg-neutral-50"
            aria-label="Show options"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        <Toaster position="bottom-right" />
      </div>
    </ErrorBoundary>
  );
};

// =============================================================================
// Sub-components (extracted to avoid re-renders of the whole list)
// =============================================================================

const statusBadge = (isCompleted, completedCount) => {
  if (isCompleted)      return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">Completed</span>;
  if (completedCount > 0) return <span className="bg-neutral-100 text-neutral-800 text-xs px-2.5 py-0.5 rounded-full">In progress</span>;
  return <span className="bg-neutral-50 text-neutral-600 border border-neutral-200 text-xs px-2.5 py-0.5 rounded-full">New</span>;
};

const TopicCard = React.memo(({
  title, subtitle,
  completedCount, totalCount,
  progressPercentage, isCompleted, accuracy,
  href, detailsHref,
  extra,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.2 }}
    className={`group bg-white rounded-2xl shadow-sm border ${
      isCompleted ? "border-green-200" : completedCount > 0 ? "border-neutral-300" : "border-neutral-200"
    } hover:shadow-lg hover:border-neutral-300 transition-all duration-200`}
  >
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 line-clamp-2 leading-snug">
            {title}
          </h3>
          <div className="text-xs sm:text-sm text-neutral-500 mt-0.5 truncate">{subtitle}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {statusBadge(isCompleted, completedCount)}
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-center min-w-[64px]">
            <p className="text-sm font-semibold text-neutral-900 tabular-nums">{progressPercentage}%</p>
            <p className="text-[10px] text-neutral-500">done</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-neutral-700">
          <span>{completedCount} of {totalCount} questions</span>
          <span className="tabular-nums text-neutral-600">Accuracy {accuracy}%</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isCompleted ? "bg-green-500" : completedCount > 0 ? "bg-neutral-800" : "bg-neutral-300"
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {extra}
        <div className={`grid gap-2 pt-1 ${detailsHref ? "grid-cols-2" : "grid-cols-1"}`}>
          {detailsHref && (
            <Link
              href={detailsHref}
              className="block text-center py-2 rounded-xl border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition-colors duration-150 font-semibold text-sm"
            >
              Details
            </Link>
          )}
          <Link
            href={href}
            className={`block text-center py-2 rounded-xl border text-sm ${
              isCompleted
                ? "border-green-300 text-green-800 hover:bg-green-50"
                : "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800"
            } transition-colors duration-150 font-medium`}
          >
            {completedCount > 0 ? "Resume" : "Start"} practice
          </Link>
        </div>
      </div>
    </div>
  </motion.div>
));
TopicCard.displayName = "TopicCard";

const Pill = React.memo(({ label, value }) => (
  <span className="inline-flex items-center rounded-full bg-neutral-50 border border-neutral-200 px-2.5 py-1">
    {label} <span className="ml-1 font-semibold text-neutral-900 tabular-nums">{value}</span>
  </span>
));
Pill.displayName = "Pill";

export default React.memo(Examtracker);