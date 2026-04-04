// "use client";

// import React, {
//   useState,
//   useEffect,
//   useLayoutEffect,
//   useCallback,
//   useMemo,
//   memo,
//   useRef,
// } from "react";
// import { MathJax, MathJaxContext } from "better-react-mathjax";
// import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
// import { createClient } from "@supabase/supabase-js";
// import dynamic from "next/dynamic";
// import Link from "next/link";
// import { useAuth } from "@/app/context/AuthContext";
// import { upsertUserProgress } from "@/lib/userProgressUpsert";
// import toast, { Toaster } from "react-hot-toast";
// import { Clock, ArrowLeft } from "lucide-react";

// const QuestionCard = dynamic(() => import("@/components/QuestionCard"), {
//   ssr: false,
//   loading: () => <QuestionSkeleton />,
// });
// const Navbar      = dynamic(() => import("@/components/Navbar"),   { ssr: false });
// const MetaDataJobs = dynamic(() => import("@/components/Seo"),     { ssr: false });

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

// const ADMIN_EMAIL          = "jain10gunjan@gmail.com";
// const QUESTIONS_PER_PAGE   = 10;
// const DIFFICULTIES         = ["easy", "medium", "hard"];
// const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

// // ─── helpers ────────────────────────────────────────────────────────────────

// const parseDifficultyParam = (sp) => {
//   if (!sp) return null;
//   const d = String(sp.get("difficulty") ?? "").toLowerCase();
//   return DIFFICULTIES.includes(d) ? d : null;
// };

// const normalizeChapterName = (name) =>
//   name ? name.toLowerCase().trim().replace(/\s+/g, " ").replace(/-/g, " ") : "";

// const chapterNamesMatch = (a, b) =>
//   normalizeChapterName(a) === normalizeChapterName(b);

// const progressQuestionId = (id) => (id == null ? "" : String(id));

// const getChapterCandidates = (chapter) => {
//   const ch = chapter ?? "";
//   return Array.from(
//     new Set(
//       [
//         ch,
//         ch.trim(),
//         ch.replace(/-/g, " "),
//         normalizeChapterName(ch),
//         normalizeChapterName(ch).replace(/\s+/g, "-"),
//       ].filter(Boolean)
//     )
//   );
// };

// // ─── sub-components ─────────────────────────────────────────────────────────

// const QuestionSkeleton = memo(() => (
//   <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
//     <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
//     <div className="space-y-2">
//       {[1, 2, 3, 4].map((i) => (
//         <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
//       ))}
//     </div>
//   </div>
// ));
// QuestionSkeleton.displayName = "QuestionSkeleton";

// const DifficultyButton = memo(({ difficulty, count, active, onClick, loading }) => (
//   <button
//     onClick={onClick}
//     disabled={loading}
//     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
//       active
//         ? "bg-neutral-900 text-white"
//         : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
//     }`}
//   >
//     <span className="capitalize">{difficulty}</span>
//     <span
//       className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
//         active ? "bg-white/20" : "bg-neutral-100"
//       }`}
//     >
//       {count ?? 0}
//     </span>
//   </button>
// ));
// DifficultyButton.displayName = "DifficultyButton";

// // ─── main component ──────────────────────────────────────────────────────────

// const ChapterPracticePage = memo(() => {
//   const mathJaxConfig = useMemo(
//     () => ({
//       "fast-preview": { disabled: false },
//       tex: {
//         inlineMath:   [["$", "$"], ["\\(", "\\)"]],
//         displayMath:  [["$$", "$$"], ["\\[", "\\]"]],
//         processEscapes: true,
//       },
//       messageStyle: "none",
//       showMathMenu: false,
//     }),
//     []
//   );

//   const { category, subject, chaptername } = useParams();
//   const router       = useRouter();
//   const searchParams = useSearchParams();
//   const pathname     = usePathname();
//   const { user, setShowAuthModal } = useAuth();

//   const userRef              = useRef(user);
//   const categoryRef          = useRef(category);
//   const normalizedChapterRef = useRef("");
//   const questionsRef         = useRef([]);
//   const pendingRef           = useRef(new Map());
//   const isSavingProgressRef  = useRef(false);
//   const saveProgressTimerRef = useRef(null);
//   const fetchAbortRef        = useRef(null);   // ← abort controller for fetchQuestions

//   useEffect(() => { userRef.current = user; }, [user]);
//   useEffect(() => { categoryRef.current = category; }, [category]);

//   const isAdmin = useMemo(
//     () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL,
//     [user]
//   );

//   const normalizedChapter = useMemo(
//     () => (chaptername ? chaptername.replace(/-/g, " ") : ""),
//     [chaptername]
//   );

//   useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

//   const activeDifficulty = useMemo(
//     () => parseDifficultyParam(searchParams) ?? "easy",
//     [searchParams]
//   );

//   // ── state ────────────────────────────────────────────────────────────────
//   const [questions,          setQuestions]          = useState([]);
//   const [counts,             setCounts]             = useState({ easy: 0, medium: 0, hard: 0 });
//   const [totalQuestions,     setTotalQuestions]     = useState(0);
//   const [isLoading,          setIsLoading]          = useState(true);
//   const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
//   const [progress,           setProgress]           = useState({ completed: [], correct: [], points: 0 });
//   const [currentPage,        setCurrentPage]        = useState(1);
//   const [hasMore,            setHasMore]            = useState(true);
//   const [rewritingId,        setRewritingId]        = useState(null);

//   useEffect(() => { questionsRef.current = questions; }, [questions]);

//   // ── fetch counts ─────────────────────────────────────────────────────────
//   const fetchCounts = useCallback(async () => {
//     if (!category || !normalizedChapter) return;
//     try {
//       const res = await fetch(
//         `/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}`
//       );
//       if (!res.ok) throw new Error("counts fetch failed");
//       const r = await res.json();
//       const c = { easy: r.easy ?? 0, medium: r.medium ?? 0, hard: r.hard ?? 0 };
//       setCounts(c);
//       setTotalQuestions(r.total ?? 0);
//     } catch (e) {
//       console.error("fetchCounts:", e);
//       setCounts({ easy: 0, medium: 0, hard: 0 });
//     }
//   }, [category, normalizedChapter]);

//   // ── fetch questions (with abort) ──────────────────────────────────────────
//   const fetchQuestions = useCallback(
//     async (difficulty, page = 1, append = false) => {
//       if (!normalizedChapter || !category) return;

//       // Cancel any in-flight fetch
//       if (fetchAbortRef.current) fetchAbortRef.current.abort();
//       const controller = new AbortController();
//       fetchAbortRef.current = controller;

//       setIsLoadingQuestions(true);
//       try {
//         const res = await fetch(
//           `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}&difficulty=${difficulty}&page=${page}&limit=${QUESTIONS_PER_PAGE}`,
//           { signal: controller.signal }
//         );
//         if (!res.ok) throw new Error("questions fetch failed");
//         const r  = await res.json();
//         const qs = r.questions ?? [];
//         setQuestions((prev) => (append ? [...prev, ...qs] : qs));
//         setHasMore(r.hasMore ?? false);
//       } catch (e) {
//         if (e.name === "AbortError") return; // silently ignore cancelled requests
//         console.error("fetchQuestions:", e);
//         toast.error("Failed to load questions");
//         setQuestions([]);
//         setHasMore(false);
//       } finally {
//         setIsLoadingQuestions(false);
//       }
//     },
//     [category, normalizedChapter]
//   );

//   // ── fetch user progress ───────────────────────────────────────────────────
//   const fetchUserProgress = useCallback(async () => {
//     const userId         = userRef.current?.id;
//     const currentCategory = categoryRef.current;
//     const currentChapter  = normalizedChapterRef.current;

//     if (!userId || !currentChapter || !currentCategory) {
//       setProgress({ completed: [], correct: [], points: 0 });
//       return;
//     }

//     try {
//       const candidates     = getChapterCandidates(currentChapter);
//       const categoryUpper  = currentCategory.toUpperCase();
//       const normChapter    = normalizeChapterName(currentChapter);

//       // Single query — all chapter variants at once
//       const { data: rows, error: rowErr } = await supabase
//         .from("examtracker")
//         .select("topic, chapter")
//         .eq("category", categoryUpper)
//         .in("chapter", candidates);

//       if (rowErr) throw rowErr;

//       const topicSet = new Set();
//       for (const r of rows ?? []) {
//         if (r?.topic && chapterNamesMatch(r.chapter, normChapter)) {
//           topicSet.add(String(r.topic).trim());
//         }
//       }
//       // Also pick up topics from already-loaded questions
//       for (const q of questionsRef.current ?? []) {
//         if (q?.topic) topicSet.add(String(q.topic).trim());
//       }

//       const uniqueTopics = [...topicSet];
//       if (!uniqueTopics.length) {
//         setProgress({ completed: [], correct: [], points: 0 });
//         return;
//       }

//       const area = currentCategory.toLowerCase();
//       const { data: progressData, error: progressError } = await supabase
//         .from("user_progress")
//         .select("completedquestions, correctanswers, points, topic")
//         .eq("user_id", userId)
//         .eq("area", area)
//         .in("topic", uniqueTopics);

//       if (progressError && progressError.code !== "PGRST116") throw progressError;

//       const completed    = new Set();
//       const correct      = new Set();
//       let   totalPoints  = 0;

//       for (const item of progressData ?? []) {
//         (Array.isArray(item.completedquestions) ? item.completedquestions : []).forEach(
//           (id) => { const sid = progressQuestionId(id); if (sid) completed.add(sid); }
//         );
//         (Array.isArray(item.correctanswers) ? item.correctanswers : []).forEach(
//           (id) => { const sid = progressQuestionId(id); if (sid) correct.add(sid); }
//         );
//         totalPoints += typeof item.points === "number" ? item.points : 0;
//       }

//       setProgress({
//         completed: Array.from(completed),
//         correct:   Array.from(correct),
//         points:    totalPoints,
//       });
//     } catch (e) {
//       console.error("fetchUserProgress:", e);
//       setProgress({ completed: [], correct: [], points: 0 });
//     }
//   }, []);

//   // ── save progress ─────────────────────────────────────────────────────────
//   const mergePendingIntoRef = useCallback((snapshot) => {
//     snapshot.forEach((value, questionId) => {
//       if (!pendingRef.current.has(questionId)) pendingRef.current.set(questionId, value);
//     });
//   }, []);

//   const saveProgress = useCallback(
//     async (options = {}) => {
//       const silent      = options?.silent === true;
//       const currentUser = userRef.current;
//       const userId      = currentUser?.id;
//       const currentCategory = categoryRef.current;

//       if (!userId || !pendingRef.current.size) return;
//       if (isSavingProgressRef.current) return;

//       const snapshot = new Map(pendingRef.current);
//       pendingRef.current.clear();
//       isSavingProgressRef.current = true;

//       const area      = currentCategory?.toLowerCase() ?? "";
//       const userEmail = currentUser?.primaryEmailAddress?.emailAddress ?? null;
//       let   saveOk    = false;

//       const restoreSnapshot = () => mergePendingIntoRef(snapshot);

//       try {
//         if (!area) { restoreSnapshot(); return; }

//         const entries   = Array.from(snapshot.entries());
//         const orphanIds = entries
//           .filter(([, u]) => !String(u?.topic ?? "").trim())
//           .map(([id]) => id);

//         const idToTopic = new Map();
//         if (orphanIds.length) {
//           const { data: topicRows, error: topicErr } = await supabase
//             .from("examtracker")
//             .select("_id, topic")
//             .eq("category", currentCategory.toUpperCase())
//             .in("_id", orphanIds);
//           if (topicErr) throw topicErr;
//           for (const r of topicRows ?? []) {
//             if (r?._id != null && r?.topic)
//               idToTopic.set(progressQuestionId(r._id), String(r.topic).trim());
//           }
//         }

//         for (const [qid, u] of entries) {
//           const t = String(u?.topic ?? "").trim() || idToTopic.get(qid);
//           if (!t) pendingRef.current.set(qid, u);
//         }

//         const completedByTopic  = new Map();
//         const touchedIdsByTopic = new Map();

//         for (const [qid, u] of entries) {
//           const topic = String(u?.topic ?? "").trim() || idToTopic.get(qid);
//           if (!topic) continue;
//           if (!completedByTopic.has(topic)) {
//             completedByTopic.set(topic, new Set());
//             touchedIdsByTopic.set(topic, new Set());
//           }
//           (u.completed ?? []).forEach((id) =>
//             completedByTopic.get(topic).add(progressQuestionId(id))
//           );
//           touchedIdsByTopic.get(topic).add(qid);
//         }

//         const topicsToSave = [...completedByTopic.keys()];
//         if (!topicsToSave.length) {
//           if (entries.some(([qid, u]) => !String(u?.topic ?? "").trim() && !idToTopic.get(qid)))
//             toast.error("Some questions are missing topic data; reload the page.");
//           return;
//         }

//         const { data: existing, error: fetchErr } = await supabase
//           .from("user_progress")
//           .select("topic, completedquestions, correctanswers, points")
//           .eq("user_id", userId)
//           .eq("area", area)
//           .in("topic", topicsToSave);
//         if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;

//         const existingMap = new Map((existing ?? []).map((r) => [r.topic, r]));

//         const upsertRows = topicsToSave.map((topic) => {
//           const prev         = existingMap.get(topic);
//           const prevCompleted = (
//             Array.isArray(prev?.completedquestions) ? prev.completedquestions : []
//           ).map(progressQuestionId);
//           const prevCorrect  = (
//             Array.isArray(prev?.correctanswers) ? prev.correctanswers : []
//           ).map(progressQuestionId);
//           const prevPoints       = typeof prev?.points === "number" ? prev.points : 0;
//           const prevCompletedSet = new Set(prevCompleted);

//           const deltaCompleted  = [...(completedByTopic.get(topic) ?? [])].map(progressQuestionId);
//           const mergedCompleted = [...new Set([...prevCompleted, ...deltaCompleted])];

//           let mergedCorrect = [...prevCorrect];
//           for (const qid of touchedIdsByTopic.get(topic) ?? []) {
//             const u = snapshot.get(qid);
//             if (!u) continue;
//             if ((u.correct ?? []).map(progressQuestionId).includes(qid)) {
//               if (!mergedCorrect.includes(qid)) mergedCorrect.push(qid);
//             } else {
//               mergedCorrect = mergedCorrect.filter((id) => id !== qid);
//             }
//           }

//           const newlyCompleted = deltaCompleted.filter((id) => !prevCompletedSet.has(id));
//           const pointsToAdd    = newlyCompleted.reduce((sum, id) => {
//             const u = snapshot.get(id);
//             return sum + (typeof u?.points === "number" ? u.points : 0);
//           }, 0);

//           return {
//             user_id:            userId,
//             email:              userEmail,
//             topic,
//             area,
//             completedquestions: mergedCompleted,
//             correctanswers:     mergedCorrect,
//             points:             prevPoints + pointsToAdd,
//           };
//         });

//         const { error: upsertErr } = await upsertUserProgress(supabase, upsertRows);
//         if (upsertErr) throw upsertErr;

//         await fetchUserProgress();
//         saveOk = true;
//         if (!silent) toast.success("Progress saved!", { duration: 2000 });
//       } catch (e) {
//         console.error("saveProgress:", e);
//         toast.error("Failed to save progress. Retrying...");
//         restoreSnapshot();
//       } finally {
//         isSavingProgressRef.current = false;
//         if (saveOk && pendingRef.current.size > 0) {
//           queueMicrotask(() => saveProgress({ silent: true }));
//         }
//       }
//     },
//     [fetchUserProgress, mergePendingIntoRef]
//   );

//   // ── answer handler ────────────────────────────────────────────────────────
//   const handleAnswer = useCallback(
//     (questionId, isCorrect, questionTopic) => {
//       if (!userRef.current) { setShowAuthModal(true); return; }

//       const qid   = progressQuestionId(questionId);
//       if (!qid) return;
//       const topic = questionTopic != null && String(questionTopic).trim() !== ""
//         ? String(questionTopic).trim()
//         : null;

//       setProgress((prev) => {
//         const completedSet    = new Set(prev.completed.map(progressQuestionId));
//         const correctSet      = new Set(prev.correct.map(progressQuestionId));
//         const alreadyCompleted = completedSet.has(qid);
//         const wasCorrect       = correctSet.has(qid);
//         const pointsDelta      = alreadyCompleted ? 0 : isCorrect ? 100 : 0;
//         if (!alreadyCompleted) completedSet.add(qid);
//         if (isCorrect) correctSet.add(qid); else correctSet.delete(qid);
//         return {
//           completed: Array.from(completedSet),
//           correct:   Array.from(correctSet),
//           points:    prev.points + pointsDelta - (wasCorrect && !isCorrect ? 100 : 0),
//         };
//       });

//       pendingRef.current.set(qid, {
//         completed: [qid],
//         correct:   isCorrect ? [qid] : [],
//         points:    isCorrect ? 100 : 0,
//         topic,
//       });

//       if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
//       saveProgressTimerRef.current = setTimeout(() => saveProgress(), 1500); // increased to 1.5s
//     },
//     [setShowAuthModal, saveProgress]
//   );

//   // ── difficulty / routing ──────────────────────────────────────────────────
//   useLayoutEffect(() => {
//     if (typeof window === "undefined" || !category || !normalizedChapter) return;
//     if (parseDifficultyParam(searchParams)) return;
//     try {
//       const saved = sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
//       if (saved && DIFFICULTIES.includes(saved) && saved !== "easy") {
//         const params = new URLSearchParams(searchParams.toString());
//         params.set("difficulty", saved);
//         router.replace(`${pathname}?${params.toString()}`, { scroll: false });
//       }
//     } catch (_) {}
//   }, [category, normalizedChapter, pathname, router, searchParams]);

//   useEffect(() => {
//     try { sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty); } catch (_) {}
//   }, [activeDifficulty]);

//   const handleDifficultyChange = useCallback(
//     (difficulty) => {
//       if (difficulty === activeDifficulty || isLoadingQuestions) return;
//       setCurrentPage(1);
//       setHasMore(true);
//       const params = new URLSearchParams(searchParams.toString());
//       params.set("difficulty", difficulty);
//       router.replace(`${pathname}?${params.toString()}`, { scroll: false });
//     },
//     [activeDifficulty, isLoadingQuestions, router, searchParams, pathname]
//   );

//   // ── load more ────────────────────────────────────────────────────────────
//   const loadMore = useCallback(() => {
//     if (!hasMore || isLoadingQuestions) return;
//     const next = currentPage + 1;
//     setCurrentPage(next);
//     fetchQuestions(activeDifficulty, next, true);
//   }, [hasMore, isLoadingQuestions, currentPage, activeDifficulty, fetchQuestions]);

//   // ── admin: rewrite question ───────────────────────────────────────────────
//   const extractRewrittenStem = useCallback((content) => {
//     if (!content) return null;
//     let text = String(content).trim();
//     text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
//     text = text.replace(/^["'\s]*Question\s*:\s*/i, "").trim();
//     const stop = /(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(text);
//     if (stop?.index > 0) text = text.slice(0, stop.index).trim();
//     text = (text.split(/\n\s*\n/)[0] ?? text).trim();
//     return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;
//   }, []);

//   const rewriteQuestionInDb = useCallback(
//     async (question) => {
//       if (!isAdmin || !question?._id || rewritingId) return;
//       setRewritingId(question._id);
//       const tid = toast.loading("Rewriting question...");
//       try {
//         const stem = String(question.question ?? "").replace(/<\/?[^>]+(>|$)/g, " ").trim();
//         if (!stem) throw new Error("empty stem");
//         const resp = await fetch("/api/generate-similar", {
//           method:  "POST",
//           headers: { "Content-Type": "application/json" },
//           body:    JSON.stringify({ mode: "rewrite-question", question: stem, maxTokens: 160 }),
//         });
//         if (!resp.ok) throw new Error(await resp.text());
//         const rewritten = extractRewrittenStem((await resp.json())?.content);
//         if (!rewritten) throw new Error("no rewritten text");
//         const { error } = await supabase
//           .from("examtracker")
//           .update({ question: rewritten })
//           .eq("_id", question._id);
//         if (error) throw error;
//         setQuestions((prev) =>
//           prev.map((q) => (q?._id === question._id ? { ...q, question: rewritten } : q))
//         );
//         toast.success("Question rewritten & updated.", { id: tid });
//       } catch (e) {
//         console.error("rewrite:", e);
//         toast.error("Failed to rewrite question.", { id: tid });
//       } finally {
//         setRewritingId(null);
//       }
//     },
//     [extractRewrittenStem, isAdmin, rewritingId]
//   );

//   // ── effects: data loading ─────────────────────────────────────────────────
//   useEffect(() => {
//     if (!category || !normalizedChapter) return;
//     let cancelled = false;
//     const load = async () => {
//       setIsLoading(true);
//       setCurrentPage(1);
//       setHasMore(true);
//       try {
//         await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty, 1, false)]);
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     };
//     load();
//     return () => { cancelled = true; };
//   }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

//   useEffect(() => { fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);

//   useEffect(() => {
//     if (!user?.id || !questions.length) return;
//     fetchUserProgress();
//   }, [user, questions, fetchUserProgress]);

//   // Flush pending on unmount / page unload
//   useEffect(() => {
//     const flush = () => {
//       if (pendingRef.current.size > 0 && userRef.current) saveProgress();
//     };
//     window.addEventListener("beforeunload", flush);
//     return () => {
//       window.removeEventListener("beforeunload", flush);
//       if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
//       flush();
//     };
//   }, [saveProgress]);

//   // ── derived stats ─────────────────────────────────────────────────────────
//   const progressCompletedSet = useMemo(
//     () => new Set((progress.completed ?? []).map(progressQuestionId)),
//     [progress.completed]
//   );
//   const progressCorrectSet = useMemo(
//     () => new Set((progress.correct ?? []).map(progressQuestionId)),
//     [progress.correct]
//   );

//   const stats = useMemo(() => {
//     const completed = questions.filter((q) =>
//       progressCompletedSet.has(progressQuestionId(q._id))
//     ).length;
//     const correct = questions.filter((q) =>
//       progressCorrectSet.has(progressQuestionId(q._id))
//     ).length;
//     const total    = counts[activeDifficulty] ?? 0;
//     const totalAll = totalQuestions || counts.easy + counts.medium + counts.hard;
//     return {
//       completed,
//       correct,
//       total,
//       totalAll,
//       completionPercentage: total ? Math.round((completed / total) * 100) : 0,
//       accuracy:             completed ? Math.round((correct / completed) * 100) : 0,
//       points:               progress.points,
//     };
//   }, [questions, progress, counts, activeDifficulty, totalQuestions]);

//   const chapterName = useMemo(
//     () => normalizedChapter?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? "",
//     [normalizedChapter]
//   );

//   // ── render ────────────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-neutral-50">
//         <MetaDataJobs
//           seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
//           seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
//         />
//         <Navbar />
//         <div className="flex justify-center items-center min-h-[60vh] pt-16 px-4">
//           <div className="bg-white p-8 rounded-lg border border-neutral-200 flex items-center space-x-4">
//             <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
//             <div>
//               <h3 className="text-lg font-medium text-neutral-900">Loading questions</h3>
//               <p className="text-sm text-neutral-600">Please wait...</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <Navbar />
//       <div className="min-h-screen bg-neutral-50">
//         <MetaDataJobs
//           seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
//           seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
//         />
//         <div className="bg-neutral-50 pt-4 overflow-x-hidden">
//           <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">

//             {/* Breadcrumb */}
//             <div className="mb-4">
//               <Link
//                 href={`/${category}/${subject}/${chaptername}`}
//                 className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
//               >
//                 <ArrowLeft className="w-4 h-4" />
//                 <span>Back to Chapter Topics</span>
//               </Link>
//             </div>

//             {/* Header */}
//             <div className="mb-4 sm:mb-8 mt-8">
//               <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">
//                 {chapterName} - Chapter Practice
//               </h1>
//               <p className="text-xs sm:text-sm text-neutral-600 mb-4">
//                 {stats.total} {activeDifficulty} questions • {stats.totalAll} total questions
//               </p>

//               {/* Stats */}
//               <div className="bg-white rounded-lg border border-neutral-200 p-3 mb-4">
//                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
//                   {[
//                     ["Completion", `${stats.completionPercentage}%`],
//                     ["Correct",    stats.correct],
//                     ["Accuracy",   `${stats.accuracy}%`],
//                     ["Points",     stats.points],
//                   ].map(([label, value]) => (
//                     <div key={label}>
//                       <p className="text-xs text-neutral-600 mb-1">{label}</p>
//                       <p className="text-lg font-semibold text-neutral-900">{value}</p>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Controls */}
//             <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-4">
//               <div className="mb-4">
//                 <div className="flex justify-between text-xs sm:text-sm mb-2">
//                   <span className="text-neutral-700">Progress</span>
//                   <span className="text-neutral-600">
//                     {stats.completed}/{stats.total} questions
//                   </span>
//                 </div>
//                 <div className="w-full bg-neutral-200 rounded-full h-2">
//                   <div
//                     className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
//                     style={{ width: `${stats.completionPercentage}%` }}
//                   />
//                 </div>
//               </div>

//               <div className="flex flex-wrap gap-2 mb-3">
//                 {DIFFICULTIES.map((d) => (
//                   <DifficultyButton
//                     key={d}
//                     difficulty={d}
//                     count={counts[d]}
//                     active={activeDifficulty === d}
//                     loading={isLoadingQuestions}
//                     onClick={() => handleDifficultyChange(d)}
//                   />
//                 ))}
//               </div>

//               {!user && (
//                 <div className="bg-neutral-50 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
//                   <div>
//                     <p className="text-xs sm:text-sm font-medium text-neutral-900">
//                       Sign in to track progress
//                     </p>
//                     <p className="text-xs text-neutral-600">
//                       Save your answers and track your improvement
//                     </p>
//                   </div>
//                   <button
//                     onClick={() => setShowAuthModal(true)}
//                     className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-800 whitespace-nowrap"
//                   >
//                     Sign In
//                   </button>
//                 </div>
//               )}
//             </div>

//             {/* Question list */}
//             <div className="space-y-4 w-full overflow-x-hidden">
//               <MathJaxContext config={mathJaxConfig}>
//                 <MathJax>
//                   {isLoadingQuestions && questions.length === 0 ? (
//                     <div className="space-y-4">
//                       {[1, 2, 3].map((i) => <QuestionSkeleton key={i} />)}
//                     </div>
//                   ) : questions.length > 0 ? (
//                     <>
//                       {questions.map((question, index) => (
//                         <div key={question._id} className="space-y-2">
//                           {isAdmin && (
//                             <div className="flex justify-end">
//                               <button
//                                 onClick={() => rewriteQuestionInDb(question)}
//                                 disabled={rewritingId === question._id}
//                                 className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
//                               >
//                                 {rewritingId === question._id ? "Rewriting..." : "Rewrite (AI)"}
//                               </button>
//                             </div>
//                           )}
//                           <QuestionCard
//                             category={category}
//                             question={question}
//                             index={index}
//                             onAnswer={(isCorrect) =>
//                               handleAnswer(question._id, isCorrect, question.topic)
//                             }
//                             isCompleted={progressCompletedSet.has(progressQuestionId(question._id))}
//                             isCorrect={progressCorrectSet.has(progressQuestionId(question._id))}
//                             isAdmin={isAdmin}
//                           />
//                         </div>
//                       ))}

//                       {hasMore && (
//                         <div className="text-center py-4">
//                           <button
//                             onClick={loadMore}
//                             disabled={isLoadingQuestions}
//                             className="px-6 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
//                           >
//                             {isLoadingQuestions ? "Loading..." : "Load More Questions"}
//                           </button>
//                         </div>
//                       )}
//                     </>
//                   ) : (
//                     <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
//                       <Clock size={36} className="mx-auto text-neutral-400 mb-3" />
//                       <h3 className="text-lg font-semibold text-neutral-900 mb-2">
//                         No questions available
//                       </h3>
//                       <p className="text-sm text-neutral-600">
//                         No questions found for {activeDifficulty} difficulty.
//                       </p>
//                     </div>
//                   )}
//                 </MathJax>
//               </MathJaxContext>
//             </div>

//           </div>
//         </div>
//         <Toaster position="bottom-right" />
//       </div>
//     </>
//   );
// });

// ChapterPracticePage.displayName = "ChapterPracticePage";
// export default ChapterPracticePage;

// "use client";

// import React, {
//   useState,
//   useEffect,
//   useLayoutEffect,
//   useCallback,
//   useMemo,
//   memo,
//   useRef,
// } from "react";
// import { MathJax, MathJaxContext } from "better-react-mathjax";
// import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
// import { createClient } from "@supabase/supabase-js";
// import dynamic from "next/dynamic";
// import Link from "next/link";
// import { useAuth } from "@/app/context/AuthContext";
// import { upsertUserProgress } from "@/lib/userProgressUpsert";
// import toast, { Toaster } from "react-hot-toast";
// import { ArrowLeft, ArrowRight, ChevronLeft, CheckCircle2, XCircle, BookOpen, BarChart2, Zap, RotateCcw } from "lucide-react";

// const QuestionCard = dynamic(() => import("@/components/QuestionCard"), {
//   ssr: false,
//   loading: () => <QuestionSkeleton />,
// });
// const Navbar       = dynamic(() => import("@/components/Navbar"),  { ssr: false });
// const MetaDataJobs = dynamic(() => import("@/components/Seo"),     { ssr: false });

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

// const ADMIN_EMAIL          = "jain10gunjan@gmail.com";
// const QUESTIONS_PER_PAGE   = 10;
// const DIFFICULTIES         = ["easy", "medium", "hard"];
// const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

// // ─── helpers (unchanged) ─────────────────────────────────────────────────────

// const parseDifficultyParam = (sp) => {
//   if (!sp) return null;
//   const d = String(sp.get("difficulty") ?? "").toLowerCase();
//   return DIFFICULTIES.includes(d) ? d : null;
// };

// const normalizeChapterName = (name) =>
//   name ? name.toLowerCase().trim().replace(/\s+/g, " ").replace(/-/g, " ") : "";

// const chapterNamesMatch = (a, b) =>
//   normalizeChapterName(a) === normalizeChapterName(b);

// const progressQuestionId = (id) => (id == null ? "" : String(id));

// const getChapterCandidates = (chapter) => {
//   const ch = chapter ?? "";
//   return Array.from(
//     new Set(
//       [
//         ch,
//         ch.trim(),
//         ch.replace(/-/g, " "),
//         normalizeChapterName(ch),
//         normalizeChapterName(ch).replace(/\s+/g, "-"),
//       ].filter(Boolean)
//     )
//   );
// };

// // ─── difficulty colors ────────────────────────────────────────────────────────

// const DIFFICULTY_CONFIG = {
//   easy:   { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Easy" },
//   medium: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Medium" },
//   hard:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Hard" },
// };

// // ─── sub-components ───────────────────────────────────────────────────────────

// const QuestionSkeleton = memo(() => (
//   <div className="space-y-4 px-2">
//     <div className="h-5 bg-neutral-100 rounded-lg w-4/5 animate-pulse" />
//     <div className="h-5 bg-neutral-100 rounded-lg w-3/5 animate-pulse" />
//     <div className="mt-6 space-y-3">
//       {[1, 2, 3, 4].map((i) => (
//         <div key={i} className="h-14 bg-neutral-50 border border-neutral-100 rounded-xl animate-pulse" />
//       ))}
//     </div>
//   </div>
// ));
// QuestionSkeleton.displayName = "QuestionSkeleton";

// // Thin segmented progress bar showing per-question status
// const SegmentedProgress = memo(({ total, currentIndex, completed, correct, progressCompletedSet, progressCorrectSet, questions, progressQuestionId }) => {
//   if (!total) return null;
//   const MAX_SEGMENTS = 40;
//   const segments = Math.min(total, MAX_SEGMENTS);
//   const step = total / segments;

//   return (
//     <div className="flex gap-[2px] h-1.5 w-full">
//       {Array.from({ length: segments }, (_, i) => {
//         const qIdx = Math.floor(i * step);
//         const q = questions[qIdx];
//         const isCompleted = q && progressCompletedSet.has(progressQuestionId(q._id));
//         const isCorrect   = q && progressCorrectSet.has(progressQuestionId(q._id));
//         const isCurrent   = qIdx === currentIndex;
//         return (
//           <div
//             key={i}
//             className="flex-1 rounded-full transition-all duration-300"
//             style={{
//               backgroundColor: isCurrent
//                 ? "#0f172a"
//                 : isCompleted
//                 ? isCorrect ? "#16a34a" : "#ef4444"
//                 : "#e2e8f0",
//             }}
//           />
//         );
//       })}
//     </div>
//   );
// });
// SegmentedProgress.displayName = "SegmentedProgress";

// // ─── main component ───────────────────────────────────────────────────────────

// const ChapterPracticePage = memo(() => {
//   const mathJaxConfig = useMemo(
//     () => ({
//       "fast-preview": { disabled: false },
//       tex: {
//         inlineMath:  [["$", "$"], ["\\(", "\\)"]],
//         displayMath: [["$$", "$$"], ["\\[", "\\]"]],
//         processEscapes: true,
//       },
//       messageStyle: "none",
//       showMathMenu: false,
//     }),
//     []
//   );

//   const { category, subject, chaptername } = useParams();
//   const router       = useRouter();
//   const searchParams = useSearchParams();
//   const pathname     = usePathname();
//   const { user, setShowAuthModal } = useAuth();

//   const userRef              = useRef(user);
//   const categoryRef          = useRef(category);
//   const normalizedChapterRef = useRef("");
//   const questionsRef         = useRef([]);
//   const pendingRef           = useRef(new Map());
//   const isSavingProgressRef  = useRef(false);
//   const saveProgressTimerRef = useRef(null);
//   const fetchAbortRef        = useRef(null);

//   useEffect(() => { userRef.current = user; }, [user]);
//   useEffect(() => { categoryRef.current = category; }, [category]);

//   const isAdmin = useMemo(
//     () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL,
//     [user]
//   );

//   const normalizedChapter = useMemo(
//     () => (chaptername ? chaptername.replace(/-/g, " ") : ""),
//     [chaptername]
//   );

//   useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

//   const activeDifficulty = useMemo(
//     () => parseDifficultyParam(searchParams) ?? "easy",
//     [searchParams]
//   );

//   // ── state (all original state preserved) ─────────────────────────────────
//   const [questions,          setQuestions]          = useState([]);
//   const [counts,             setCounts]             = useState({ easy: 0, medium: 0, hard: 0 });
//   const [totalQuestions,     setTotalQuestions]     = useState(0);
//   const [isLoading,          setIsLoading]          = useState(true);
//   const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
//   const [progress,           setProgress]           = useState({ completed: [], correct: [], points: 0 });
//   const [currentPage,        setCurrentPage]        = useState(1);
//   const [hasMore,            setHasMore]            = useState(true);
//   const [rewritingId,        setRewritingId]        = useState(null);

//   // ── NEW UI state ──────────────────────────────────────────────────────────
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [showSummary,          setShowSummary]          = useState(false);
//   const [slideDirection,       setSlideDirection]       = useState("next"); // "next" | "prev"
//   const [isAnimating,          setIsAnimating]          = useState(false);
//   const [panelOpen,            setPanelOpen]            = useState(false); // mobile difficulty panel

//   useEffect(() => { questionsRef.current = questions; }, [questions]);

//   // Reset question index on difficulty/question set changes
//   useEffect(() => { setCurrentQuestionIndex(0); setShowSummary(false); }, [activeDifficulty]);

//   // Auto-advance to load more when near end
//   useEffect(() => {
//     if (!hasMore || isLoadingQuestions) return;
//     const threshold = 3;
//     if (questions.length > 0 && currentQuestionIndex >= questions.length - threshold) {
//       const next = currentPage + 1;
//       setCurrentPage(next);
//       fetchQuestions(activeDifficulty, next, true);
//     }
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentQuestionIndex, questions.length]);

//   // ── fetch counts (unchanged) ──────────────────────────────────────────────
//   const fetchCounts = useCallback(async () => {
//     if (!category || !normalizedChapter) return;
//     try {
//       const res = await fetch(
//         `/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}`
//       );
//       if (!res.ok) throw new Error("counts fetch failed");
//       const r = await res.json();
//       const c = { easy: r.easy ?? 0, medium: r.medium ?? 0, hard: r.hard ?? 0 };
//       setCounts(c);
//       setTotalQuestions(r.total ?? 0);
//     } catch (e) {
//       console.error("fetchCounts:", e);
//       setCounts({ easy: 0, medium: 0, hard: 0 });
//     }
//   }, [category, normalizedChapter]);

//   // ── fetch questions (unchanged logic) ────────────────────────────────────
//   const fetchQuestions = useCallback(
//     async (difficulty, page = 1, append = false) => {
//       if (!normalizedChapter || !category) return;
//       if (fetchAbortRef.current) fetchAbortRef.current.abort();
//       const controller = new AbortController();
//       fetchAbortRef.current = controller;
//       setIsLoadingQuestions(true);
//       try {
//         const res = await fetch(
//           `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}&difficulty=${difficulty}&page=${page}&limit=${QUESTIONS_PER_PAGE}`,
//           { signal: controller.signal }
//         );
//         if (!res.ok) throw new Error("questions fetch failed");
//         const r  = await res.json();
//         const qs = r.questions ?? [];
//         setQuestions((prev) => (append ? [...prev, ...qs] : qs));
//         setHasMore(r.hasMore ?? false);
//       } catch (e) {
//         if (e.name === "AbortError") return;
//         console.error("fetchQuestions:", e);
//         toast.error("Failed to load questions");
//         setQuestions([]);
//         setHasMore(false);
//       } finally {
//         setIsLoadingQuestions(false);
//       }
//     },
//     [category, normalizedChapter]
//   );

//   // ── fetch user progress (unchanged) ──────────────────────────────────────
//   const fetchUserProgress = useCallback(async () => {
//     const userId          = userRef.current?.id;
//     const currentCategory = categoryRef.current;
//     const currentChapter  = normalizedChapterRef.current;
//     if (!userId || !currentChapter || !currentCategory) {
//       setProgress({ completed: [], correct: [], points: 0 });
//       return;
//     }
//     try {
//       const candidates    = getChapterCandidates(currentChapter);
//       const categoryUpper = currentCategory.toUpperCase();
//       const normChapter   = normalizeChapterName(currentChapter);
//       const { data: rows, error: rowErr } = await supabase
//         .from("examtracker")
//         .select("topic, chapter")
//         .eq("category", categoryUpper)
//         .in("chapter", candidates);
//       if (rowErr) throw rowErr;
//       const topicSet = new Set();
//       for (const r of rows ?? []) {
//         if (r?.topic && chapterNamesMatch(r.chapter, normChapter))
//           topicSet.add(String(r.topic).trim());
//       }
//       for (const q of questionsRef.current ?? []) {
//         if (q?.topic) topicSet.add(String(q.topic).trim());
//       }
//       const uniqueTopics = [...topicSet];
//       if (!uniqueTopics.length) { setProgress({ completed: [], correct: [], points: 0 }); return; }
//       const area = currentCategory.toLowerCase();
//       const { data: progressData, error: progressError } = await supabase
//         .from("user_progress")
//         .select("completedquestions, correctanswers, points, topic")
//         .eq("user_id", userId)
//         .eq("area", area)
//         .in("topic", uniqueTopics);
//       if (progressError && progressError.code !== "PGRST116") throw progressError;
//       const completed   = new Set();
//       const correct     = new Set();
//       let   totalPoints = 0;
//       for (const item of progressData ?? []) {
//         (Array.isArray(item.completedquestions) ? item.completedquestions : []).forEach(
//           (id) => { const sid = progressQuestionId(id); if (sid) completed.add(sid); }
//         );
//         (Array.isArray(item.correctanswers) ? item.correctanswers : []).forEach(
//           (id) => { const sid = progressQuestionId(id); if (sid) correct.add(sid); }
//         );
//         totalPoints += typeof item.points === "number" ? item.points : 0;
//       }
//       setProgress({ completed: Array.from(completed), correct: Array.from(correct), points: totalPoints });
//     } catch (e) {
//       console.error("fetchUserProgress:", e);
//       setProgress({ completed: [], correct: [], points: 0 });
//     }
//   }, []);

//   // ── save progress (unchanged) ─────────────────────────────────────────────
//   const mergePendingIntoRef = useCallback((snapshot) => {
//     snapshot.forEach((value, questionId) => {
//       if (!pendingRef.current.has(questionId)) pendingRef.current.set(questionId, value);
//     });
//   }, []);

//   const saveProgress = useCallback(
//     async (options = {}) => {
//       const silent      = options?.silent === true;
//       const currentUser = userRef.current;
//       const userId      = currentUser?.id;
//       const currentCategory = categoryRef.current;
//       if (!userId || !pendingRef.current.size) return;
//       if (isSavingProgressRef.current) return;
//       const snapshot = new Map(pendingRef.current);
//       pendingRef.current.clear();
//       isSavingProgressRef.current = true;
//       const area      = currentCategory?.toLowerCase() ?? "";
//       const userEmail = currentUser?.primaryEmailAddress?.emailAddress ?? null;
//       let   saveOk    = false;
//       const restoreSnapshot = () => mergePendingIntoRef(snapshot);
//       try {
//         if (!area) { restoreSnapshot(); return; }
//         const entries   = Array.from(snapshot.entries());
//         const orphanIds = entries.filter(([, u]) => !String(u?.topic ?? "").trim()).map(([id]) => id);
//         const idToTopic = new Map();
//         if (orphanIds.length) {
//           const { data: topicRows, error: topicErr } = await supabase
//             .from("examtracker").select("_id, topic").eq("category", currentCategory.toUpperCase()).in("_id", orphanIds);
//           if (topicErr) throw topicErr;
//           for (const r of topicRows ?? []) {
//             if (r?._id != null && r?.topic) idToTopic.set(progressQuestionId(r._id), String(r.topic).trim());
//           }
//         }
//         for (const [qid, u] of entries) {
//           const t = String(u?.topic ?? "").trim() || idToTopic.get(qid);
//           if (!t) pendingRef.current.set(qid, u);
//         }
//         const completedByTopic  = new Map();
//         const touchedIdsByTopic = new Map();
//         for (const [qid, u] of entries) {
//           const topic = String(u?.topic ?? "").trim() || idToTopic.get(qid);
//           if (!topic) continue;
//           if (!completedByTopic.has(topic)) { completedByTopic.set(topic, new Set()); touchedIdsByTopic.set(topic, new Set()); }
//           (u.completed ?? []).forEach((id) => completedByTopic.get(topic).add(progressQuestionId(id)));
//           touchedIdsByTopic.get(topic).add(qid);
//         }
//         const topicsToSave = [...completedByTopic.keys()];
//         if (!topicsToSave.length) {
//           if (entries.some(([qid, u]) => !String(u?.topic ?? "").trim() && !idToTopic.get(qid)))
//             toast.error("Some questions are missing topic data; reload the page.");
//           return;
//         }
//         const { data: existing, error: fetchErr } = await supabase
//           .from("user_progress").select("topic, completedquestions, correctanswers, points")
//           .eq("user_id", userId).eq("area", area).in("topic", topicsToSave);
//         if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;
//         const existingMap = new Map((existing ?? []).map((r) => [r.topic, r]));
//         const upsertRows = topicsToSave.map((topic) => {
//           const prev          = existingMap.get(topic);
//           const prevCompleted = (Array.isArray(prev?.completedquestions) ? prev.completedquestions : []).map(progressQuestionId);
//           const prevCorrect   = (Array.isArray(prev?.correctanswers) ? prev.correctanswers : []).map(progressQuestionId);
//           const prevPoints    = typeof prev?.points === "number" ? prev.points : 0;
//           const prevCompletedSet = new Set(prevCompleted);
//           const deltaCompleted   = [...(completedByTopic.get(topic) ?? [])].map(progressQuestionId);
//           const mergedCompleted  = [...new Set([...prevCompleted, ...deltaCompleted])];
//           let mergedCorrect = [...prevCorrect];
//           for (const qid of touchedIdsByTopic.get(topic) ?? []) {
//             const u = snapshot.get(qid);
//             if (!u) continue;
//             if ((u.correct ?? []).map(progressQuestionId).includes(qid)) {
//               if (!mergedCorrect.includes(qid)) mergedCorrect.push(qid);
//             } else {
//               mergedCorrect = mergedCorrect.filter((id) => id !== qid);
//             }
//           }
//           const newlyCompleted = deltaCompleted.filter((id) => !prevCompletedSet.has(id));
//           const pointsToAdd    = newlyCompleted.reduce((sum, id) => {
//             const u = snapshot.get(id);
//             return sum + (typeof u?.points === "number" ? u.points : 0);
//           }, 0);
//           return {
//             user_id: userId, email: userEmail, topic, area,
//             completedquestions: mergedCompleted, correctanswers: mergedCorrect, points: prevPoints + pointsToAdd,
//           };
//         });
//         const { error: upsertErr } = await upsertUserProgress(supabase, upsertRows);
//         if (upsertErr) throw upsertErr;
//         await fetchUserProgress();
//         saveOk = true;
//         if (!silent) toast.success("Progress saved!", { duration: 2000 });
//       } catch (e) {
//         console.error("saveProgress:", e);
//         toast.error("Failed to save progress. Retrying...");
//         restoreSnapshot();
//       } finally {
//         isSavingProgressRef.current = false;
//         if (saveOk && pendingRef.current.size > 0) queueMicrotask(() => saveProgress({ silent: true }));
//       }
//     },
//     [fetchUserProgress, mergePendingIntoRef]
//   );

//   // ── answer handler (unchanged logic) ─────────────────────────────────────
//   const handleAnswer = useCallback(
//     (questionId, isCorrect, questionTopic) => {
//       if (!userRef.current) { setShowAuthModal(true); return; }
//       const qid   = progressQuestionId(questionId);
//       if (!qid) return;
//       const topic = questionTopic != null && String(questionTopic).trim() !== ""
//         ? String(questionTopic).trim()
//         : null;
//       setProgress((prev) => {
//         const completedSet     = new Set(prev.completed.map(progressQuestionId));
//         const correctSet       = new Set(prev.correct.map(progressQuestionId));
//         const alreadyCompleted = completedSet.has(qid);
//         const wasCorrect       = correctSet.has(qid);
//         const pointsDelta      = alreadyCompleted ? 0 : isCorrect ? 100 : 0;
//         if (!alreadyCompleted) completedSet.add(qid);
//         if (isCorrect) correctSet.add(qid); else correctSet.delete(qid);
//         return {
//           completed: Array.from(completedSet),
//           correct:   Array.from(correctSet),
//           points:    prev.points + pointsDelta - (wasCorrect && !isCorrect ? 100 : 0),
//         };
//       });
//       pendingRef.current.set(qid, {
//         completed: [qid], correct: isCorrect ? [qid] : [], points: isCorrect ? 100 : 0, topic,
//       });
//       if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
//       saveProgressTimerRef.current = setTimeout(() => saveProgress(), 1500);
//     },
//     [setShowAuthModal, saveProgress]
//   );

//   // ── difficulty / routing (unchanged) ─────────────────────────────────────
//   useLayoutEffect(() => {
//     if (typeof window === "undefined" || !category || !normalizedChapter) return;
//     if (parseDifficultyParam(searchParams)) return;
//     try {
//       const saved = sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
//       if (saved && DIFFICULTIES.includes(saved) && saved !== "easy") {
//         const params = new URLSearchParams(searchParams.toString());
//         params.set("difficulty", saved);
//         router.replace(`${pathname}?${params.toString()}`, { scroll: false });
//       }
//     } catch (_) {}
//   }, [category, normalizedChapter, pathname, router, searchParams]);

//   useEffect(() => {
//     try { sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty); } catch (_) {}
//   }, [activeDifficulty]);

//   const handleDifficultyChange = useCallback(
//     (difficulty) => {
//       if (difficulty === activeDifficulty || isLoadingQuestions) return;
//       setCurrentPage(1);
//       setHasMore(true);
//       const params = new URLSearchParams(searchParams.toString());
//       params.set("difficulty", difficulty);
//       router.replace(`${pathname}?${params.toString()}`, { scroll: false });
//     },
//     [activeDifficulty, isLoadingQuestions, router, searchParams, pathname]
//   );

//   // ── NEW: question navigation ──────────────────────────────────────────────
//   const navigateQuestion = useCallback((direction) => {
//     if (isAnimating) return;
//     const total = questions.length;
//     if (direction === "next") {
//       if (currentQuestionIndex >= total - 1) { setShowSummary(true); return; }
//       setSlideDirection("next");
//     } else {
//       if (currentQuestionIndex <= 0) return;
//       setSlideDirection("prev");
//     }
//     setIsAnimating(true);
//     setTimeout(() => {
//       setCurrentQuestionIndex((i) => direction === "next" ? i + 1 : i - 1);
//       setIsAnimating(false);
//     }, 180);
//   }, [isAnimating, questions.length, currentQuestionIndex]);

//   const handleKeyNav = useCallback((e) => {
//     if (e.key === "ArrowRight" || e.key === "ArrowDown") navigateQuestion("next");
//     if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   navigateQuestion("prev");
//   }, [navigateQuestion]);

//   useEffect(() => {
//     window.addEventListener("keydown", handleKeyNav);
//     return () => window.removeEventListener("keydown", handleKeyNav);
//   }, [handleKeyNav]);

//   // ── effects: data loading (unchanged) ────────────────────────────────────
//   useEffect(() => {
//     if (!category || !normalizedChapter) return;
//     let cancelled = false;
//     const load = async () => {
//       setIsLoading(true);
//       setCurrentPage(1);
//       setHasMore(true);
//       try {
//         await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty, 1, false)]);
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     };
//     load();
//     return () => { cancelled = true; };
//   }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

//   useEffect(() => { fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);
//   useEffect(() => {
//     if (!user?.id || !questions.length) return;
//     fetchUserProgress();
//   }, [user, questions, fetchUserProgress]);

//   useEffect(() => {
//     const flush = () => {
//       if (pendingRef.current.size > 0 && userRef.current) saveProgress();
//     };
//     window.addEventListener("beforeunload", flush);
//     return () => {
//       window.removeEventListener("beforeunload", flush);
//       if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
//       flush();
//     };
//   }, [saveProgress]);

//   // ── admin: rewrite (unchanged) ────────────────────────────────────────────
//   const extractRewrittenStem = useCallback((content) => {
//     if (!content) return null;
//     let text = String(content).trim();
//     text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
//     text = text.replace(/^["'\s]*Question\s*:\s*/i, "").trim();
//     const stop = /(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(text);
//     if (stop?.index > 0) text = text.slice(0, stop.index).trim();
//     text = (text.split(/\n\s*\n/)[0] ?? text).trim();
//     return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;
//   }, []);

//   const rewriteQuestionInDb = useCallback(
//     async (question) => {
//       if (!isAdmin || !question?._id || rewritingId) return;
//       setRewritingId(question._id);
//       const tid = toast.loading("Rewriting question...");
//       try {
//         const stem = String(question.question ?? "").replace(/<\/?[^>]+(>|$)/g, " ").trim();
//         if (!stem) throw new Error("empty stem");
//         const resp = await fetch("/api/generate-similar", {
//           method: "POST", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ mode: "rewrite-question", question: stem, maxTokens: 160 }),
//         });
//         if (!resp.ok) throw new Error(await resp.text());
//         const rewritten = extractRewrittenStem((await resp.json())?.content);
//         if (!rewritten) throw new Error("no rewritten text");
//         const { error } = await supabase.from("examtracker").update({ question: rewritten }).eq("_id", question._id);
//         if (error) throw error;
//         setQuestions((prev) => prev.map((q) => (q?._id === question._id ? { ...q, question: rewritten } : q)));
//         toast.success("Question rewritten & updated.", { id: tid });
//       } catch (e) {
//         console.error("rewrite:", e);
//         toast.error("Failed to rewrite question.", { id: tid });
//       } finally {
//         setRewritingId(null);
//       }
//     },
//     [extractRewrittenStem, isAdmin, rewritingId]
//   );

//   // ── derived stats ─────────────────────────────────────────────────────────
//   const progressCompletedSet = useMemo(
//     () => new Set((progress.completed ?? []).map(progressQuestionId)),
//     [progress.completed]
//   );
//   const progressCorrectSet = useMemo(
//     () => new Set((progress.correct ?? []).map(progressQuestionId)),
//     [progress.correct]
//   );

//   const stats = useMemo(() => {
//     const completed = questions.filter((q) => progressCompletedSet.has(progressQuestionId(q._id))).length;
//     const correct   = questions.filter((q) => progressCorrectSet.has(progressQuestionId(q._id))).length;
//     const total     = counts[activeDifficulty] ?? 0;
//     const totalAll  = totalQuestions || counts.easy + counts.medium + counts.hard;
//     return {
//       completed, correct, total, totalAll,
//       completionPercentage: total ? Math.round((completed / total) * 100) : 0,
//       accuracy:             completed ? Math.round((correct / completed) * 100) : 0,
//       points:               progress.points,
//     };
//   }, [questions, progress, counts, activeDifficulty, totalQuestions]);

//   const chapterName = useMemo(
//     () => normalizedChapter?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? "",
//     [normalizedChapter]
//   );

//   const currentQuestion = questions[currentQuestionIndex] ?? null;
//   const totalLoaded     = questions.length;
//   const diffCfg         = DIFFICULTY_CONFIG[activeDifficulty];

//   // ── loading state ─────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#f8f7f4]">
//         <MetaDataJobs
//           seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
//           seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
//         />
//         <Navbar />
//         <div className="flex justify-center items-center min-h-[80vh]">
//           <div className="text-center">
//             <div className="w-10 h-10 border-[3px] border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto mb-4" />
//             <p className="text-sm text-neutral-500 font-medium tracking-wide">Loading questions…</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ── summary screen ────────────────────────────────────────────────────────
//   if (showSummary) {
//     const pct = stats.completionPercentage;
//     const grade = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Fair" : "Keep Practicing";
//     return (
//       <>
//         <Navbar />
//         <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4 py-8">
//           <MetaDataJobs
//             seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
//             seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
//           />
//           <div className="w-full max-w-md">
//             <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
//               {/* Banner */}
//               <div className="bg-neutral-900 px-6 py-8 text-center">
//                 <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
//                   <BarChart2 className="w-8 h-8 text-white" />
//                 </div>
//                 <h2 className="text-2xl font-bold text-white mb-1">{grade}!</h2>
//                 <p className="text-neutral-400 text-sm">{chapterName} · {activeDifficulty}</p>
//               </div>

//               {/* Stats grid */}
//               <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100">
//                 {[
//                   ["Attempted",  stats.completed],
//                   ["Correct",    stats.correct],
//                   ["Accuracy",   `${stats.accuracy}%`],
//                   ["Points",     stats.points],
//                 ].map(([label, value]) => (
//                   <div key={label} className="p-5 text-center">
//                     <p className="text-2xl font-bold text-neutral-900">{value}</p>
//                     <p className="text-xs text-neutral-500 mt-1">{label}</p>
//                   </div>
//                 ))}
//               </div>

//               {/* Actions */}
//               <div className="p-4 flex flex-col gap-2">
//                 <button
//                   onClick={() => { setCurrentQuestionIndex(0); setShowSummary(false); }}
//                   className="w-full py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
//                 >
//                   <RotateCcw className="w-4 h-4" /> Review Answers
//                 </button>
//                 <Link
//                   href={`/${category}/${subject}/${chaptername}`}
//                   className="w-full py-3 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
//                 >
//                   <ArrowLeft className="w-4 h-4" /> Back to Chapter
//                 </Link>
//               </div>
//             </div>
//           </div>
//         </div>
//         <Toaster position="bottom-right" />
//       </>
//     );
//   }

//   // ── main practice UI ──────────────────────────────────────────────────────
//   return (
//     <>
//       <Navbar />
//       <MetaDataJobs
//         seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
//         seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
//       />

//       {/* ── Page shell ── */}
//       <div className="min-h-screen bg-[#f8f7f4] flex flex-col" style={{ paddingTop: "64px" }}>

//         {/* ── Top bar ── */}
//         <div className="bg-white border-b border-neutral-100 sticky top-[64px] z-20">
//           <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex items-center justify-between h-12">

//               {/* Back + breadcrumb */}
//               <div className="flex items-center gap-3 min-w-0">
//                 <Link
//                   href={`/${category}/${subject}/${chaptername}`}
//                   className="flex-shrink-0 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-800"
//                 >
//                   <ChevronLeft className="w-4 h-4" />
//                 </Link>
//                 <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 min-w-0">
//                   <span className="uppercase tracking-wider font-semibold text-neutral-600">{category}</span>
//                   <span>·</span>
//                   <span className="truncate text-neutral-500">{chapterName}</span>
//                 </div>
//               </div>

//               {/* Progress counter */}
//               <div className="flex items-center gap-3">
//                 <span className="text-xs font-semibold text-neutral-500 tabular-nums">
//                   <span className="text-neutral-900">{currentQuestionIndex + 1}</span>
//                   <span className="text-neutral-300 mx-1">/</span>
//                   <span>{stats.total || totalLoaded}</span>
//                 </span>

//                 {/* Difficulty selector — inline pills */}
//                 <div className="hidden sm:flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-0.5">
//                   {DIFFICULTIES.map((d) => (
//                     <button
//                       key={d}
//                       onClick={() => handleDifficultyChange(d)}
//                       disabled={isLoadingQuestions}
//                       className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all disabled:opacity-40"
//                       style={activeDifficulty === d
//                         ? { background: DIFFICULTY_CONFIG[d].color, color: "#fff" }
//                         : { color: "#6b7280" }
//                       }
//                     >
//                       {d.charAt(0).toUpperCase() + d.slice(1)}
//                       <span className="ml-1 opacity-60">·{counts[d]}</span>
//                     </button>
//                   ))}
//                 </div>

//                 {/* Mobile difficulty: compact tag */}
//                 <button
//                   onClick={() => setPanelOpen((v) => !v)}
//                   className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors"
//                   style={{ borderColor: diffCfg.border, background: diffCfg.bg, color: diffCfg.color }}
//                 >
//                   {activeDifficulty.charAt(0).toUpperCase() + activeDifficulty.slice(1)}
//                 </button>
//               </div>
//             </div>

//             {/* Segmented bar */}
//             <div className="pb-2">
//               <SegmentedProgress
//                 total={stats.total || totalLoaded}
//                 currentIndex={currentQuestionIndex}
//                 progressCompletedSet={progressCompletedSet}
//                 progressCorrectSet={progressCorrectSet}
//                 questions={questions}
//                 progressQuestionId={progressQuestionId}
//               />
//             </div>
//           </div>

//           {/* Mobile difficulty panel */}
//           {panelOpen && (
//             <div className="sm:hidden border-t border-neutral-100 bg-white px-4 py-3 flex gap-2">
//               {DIFFICULTIES.map((d) => (
//                 <button
//                   key={d}
//                   onClick={() => { handleDifficultyChange(d); setPanelOpen(false); }}
//                   disabled={isLoadingQuestions}
//                   className="flex-1 py-2 rounded-lg text-xs font-bold border transition-all disabled:opacity-40"
//                   style={activeDifficulty === d
//                     ? { background: DIFFICULTY_CONFIG[d].color, color: "#fff", borderColor: DIFFICULTY_CONFIG[d].color }
//                     : { background: DIFFICULTY_CONFIG[d].bg, color: DIFFICULTY_CONFIG[d].color, borderColor: DIFFICULTY_CONFIG[d].border }
//                   }
//                 >
//                   {d.charAt(0).toUpperCase() + d.slice(1)}
//                   <span className="ml-1 opacity-70">({counts[d]})</span>
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* ── Main content ── */}
//         <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
//           <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 h-full">

//             {/* ── Question area ── */}
//             <div className="flex flex-col">

//               {/* Question card wrapper with slide animation */}
//               <div className="flex-1">
//                 {isLoadingQuestions && questions.length === 0 ? (
//                   <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
//                     <QuestionSkeleton />
//                   </div>
//                 ) : currentQuestion ? (
//                   <div
//                     className="transition-all duration-180"
//                     style={{
//                       opacity:   isAnimating ? 0 : 1,
//                       transform: isAnimating
//                         ? `translateX(${slideDirection === "next" ? "-16px" : "16px"})`
//                         : "translateX(0)",
//                       transition: "opacity 0.18s ease, transform 0.18s ease",
//                     }}
//                   >
//                     {/* Question meta chip */}
//                     <div className="flex items-center gap-2 mb-3 flex-wrap">
//                       <span
//                         className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
//                         style={{ background: diffCfg.bg, color: diffCfg.color, borderColor: diffCfg.border }}
//                       >
//                         {diffCfg.label}
//                       </span>
//                       {currentQuestion.topic && (
//                         <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
//                           <BookOpen className="w-3 h-3" />
//                           {String(currentQuestion.topic).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
//                         </span>
//                       )}
//                       {progressCompletedSet.has(progressQuestionId(currentQuestion._id)) && (
//                         progressCorrectSet.has(progressQuestionId(currentQuestion._id))
//                           ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
//                               <CheckCircle2 className="w-3 h-3" /> Correct
//                             </span>
//                           : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
//                               <XCircle className="w-3 h-3" /> Incorrect
//                             </span>
//                       )}
//                     </div>

//                     {/* Admin rewrite */}
//                     {isAdmin && (
//                       <div className="flex justify-end mb-2">
//                         <button
//                           onClick={() => rewriteQuestionInDb(currentQuestion)}
//                           disabled={rewritingId === currentQuestion._id}
//                           className="px-3 py-1 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
//                         >
//                           {rewritingId === currentQuestion._id ? "Rewriting…" : "Rewrite (AI)"}
//                         </button>
//                       </div>
//                     )}

//                     {/* QuestionCard — unchanged component, same props */}
//                     <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
//                       <MathJaxContext config={mathJaxConfig}>
//                         <MathJax>
//                           <QuestionCard
//                             category={category}
//                             question={currentQuestion}
//                             index={currentQuestionIndex}
//                             onAnswer={(isCorrect) =>
//                               handleAnswer(currentQuestion._id, isCorrect, currentQuestion.topic)
//                             }
//                             isCompleted={progressCompletedSet.has(progressQuestionId(currentQuestion._id))}
//                             isCorrect={progressCorrectSet.has(progressQuestionId(currentQuestion._id))}
//                             isAdmin={isAdmin}
//                           />
//                         </MathJax>
//                       </MathJaxContext>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center">
//                     <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                       <BookOpen className="w-6 h-6 text-neutral-400" />
//                     </div>
//                     <h3 className="text-base font-semibold text-neutral-800 mb-1">No questions available</h3>
//                     <p className="text-sm text-neutral-500">No {activeDifficulty} questions found for this chapter.</p>
//                   </div>
//                 )}
//               </div>

//               {/* ── Navigation controls ── */}
//               {currentQuestion && (
//                 <div className="flex items-center justify-between mt-4 gap-3">
//                   <button
//                     onClick={() => navigateQuestion("prev")}
//                     disabled={currentQuestionIndex === 0 || isAnimating}
//                     className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
//                   >
//                     <ArrowLeft className="w-4 h-4" /> Prev
//                   </button>

//                   {/* Dot indicators (mobile: compact) */}
//                   <div className="flex items-center gap-1 overflow-hidden max-w-[160px] sm:max-w-xs">
//                     {Array.from({ length: Math.min(totalLoaded, 7) }, (_, i) => {
//                       const idx = Math.max(0, Math.min(currentQuestionIndex - 3, totalLoaded - 7)) + i;
//                       if (idx >= totalLoaded) return null;
//                       const q   = questions[idx];
//                       const done = progressCompletedSet.has(progressQuestionId(q?._id));
//                       const ok   = progressCorrectSet.has(progressQuestionId(q?._id));
//                       return (
//                         <button
//                           key={idx}
//                           onClick={() => { if (!isAnimating) { setSlideDirection(idx > currentQuestionIndex ? "next" : "prev"); setIsAnimating(true); setTimeout(() => { setCurrentQuestionIndex(idx); setIsAnimating(false); }, 180); } }}
//                           className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-200"
//                           style={{
//                             background: idx === currentQuestionIndex
//                               ? "#0f172a"
//                               : done ? (ok ? "#16a34a" : "#ef4444") : "#d1d5db",
//                             transform: idx === currentQuestionIndex ? "scale(1.3)" : "scale(1)",
//                           }}
//                         />
//                       );
//                     })}
//                   </div>

//                   <button
//                     onClick={() => navigateQuestion("next")}
//                     disabled={isAnimating}
//                     className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm"
//                   >
//                     {currentQuestionIndex >= totalLoaded - 1 && !hasMore ? "Finish" : "Next"}
//                     <ArrowRight className="w-4 h-4" />
//                   </button>
//                 </div>
//               )}

//               {/* Sign-in nudge (mobile only, compact) */}
//               {!user && (
//                 <div className="mt-4 lg:hidden flex items-center justify-between gap-3 bg-white rounded-xl border border-neutral-200 px-4 py-3 shadow-sm">
//                   <p className="text-xs text-neutral-600 font-medium">Sign in to track your progress</p>
//                   <button
//                     onClick={() => setShowAuthModal(true)}
//                     className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 whitespace-nowrap"
//                   >Sign In</button>
//                 </div>
//               )}
//             </div>

//             {/* ── Right sidebar (desktop only) ── */}
//             <div className="hidden lg:flex flex-col gap-4">

//               {/* Chapter info */}
//               <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Chapter</p>
//                 <h2 className="text-base font-bold text-neutral-900 leading-snug mb-1">{chapterName}</h2>
//                 <p className="text-xs text-neutral-400 uppercase tracking-wide font-semibold">{category}</p>
//               </div>

//               {/* Stats card */}
//               <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Your Progress</p>
//                 <div className="space-y-4">
//                   {/* Completion ring-style bar */}
//                   <div>
//                     <div className="flex justify-between text-xs mb-1.5">
//                       <span className="text-neutral-600 font-medium">Completion</span>
//                       <span className="font-bold text-neutral-900">{stats.completionPercentage}%</span>
//                     </div>
//                     <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
//                       <div
//                         className="h-full rounded-full transition-all duration-500"
//                         style={{ width: `${stats.completionPercentage}%`, background: "#0f172a" }}
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-3">
//                     {[
//                       ["Correct",  stats.correct,   "#16a34a"],
//                       ["Accuracy", `${stats.accuracy}%`, "#2563eb"],
//                     ].map(([label, value, color]) => (
//                       <div key={label} className="bg-neutral-50 rounded-xl p-3 text-center">
//                         <p className="text-lg font-bold" style={{ color }}>{value}</p>
//                         <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{label}</p>
//                       </div>
//                     ))}
//                   </div>

//                   <div className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
//                     <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
//                       <Zap className="w-3.5 h-3.5" /> Points
//                     </span>
//                     <span className="text-sm font-bold text-amber-800">{stats.points}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Difficulty counts */}
//               <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
//                 <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Difficulty</p>
//                 <div className="space-y-2">
//                   {DIFFICULTIES.map((d) => {
//                     const cfg = DIFFICULTY_CONFIG[d];
//                     return (
//                       <button
//                         key={d}
//                         onClick={() => handleDifficultyChange(d)}
//                         disabled={isLoadingQuestions}
//                         className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40"
//                         style={activeDifficulty === d
//                           ? { background: cfg.color, color: "#fff", borderColor: cfg.color }
//                           : { background: cfg.bg, color: cfg.color, borderColor: cfg.border }
//                         }
//                       >
//                         <span>{cfg.label}</span>
//                         <span className="text-xs font-medium opacity-80">{counts[d]} questions</span>
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* Sign-in card */}
//               {!user && (
//                 <div className="bg-neutral-900 rounded-2xl p-5 text-white">
//                   <p className="text-sm font-bold mb-1">Track your progress</p>
//                   <p className="text-xs text-neutral-400 mb-4">Sign in to save answers and see your improvement over time.</p>
//                   <button
//                     onClick={() => setShowAuthModal(true)}
//                     className="w-full py-2.5 bg-white text-neutral-900 rounded-xl text-sm font-bold hover:bg-neutral-100 transition-colors"
//                   >Sign In</button>
//                 </div>
//               )}

//               {/* Keyboard hint */}
//               <div className="text-center">
//                 <p className="text-[10px] text-neutral-400">
//                   Use <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono text-[10px]">←</kbd>{" "}
//                   <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono text-[10px]">→</kbd> to navigate
//                 </p>
//               </div>
//             </div>

//           </div>
//         </div>
//       </div>

//       <Toaster position="bottom-right" />
//     </>
//   );
// });

// ChapterPracticePage.displayName = "ChapterPracticePage";
// export default ChapterPracticePage;

"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
} from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { upsertUserProgress } from "@/lib/userProgressUpsert";
import toast, { Toaster } from "react-hot-toast";
import { Clock, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, XCircle, BookOpen, Target, Zap, Award } from "lucide-react";

// ─── dynamic imports (unchanged) ────────────────────────────────────────────
const QuestionCard = dynamic(() => import("@/components/QuestionCard"), {
  ssr: false,
  loading: () => <QuestionSkeleton />,
});
const Navbar       = dynamic(() => import("@/components/Navbar"),  { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"),     { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── constants (unchanged) ───────────────────────────────────────────────────
const ADMIN_EMAIL            =  process.env.NEXT_PUBLIC_ADMIN_EMAILS ;
const QUESTIONS_PER_PAGE     = 10;
const DIFFICULTIES           = ["easy", "medium", "hard"];
const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

// ─── helpers (unchanged) ─────────────────────────────────────────────────────
const parseDifficultyParam   = (sp) => {
  if (!sp) return null;
  const d = String(sp.get("difficulty") ?? "").toLowerCase();
  return DIFFICULTIES.includes(d) ? d : null;
};
const normalizeChapterName   = (name) =>
  name ? name.toLowerCase().trim().replace(/\s+/g, " ").replace(/-/g, " ") : "";
const chapterNamesMatch      = (a, b) =>
  normalizeChapterName(a) === normalizeChapterName(b);
const progressQuestionId     = (id) => (id == null ? "" : String(id));
const getChapterCandidates   = (chapter) => {
  const ch = chapter ?? "";
  return Array.from(
    new Set(
      [ch, ch.trim(), ch.replace(/-/g, " "), normalizeChapterName(ch),
        normalizeChapterName(ch).replace(/\s+/g, "-")].filter(Boolean)
    )
  );
};

// ─── difficulty colour maps ───────────────────────────────────────────────────
const DIFF_CONFIG = {
  easy:   { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  dot: "bg-emerald-500",  activeBg: "bg-emerald-600",  activeText: "text-white" },
  medium: { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200",    dot: "bg-amber-500",    activeBg: "bg-amber-500",    activeText: "text-white" },
  hard:   { bg: "bg-rose-50",     text: "text-rose-700",     border: "border-rose-200",     dot: "bg-rose-500",     activeBg: "bg-rose-600",     activeText: "text-white" },
};

// ─── inline styles (no Tailwind for animations / custom props) ───────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --surface:   #fafaf9;
    --card:      #ffffff;
    --border:    #e8e5e0;
    --border-md: #d4cfc9;
    --text-1:    #1a1917;
    --text-2:    #57534e;
    --text-3:    #a8a29e;
    --accent:    #1a1917;
    --accent-fg: #ffffff;
    --radius:    14px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);
    --shadow-lg: 0 12px 40px rgba(0,0,0,.10), 0 4px 12px rgba(0,0,0,.06);
    --font-sans: 'DM Sans', sans-serif;
    --font-display: 'Instrument Serif', serif;
  }

  .quiz-root * { box-sizing: border-box; }
  .quiz-root { font-family: var(--font-sans); background: var(--surface); min-height: 100svh; }

  /* question slide animation */
  @keyframes slideIn  { from { opacity: 0; transform: translateX(24px); } to   { opacity: 1; transform: translateX(0);    } }
  @keyframes slideOut { from { opacity: 1; transform: translateX(0);    } to   { opacity: 0; transform: translateX(-24px); } }
  @keyframes fadeUp   { from { opacity: 0; transform: translateY(10px); } to   { opacity: 1; transform: translateY(0);    } }

  .q-enter { animation: slideIn  .28s cubic-bezier(.22,.68,0,1.2) forwards; }
  .q-exit  { animation: slideOut .18s ease-in forwards; }

  /* progress bar fill */
  .progress-fill { transition: width .6s cubic-bezier(.22,.68,0,1.2); }

  /* answer option states */
  .opt-btn {
    position: relative; width: 100%; text-align: left;
    padding: 14px 18px; border-radius: 12px; cursor: pointer;
    border: 1.5px solid var(--border); background: var(--card);
    transition: border-color .15s, background .15s, box-shadow .15s, transform .1s;
    font-family: var(--font-sans); font-size: 0.925rem; color: var(--text-1);
    display: flex; align-items: flex-start; gap: 12px;
    box-shadow: var(--shadow-sm);
  }
  .opt-btn:hover:not(:disabled) { border-color: var(--border-md); background: #f5f4f2; transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .opt-btn:active:not(:disabled) { transform: translateY(0); }
  .opt-btn:disabled { cursor: default; }
  .opt-btn.selected  { border-color: #1a1917; background: #1a1917; color: #fff; box-shadow: var(--shadow-md); }
  .opt-btn.correct   { border-color: #059669; background: #ecfdf5; color: #065f46; }
  .opt-btn.incorrect { border-color: #dc2626; background: #fef2f2; color: #991b1b; }
  .opt-btn .opt-label {
    min-width: 26px; height: 26px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8rem; font-weight: 600; flex-shrink: 0;
    background: rgba(0,0,0,.06); transition: background .15s;
  }
  .opt-btn.selected .opt-label  { background: rgba(255,255,255,.18); }
  .opt-btn.correct  .opt-label  { background: rgba(5,150,105,.15); color: #059669; }
  .opt-btn.incorrect .opt-label { background: rgba(220,38,38,.12); color: #dc2626; }

  /* sidebar scrollbar */
  .q-sidebar::-webkit-scrollbar { width: 4px; }
  .q-sidebar::-webkit-scrollbar-track { background: transparent; }
  .q-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* skeleton pulse */
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  .skel { animation: pulse 1.8s ease-in-out infinite; background: #e8e5e0; border-radius: 8px; }

  /* dot grid nav */
  .dot-nav { display: flex; flex-wrap: wrap; gap: 6px; }
  .dot { width: 28px; height: 28px; border-radius: 8px; border: 1.5px solid var(--border);
         display: flex; align-items: center; justify-content: center;
         font-size: 0.72rem; font-weight: 600; cursor: pointer;
         transition: all .15s; color: var(--text-2); background: var(--card); }
  .dot:hover { border-color: var(--border-md); background: #f5f4f2; }
  .dot.dot-current { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
  .dot.dot-correct  { background: #ecfdf5; border-color: #059669; color: #059669; }
  .dot.dot-wrong    { background: #fef2f2; border-color: #dc2626; color: #dc2626; }

  @media(max-width:767px){
    .opt-btn { padding: 12px 14px; font-size: 0.875rem; }
  }
`;

// ─── sub-components ───────────────────────────────────────────────────────────

const QuestionSkeleton = memo(() => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div className="skel" style={{ height: 24, width: "70%" }} />
    <div className="skel" style={{ height: 20, width: "90%" }} />
    {[1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 52 }} />)}
  </div>
));
QuestionSkeleton.displayName = "QuestionSkeleton";

// Stat pill used in the sidebar / top bar
const StatPill = memo(({ icon: Icon, label, value, accent }) => (
  <div style={{
    display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
    background: accent ? "#1a1917" : "var(--card)",
    border: `1.5px solid ${accent ? "#1a1917" : "var(--border)"}`,
    borderRadius:10, boxShadow:"var(--shadow-sm)",
  }}>
    <Icon size={15} style={{ color: accent ? "#fff" : "var(--text-3)", flexShrink:0 }} />
    <div>
      <div style={{ fontSize:"0.68rem", color: accent ? "rgba(255,255,255,.6)" : "var(--text-3)", fontWeight:500, lineHeight:1 }}>{label}</div>
      <div style={{ fontSize:"0.9rem", fontWeight:600, color: accent ? "#fff" : "var(--text-1)", lineHeight:1.4 }}>{value}</div>
    </div>
  </div>
));
StatPill.displayName = "StatPill";

// Difficulty selector tab
const DiffTab = memo(({ difficulty, count, active, onClick, loading }) => {
  const cfg = DIFF_CONFIG[difficulty];
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display:"flex", alignItems:"center", gap:6, padding:"8px 16px",
        borderRadius:10, border:"1.5px solid",
        borderColor: active ? "transparent" : cfg.border,
        background: active ? (difficulty==="easy"?"#059669":difficulty==="medium"?"#d97706":"#dc2626") : cfg.bg,
        color: active ? "#fff" : cfg.text,
        fontFamily:"var(--font-sans)", fontWeight:500, fontSize:"0.85rem",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.5 : 1,
        transition:"all .15s", whiteSpace:"nowrap",
      }}
    >
      <span style={{ width:7, height:7, borderRadius:"50%", background: active ? "rgba(255,255,255,.6)" : cfg.dot, flexShrink:0 }} />
      <span style={{ textTransform:"capitalize" }}>{difficulty}</span>
      <span style={{
        background: active ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.08)",
        borderRadius:6, padding:"1px 7px", fontSize:"0.75rem", fontWeight:600,
      }}>{count ?? 0}</span>
    </button>
  );
});
DiffTab.displayName = "DiffTab";

// ─── main component ───────────────────────────────────────────────────────────
const ChapterPracticePage = memo(() => {
  const mathJaxConfig = useMemo(() => ({
    "fast-preview": { disabled: false },
    tex: {
      inlineMath:  [["$","$"],["\\(","\\)"]],
      displayMath: [["$$","$$"],["\\[","\\]"]],
      processEscapes: true,
    },
    messageStyle: "none",
    showMathMenu: false,
  }), []);

  const { category, subject, chaptername } = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const pathname     = usePathname();
  const { user, setShowAuthModal } = useAuth();

  const userRef              = useRef(user);
  const categoryRef          = useRef(category);
  const normalizedChapterRef = useRef("");
  const questionsRef         = useRef([]);
  const pendingRef           = useRef(new Map());
  const isSavingProgressRef  = useRef(false);
  const saveProgressTimerRef = useRef(null);
  const fetchAbortRef        = useRef(null);

  useEffect(() => { userRef.current = user; },         [user]);
  useEffect(() => { categoryRef.current = category; }, [category]);

  const isAdmin = useMemo(
    () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL, [user]
  );

  const normalizedChapter = useMemo(
    () => (chaptername ? chaptername.replace(/-/g, " ") : ""), [chaptername]
  );
  useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

  const activeDifficulty = useMemo(
    () => parseDifficultyParam(searchParams) ?? "easy", [searchParams]
  );

  // ── state ────────────────────────────────────────────────────────────────
  const [questions,          setQuestions]          = useState([]);
  const [counts,             setCounts]             = useState({ easy:0, medium:0, hard:0 });
  const [totalQuestions,     setTotalQuestions]     = useState(0);
  const [isLoading,          setIsLoading]          = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [progress,           setProgress]           = useState({ completed:[], correct:[], points:0 });
  const [currentPage,        setCurrentPage]        = useState(1);
  const [hasMore,            setHasMore]            = useState(true);
  const [rewritingId,        setRewritingId]        = useState(null);

  // ── NEW: single-question navigation state ────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDir,     setSlideDir]     = useState("enter"); // "enter" | "exit"
  const [animKey,      setAnimKey]      = useState(0);

  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // ── fetch counts (unchanged) ──────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    if (!category || !normalizedChapter) return;
    try {
      const res = await fetch(
        `/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}`
      );
      if (!res.ok) throw new Error("counts fetch failed");
      const r = await res.json();
      setCounts({ easy: r.easy??0, medium: r.medium??0, hard: r.hard??0 });
      setTotalQuestions(r.total??0);
    } catch (e) {
      console.error("fetchCounts:", e);
      setCounts({ easy:0, medium:0, hard:0 });
    }
  }, [category, normalizedChapter]);

  // ── fetch questions (unchanged logic) ────────────────────────────────────
  const fetchQuestions = useCallback(async (difficulty, page=1, append=false) => {
    if (!normalizedChapter || !category) return;
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setIsLoadingQuestions(true);
    try {
      const res = await fetch(
        `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}&difficulty=${difficulty}&page=${page}&limit=${QUESTIONS_PER_PAGE}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("questions fetch failed");
      const r  = await res.json();
      const qs = r.questions ?? [];
      setQuestions(prev => append ? [...prev, ...qs] : qs);
      setHasMore(r.hasMore ?? false);
      if (!append) setCurrentIndex(0);
    } catch (e) {
      if (e.name === "AbortError") return;
      console.error("fetchQuestions:", e);
      toast.error("Failed to load questions");
      setQuestions([]);
      setHasMore(false);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [category, normalizedChapter]);

  // ── fetch user progress (unchanged) ──────────────────────────────────────
  const fetchUserProgress = useCallback(async () => {
    const userId          = userRef.current?.id;
    const currentCategory = categoryRef.current;
    const currentChapter  = normalizedChapterRef.current;
    if (!userId || !currentChapter || !currentCategory) {
      setProgress({ completed:[], correct:[], points:0 });
      return;
    }
    try {
      const candidates    = getChapterCandidates(currentChapter);
      const categoryUpper = currentCategory.toUpperCase();
      const normChapter   = normalizeChapterName(currentChapter);
      const { data: rows, error: rowErr } = await supabase
        .from("examtracker").select("topic, chapter")
        .eq("category", categoryUpper).in("chapter", candidates);
      if (rowErr) throw rowErr;
      const topicSet = new Set();
      for (const r of rows ?? []) {
        if (r?.topic && chapterNamesMatch(r.chapter, normChapter)) topicSet.add(String(r.topic).trim());
      }
      for (const q of questionsRef.current ?? []) {
        if (q?.topic) topicSet.add(String(q.topic).trim());
      }
      const uniqueTopics = [...topicSet];
      if (!uniqueTopics.length) { setProgress({ completed:[], correct:[], points:0 }); return; }
      const area = currentCategory.toLowerCase();
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("completedquestions, correctanswers, points, topic")
        .eq("user_id", userId).eq("area", area).in("topic", uniqueTopics);
      if (progressError && progressError.code !== "PGRST116") throw progressError;
      const completed = new Set(), correct = new Set();
      let totalPoints = 0;
      for (const item of progressData ?? []) {
        (Array.isArray(item.completedquestions)?item.completedquestions:[]).forEach(id=>{const s=progressQuestionId(id);if(s)completed.add(s);});
        (Array.isArray(item.correctanswers)?item.correctanswers:[]).forEach(id=>{const s=progressQuestionId(id);if(s)correct.add(s);});
        totalPoints += typeof item.points==="number"?item.points:0;
      }
      setProgress({ completed:[...completed], correct:[...correct], points:totalPoints });
    } catch (e) {
      console.error("fetchUserProgress:", e);
      setProgress({ completed:[], correct:[], points:0 });
    }
  }, []);

  // ── save progress (unchanged) ─────────────────────────────────────────────
  const mergePendingIntoRef = useCallback((snapshot) => {
    snapshot.forEach((value, questionId) => {
      if (!pendingRef.current.has(questionId)) pendingRef.current.set(questionId, value);
    });
  }, []);

  const saveProgress = useCallback(async (options={}) => {
    const silent      = options?.silent===true;
    const currentUser = userRef.current;
    const userId      = currentUser?.id;
    const currentCategory = categoryRef.current;
    if (!userId || !pendingRef.current.size) return;
    if (isSavingProgressRef.current) return;
    const snapshot = new Map(pendingRef.current);
    pendingRef.current.clear();
    isSavingProgressRef.current = true;
    const area      = currentCategory?.toLowerCase() ?? "";
    const userEmail = currentUser?.primaryEmailAddress?.emailAddress ?? null;
    let saveOk = false;
    const restoreSnapshot = () => mergePendingIntoRef(snapshot);
    try {
      if (!area) { restoreSnapshot(); return; }
      const entries   = Array.from(snapshot.entries());
      const orphanIds = entries.filter(([,u])=>!String(u?.topic??"").trim()).map(([id])=>id);
      const idToTopic = new Map();
      if (orphanIds.length) {
        const { data: topicRows, error: topicErr } = await supabase
          .from("examtracker").select("_id, topic")
          .eq("category", currentCategory.toUpperCase()).in("_id", orphanIds);
        if (topicErr) throw topicErr;
        for (const r of topicRows??[]) { if(r?._id!=null&&r?.topic) idToTopic.set(progressQuestionId(r._id),String(r.topic).trim()); }
      }
      for (const [qid,u] of entries) {
        const t = String(u?.topic??"").trim()||idToTopic.get(qid);
        if (!t) pendingRef.current.set(qid,u);
      }
      const completedByTopic=new Map(), touchedIdsByTopic=new Map();
      for (const [qid,u] of entries) {
        const topic = String(u?.topic??"").trim()||idToTopic.get(qid);
        if (!topic) continue;
        if (!completedByTopic.has(topic)){completedByTopic.set(topic,new Set());touchedIdsByTopic.set(topic,new Set());}
        (u.completed??[]).forEach(id=>completedByTopic.get(topic).add(progressQuestionId(id)));
        touchedIdsByTopic.get(topic).add(qid);
      }
      const topicsToSave=[...completedByTopic.keys()];
      if (!topicsToSave.length) {
        if (entries.some(([qid,u])=>!String(u?.topic??"").trim()&&!idToTopic.get(qid))) toast.error("Some questions are missing topic data; reload the page.");
        return;
      }
      const { data: existing, error: fetchErr } = await supabase
        .from("user_progress").select("topic, completedquestions, correctanswers, points")
        .eq("user_id", userId).eq("area", area).in("topic", topicsToSave);
      if (fetchErr&&fetchErr.code!=="PGRST116") throw fetchErr;
      const existingMap=new Map((existing??[]).map(r=>[r.topic,r]));
      const upsertRows = topicsToSave.map(topic=>{
        const prev=existingMap.get(topic);
        const prevCompleted=(Array.isArray(prev?.completedquestions)?prev.completedquestions:[]).map(progressQuestionId);
        const prevCorrect=(Array.isArray(prev?.correctanswers)?prev.correctanswers:[]).map(progressQuestionId);
        const prevPoints=typeof prev?.points==="number"?prev.points:0;
        const prevCompletedSet=new Set(prevCompleted);
        const deltaCompleted=[...(completedByTopic.get(topic)??[])].map(progressQuestionId);
        const mergedCompleted=[...new Set([...prevCompleted,...deltaCompleted])];
        let mergedCorrect=[...prevCorrect];
        for (const qid of touchedIdsByTopic.get(topic)??[]) {
          const u=snapshot.get(qid);
          if (!u) continue;
          if ((u.correct??[]).map(progressQuestionId).includes(qid)) { if(!mergedCorrect.includes(qid)) mergedCorrect.push(qid); }
          else { mergedCorrect=mergedCorrect.filter(id=>id!==qid); }
        }
        const newlyCompleted=deltaCompleted.filter(id=>!prevCompletedSet.has(id));
        const pointsToAdd=newlyCompleted.reduce((sum,id)=>{ const u=snapshot.get(id); return sum+(typeof u?.points==="number"?u.points:0); },0);
        return { user_id:userId, email:userEmail, topic, area, completedquestions:mergedCompleted, correctanswers:mergedCorrect, points:prevPoints+pointsToAdd };
      });
      const { error: upsertErr } = await upsertUserProgress(supabase, upsertRows);
      if (upsertErr) throw upsertErr;
      await fetchUserProgress();
      saveOk=true;
      if (!silent) toast.success("Progress saved!", { duration:2000 });
    } catch (e) {
      console.error("saveProgress:", e);
      toast.error("Failed to save progress. Retrying...");
      restoreSnapshot();
    } finally {
      isSavingProgressRef.current=false;
      if (saveOk&&pendingRef.current.size>0) queueMicrotask(()=>saveProgress({silent:true}));
    }
  }, [fetchUserProgress, mergePendingIntoRef]);

  // ── answer handler (unchanged) ────────────────────────────────────────────
  const handleAnswer = useCallback((questionId, isCorrect, questionTopic) => {
    if (!userRef.current) { setShowAuthModal(true); return; }
    const qid   = progressQuestionId(questionId);
    if (!qid) return;
    const topic = questionTopic!=null&&String(questionTopic).trim()!==""?String(questionTopic).trim():null;
    setProgress(prev=>{
      const completedSet=new Set(prev.completed.map(progressQuestionId));
      const correctSet=new Set(prev.correct.map(progressQuestionId));
      const alreadyCompleted=completedSet.has(qid);
      const wasCorrect=correctSet.has(qid);
      const pointsDelta=alreadyCompleted?0:isCorrect?100:0;
      if(!alreadyCompleted) completedSet.add(qid);
      if(isCorrect) correctSet.add(qid); else correctSet.delete(qid);
      return { completed:[...completedSet], correct:[...correctSet], points:prev.points+pointsDelta-(wasCorrect&&!isCorrect?100:0) };
    });
    pendingRef.current.set(qid, { completed:[qid], correct:isCorrect?[qid]:[], points:isCorrect?100:0, topic });
    if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
    saveProgressTimerRef.current = setTimeout(()=>saveProgress(), 1500);
  }, [setShowAuthModal, saveProgress]);

  // ── difficulty / routing (unchanged) ─────────────────────────────────────
  useLayoutEffect(() => {
    if (typeof window==="undefined"||!category||!normalizedChapter) return;
    if (parseDifficultyParam(searchParams)) return;
    try {
      const saved=sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
      if (saved&&DIFFICULTIES.includes(saved)&&saved!=="easy") {
        const params=new URLSearchParams(searchParams.toString());
        params.set("difficulty",saved);
        router.replace(`${pathname}?${params.toString()}`,{scroll:false});
      }
    } catch(_){}
  }, [category, normalizedChapter, pathname, router, searchParams]);

  useEffect(()=>{
    try { sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty); } catch(_){}
  }, [activeDifficulty]);

  const handleDifficultyChange = useCallback((difficulty)=>{
    if (difficulty===activeDifficulty||isLoadingQuestions) return;
    setCurrentPage(1); setHasMore(true); setCurrentIndex(0);
    const params=new URLSearchParams(searchParams.toString());
    params.set("difficulty",difficulty);
    router.replace(`${pathname}?${params.toString()}`,{scroll:false});
  }, [activeDifficulty, isLoadingQuestions, router, searchParams, pathname]);

  // ── NEW: question navigation ──────────────────────────────────────────────
  const navigateToIndex = useCallback((idx) => {
    if (idx<0||idx>=questions.length) return;
    setAnimKey(k=>k+1);
    setCurrentIndex(idx);
    // auto-load more when reaching near the end
    if (idx>=questions.length-3 && hasMore && !isLoadingQuestions) {
      const next=currentPage+1;
      setCurrentPage(next);
      fetchQuestions(activeDifficulty, next, true);
    }
  }, [questions.length, hasMore, isLoadingQuestions, currentPage, activeDifficulty, fetchQuestions]);

  const goNext = useCallback(()=>navigateToIndex(currentIndex+1), [currentIndex, navigateToIndex]);
  const goPrev = useCallback(()=>navigateToIndex(currentIndex-1), [currentIndex, navigateToIndex]);

  // keyboard navigation
  useEffect(()=>{
    const handler=(e)=>{
      if (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
      if (e.key==="ArrowRight"||e.key==="ArrowDown") goNext();
      if (e.key==="ArrowLeft"||e.key==="ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // ── effects: data loading (unchanged) ────────────────────────────────────
  useEffect(()=>{
    if (!category||!normalizedChapter) return;
    let cancelled=false;
    const load=async()=>{
      setIsLoading(true); setCurrentPage(1); setHasMore(true);
      try { await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty,1,false)]); }
      finally { if(!cancelled) setIsLoading(false); }
    };
    load();
    return ()=>{ cancelled=true; };
  }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

  useEffect(()=>{ fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);
  useEffect(()=>{ if(!user?.id||!questions.length) return; fetchUserProgress(); }, [user, questions, fetchUserProgress]);

  useEffect(()=>{
    const flush=()=>{ if(pendingRef.current.size>0&&userRef.current) saveProgress(); };
    window.addEventListener("beforeunload", flush);
    return ()=>{ window.removeEventListener("beforeunload", flush); if(saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current); flush(); };
  }, [saveProgress]);

  // ── admin rewrite (unchanged) ─────────────────────────────────────────────
  const extractRewrittenStem = useCallback((content)=>{
    if(!content) return null;
    let text=String(content).trim();
    text=text.replace(/```[\s\S]*?```/g,m=>m.replace(/```/g,""));
    text=text.replace(/^["'\s]*Question\s*:\s*/i,"").trim();
    const stop=/(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(text);
    if(stop?.index>0) text=text.slice(0,stop.index).trim();
    text=(text.split(/\n\s*\n/)[0]??text).trim();
    return text.replace(/\s+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim()||null;
  },[]);

  const rewriteQuestionInDb = useCallback(async(question)=>{
    if(!isAdmin||!question?._id||rewritingId) return;
    setRewritingId(question._id);
    const tid=toast.loading("Rewriting question...");
    try {
      const stem=String(question.question??"").replace(/<\/?[^>]+(>|$)/g," ").trim();
      if(!stem) throw new Error("empty stem");
      const resp=await fetch("/api/generate-similar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"rewrite-question",question:stem,maxTokens:160})});
      if(!resp.ok) throw new Error(await resp.text());
      const rewritten=extractRewrittenStem((await resp.json())?.content);
      if(!rewritten) throw new Error("no rewritten text");
      const { error }=await supabase.from("examtracker").update({question:rewritten}).eq("_id",question._id);
      if(error) throw error;
      setQuestions(prev=>prev.map(q=>q?._id===question._id?{...q,question:rewritten}:q));
      toast.success("Question rewritten & updated.",{id:tid});
    } catch(e) {
      console.error("rewrite:",e);
      toast.error("Failed to rewrite question.",{id:tid});
    } finally { setRewritingId(null); }
  }, [extractRewrittenStem, isAdmin, rewritingId]);

  // ── derived stats ─────────────────────────────────────────────────────────
  const progressCompletedSet = useMemo(
    ()=>new Set((progress.completed??[]).map(progressQuestionId)), [progress.completed]
  );
  const progressCorrectSet = useMemo(
    ()=>new Set((progress.correct??[]).map(progressQuestionId)), [progress.correct]
  );

  const stats = useMemo(()=>{
    const completed=questions.filter(q=>progressCompletedSet.has(progressQuestionId(q._id))).length;
    const correct=questions.filter(q=>progressCorrectSet.has(progressQuestionId(q._id))).length;
    const total=counts[activeDifficulty]??0;
    const totalAll=totalQuestions||counts.easy+counts.medium+counts.hard;
    return {
      completed, correct, total, totalAll,
      completionPercentage: total?Math.round((completed/total)*100):0,
      accuracy: completed?Math.round((correct/completed)*100):0,
      points: progress.points,
    };
  }, [questions, progress, counts, activeDifficulty, totalQuestions]);

  const chapterName = useMemo(
    ()=>normalizedChapter?.replace(/\b\w/g,c=>c.toUpperCase())??"", [normalizedChapter]
  );

  const currentQuestion = questions[currentIndex];
  const totalVisible    = questions.length;

  // ── loading screen ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="quiz-root">
        <style>{globalStyles}</style>
        <MetaDataJobs
          seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
          seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
        />
        <Navbar />
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"70vh", paddingTop:80 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:44, height:44, borderRadius:"50%", border:"3px solid #e8e5e0", borderTopColor:"#1a1917", animation:"spin 0.8s linear infinite", margin:"0 auto 20px" }} />
            <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.95rem", color:"var(--text-2)" }}>Loading questions…</p>
          </div>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── main render ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{globalStyles}</style>
      <div className="quiz-root">
        <MetaDataJobs
          seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
          seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
        />
        <Navbar />

        {/* ── top bar ── */}
        <div style={{
          position:"sticky", top:0, zIndex:40,
          background:"rgba(250,250,249,0.92)", backdropFilter:"blur(12px)",
          borderBottom:"1px solid var(--border)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}>
          <div style={{ maxWidth:1200, margin:"0 auto", padding:"10px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>

            {/* back */}
            <Link href={`/${category}/${subject}/${chaptername}`}
              style={{ display:"flex", alignItems:"center", gap:6, color:"var(--text-2)", textDecoration:"none",
                fontSize:"0.82rem", fontWeight:500, fontFamily:"var(--font-sans)", flexShrink:0,
                padding:"6px 10px", borderRadius:8, border:"1px solid var(--border)", background:"var(--card)",
                transition:"all .15s"
              }}
            >
              <ArrowLeft size={13} /> Back
            </Link>

            {/* breadcrumb */}
            <div style={{ display:"flex", alignItems:"center", gap:6, flex:1, minWidth:0 }}>
              <span style={{ fontSize:"0.75rem", color:"var(--text-3)", fontWeight:500, textTransform:"uppercase", letterSpacing:".06em", background:"var(--card)", border:"1px solid var(--border)", padding:"3px 8px", borderRadius:6, flexShrink:0 }}>
                {category?.toUpperCase()}
              </span>
              <span style={{ color:"var(--text-3)", fontSize:"0.75rem" }}>›</span>
              <span style={{ fontSize:"0.82rem", color:"var(--text-1)", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"var(--font-display)", fontStyle:"italic" }}>
                {chapterName}
              </span>
            </div>

            {/* progress pill */}
            <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
              <span style={{ fontSize:"0.8rem", color:"var(--text-2)", fontWeight:500 }}>
                {currentIndex+1} <span style={{ color:"var(--text-3)" }}>/ {totalVisible}</span>
              </span>
              <div style={{ width:80, height:5, background:"var(--border)", borderRadius:999, overflow:"hidden" }}>
                <div className="progress-fill" style={{
                  height:"100%", borderRadius:999, background:"#1a1917",
                  width:`${totalVisible?((currentIndex+1)/totalVisible)*100:0}%`
                }} />
              </div>
            </div>

            {/* points */}
            <div style={{
              display:"flex", alignItems:"center", gap:6, padding:"5px 12px",
              background:"#1a1917", borderRadius:8, color:"#fff", flexShrink:0
            }}>
              <Award size={13} style={{ opacity:.7 }} />
              <span style={{ fontSize:"0.8rem", fontWeight:600 }}>{stats.points} pts</span>
            </div>
          </div>

          {/* thin progress fill */}
          <div style={{ height:2, background:"var(--border)" }}>
            <div className="progress-fill" style={{
              height:"100%", background:"#1a1917",
              width:`${stats.completionPercentage}%`
            }} />
          </div>
        </div>

        {/* ── body layout ── */}
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"20px 16px 80px", display:"grid", gridTemplateColumns:"1fr", gap:20 }}
          className="main-grid"
        >
          <style>{`
            @media(min-width:1024px){
              .main-grid { grid-template-columns: 280px 1fr !important; align-items: start; }
              .sidebar-col { display: flex !important; }
              .diff-row { flex-direction: column !important; }
            }
            @media(min-width:768px) and (max-width:1023px){
              .main-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          {/* ── sidebar (desktop) ── */}
          <aside className="sidebar-col" style={{
            display:"none", flexDirection:"column", gap:14,
            position:"sticky", top:90, maxHeight:"calc(100svh - 110px)", overflow:"hidden"
          }}>
            {/* stats */}
            <div
  style={{
    background: "var(--card)",
    border: "1.5px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "18px",
    boxShadow: "var(--shadow-sm)",
  }}
>
              <p style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", color:"var(--text-3)", marginBottom:12 }}>
                Your Progress
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <StatPill icon={Target} label="Completed" value={`${stats.completionPercentage}%`} accent />
                <StatPill icon={CheckCircle2} label="Correct" value={stats.correct} />
                <StatPill icon={Zap} label="Accuracy" value={`${stats.accuracy}%`} />
                <StatPill icon={Award} label="Points" value={stats.points} />
              </div>
            </div>

            {/* difficulty */}
            <div style={{
              background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)",
              padding:18, boxShadow:"var(--shadow-sm)"
            }}>
              <p style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", color:"var(--text-3)", marginBottom:12 }}>
                Difficulty
              </p>
              <div className="diff-row" style={{ display:"flex", gap:8, flexDirection:"column" }}>
                {DIFFICULTIES.map(d=>(
                  <DiffTab key={d} difficulty={d} count={counts[d]} active={activeDifficulty===d}
                    loading={isLoadingQuestions} onClick={()=>handleDifficultyChange(d)} />
                ))}
              </div>
            </div>

            {/* question dot grid */}
            {questions.length>0&&(
              <div style={{
                background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)",
                padding:18, boxShadow:"var(--shadow-sm)", overflow:"auto"
              }} className="q-sidebar">
                <p style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", color:"var(--text-3)", marginBottom:12 }}>
                  Questions
                </p>
                <div className="dot-nav">
                  {questions.map((q,i)=>{
                    const qid=progressQuestionId(q._id);
                    const isComp=progressCompletedSet.has(qid);
                    const isCorr=progressCorrectSet.has(qid);
                    return (
                      <div key={q._id}
                        className={`dot ${i===currentIndex?"dot-current":isComp?(isCorr?"dot-correct":"dot-wrong"):""}`}
                        onClick={()=>navigateToIndex(i)}
                        title={`Question ${i+1}`}
                      >{i+1}</div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* sign in CTA */}
            {!user&&(
              <div style={{ background:"#fafaf9", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", padding:16 }}>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <BookOpen size={16} style={{ color:"var(--text-3)", flexShrink:0, marginTop:2 }} />
                  <div>
                    <p style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--text-1)", marginBottom:2 }}>Track your progress</p>
                    <p style={{ fontSize:"0.78rem", color:"var(--text-2)" }}>Sign in to save answers and earn points</p>
                  </div>
                </div>
                <button onClick={()=>setShowAuthModal(true)} style={{
                  width:"100%", padding:"9px 0", background:"#1a1917", color:"#fff", border:"none",
                  borderRadius:9, fontFamily:"var(--font-sans)", fontWeight:600, fontSize:"0.85rem",
                  cursor:"pointer", marginTop:4
                }}>Sign In</button>
              </div>
            )}
          </aside>

          {/* ── main question area ── */}
          <div style={{ minWidth:0 }}>

            {/* mobile controls */}
            <div className="mobile-controls" style={{ marginBottom:14 }}>
              <style>{`
                .mobile-controls { display: block; }
                @media(min-width:1024px){ .mobile-controls { display: none; } }
              `}</style>

{/* mobile difficulty tabs */}
<div style={{ display:"flex", gap:8, marginBottom:10, marginTop:20 }}>
                {DIFFICULTIES.map(d=>(
                  <DiffTab key={d} difficulty={d} count={counts[d]} active={activeDifficulty===d}
                    loading={isLoadingQuestions} onClick={()=>handleDifficultyChange(d)} />
                ))}
              </div>

              {/* mobile stats row */}
              <div style={{ display:"flex", gap:8, marginTop:8, marginBottom:10, overflowX:"auto", paddingBottom:4 }}>
                {[
                  [Target, `${stats.completionPercentage}%`, "Done"],
                  [CheckCircle2, stats.correct, "Correct"],
                  [Zap, `${stats.accuracy}%`, "Accuracy"],
                ].map(([Icon, val, lbl])=>(
                  <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px",
                    background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:10, flexShrink:0 }}>
                    <Icon size={13} style={{ color:"var(--text-3)" }} />
                    <span style={{ fontSize:"0.8rem", fontWeight:600, color:"var(--text-1)" }}>{val}</span>
                    <span style={{ fontSize:"0.72rem", color:"var(--text-3)" }}>{lbl}</span>
                  </div>
                ))}
              </div>

              

              {/* mobile progress bar */}
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1, height:5, background:"var(--border)", borderRadius:999, overflow:"hidden" }}>
                  <div className="progress-fill" style={{ height:"100%", background:"#1a1917", width:`${stats.completionPercentage}%`, borderRadius:999 }} />
                </div>
                <span style={{ fontSize:"0.75rem", color:"var(--text-2)", fontWeight:500, whiteSpace:"nowrap" }}>
                  {stats.completed}/{stats.total}
                </span>
              </div>
            </div>

            {/* question card */}
            {isLoadingQuestions&&questions.length===0 ? (
              <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", padding:28, boxShadow:"var(--shadow-sm)" }}>
                <QuestionSkeleton />
              </div>
            ) : questions.length===0 ? (
              <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)",
                padding:"48px 24px", textAlign:"center", boxShadow:"var(--shadow-sm)" }}>
                <Clock size={36} style={{ color:"var(--text-3)", margin:"0 auto 12px" }} />
                <h3 style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"1.3rem", color:"var(--text-1)", marginBottom:6 }}>No questions available</h3>
                <p style={{ fontSize:"0.88rem", color:"var(--text-2)" }}>No {activeDifficulty} questions found for this chapter.</p>
              </div>
            ) : currentQuestion ? (
              <div key={animKey} className="q-enter" style={{
                background:"var(--card)", border:"1.5px solid var(--border)",
                borderRadius:"var(--radius)", boxShadow:"var(--shadow-md)", overflow:"hidden"
              }}>
                {/* question header */}
                <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                  <div style={{ minWidth:0 }}>
                    {currentQuestion.topic&&(
                      <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
                        background:"#f5f4f2", border:"1px solid var(--border)", borderRadius:6,
                        fontSize:"0.72rem", fontWeight:600, color:"var(--text-2)", marginBottom:6,
                        textTransform:"uppercase", letterSpacing:".05em"
                      }}>
                        <BookOpen size={10} /> {currentQuestion.topic}
                      </div>
                    )}
                    <p style={{ fontSize:"0.78rem", color:"var(--text-3)", fontWeight:500 }}>
                      Question {currentIndex+1} of {totalVisible}
                      {hasMore&&<span style={{ color:"var(--text-3)", marginLeft:4 }}>+</span>}
                    </p>
                  </div>

                  {/* admin rewrite */}
                  {isAdmin&&(
                    <button onClick={()=>rewriteQuestionInDb(currentQuestion)}
                      disabled={rewritingId===currentQuestion._id}
                      style={{ padding:"5px 12px", background:"var(--card)", border:"1.5px solid var(--border-md)",
                        borderRadius:8, fontSize:"0.75rem", fontWeight:500, color:"var(--text-2)",
                        cursor:"pointer", flexShrink:0, transition:"all .15s" }}>
                      {rewritingId===currentQuestion._id?"Rewriting…":"Rewrite (AI)"}
                    </button>
                  )}
                </div>

                {/* question body */}
                <div style={{ padding:"6px 15px" }}>
                  <MathJaxContext config={mathJaxConfig}>
                    <MathJax>
                      <QuestionCard
                        category={category}
                        question={currentQuestion}
                        index={currentIndex}
                        onAnswer={(isCorrect)=>handleAnswer(currentQuestion._id, isCorrect, currentQuestion.topic)}
                        isCompleted={progressCompletedSet.has(progressQuestionId(currentQuestion._id))}
                        isCorrect={progressCorrectSet.has(progressQuestionId(currentQuestion._id))}
                        isAdmin={isAdmin}
                      />
                    </MathJax>
                  </MathJaxContext>
                </div>

                {/* navigation footer */}
                <div style={{
                  padding:"14px 24px", borderTop:"1px solid var(--border)",
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
                  background:"#fafaf9"
                }}>
                  <button onClick={goPrev} disabled={currentIndex===0}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
                      background: currentIndex===0?"var(--surface)":"var(--card)",
                      border:"1.5px solid var(--border)", borderRadius:10,
                      fontFamily:"var(--font-sans)", fontWeight:500, fontSize:"0.85rem",
                      color: currentIndex===0?"var(--text-3)":"var(--text-1)",
                      cursor: currentIndex===0?"not-allowed":"pointer", transition:"all .15s"
                    }}>
                    <ChevronLeft size={15} /> Previous
                  </button>

                  {/* dot indicators (mobile) */}
                  <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                    {questions.slice(Math.max(0,currentIndex-2), currentIndex+3).map((_,ii)=>{
                      const realIdx=Math.max(0,currentIndex-2)+ii;
                      const isCur=realIdx===currentIndex;
                      return <div key={realIdx} style={{
                        width: isCur?20:6, height:6, borderRadius:999,
                        background: isCur?"#1a1917":"var(--border-md)", transition:"all .2s"
                      }} />;
                    })}
                  </div>

                  <button onClick={goNext}
                    disabled={currentIndex===questions.length-1&&!hasMore}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
                      background: currentIndex===questions.length-1&&!hasMore?"var(--surface)":"#1a1917",
                      border:"1.5px solid",
                      borderColor: currentIndex===questions.length-1&&!hasMore?"var(--border)":"#1a1917",
                      borderRadius:10, fontFamily:"var(--font-sans)", fontWeight:500, fontSize:"0.85rem",
                      color: currentIndex===questions.length-1&&!hasMore?"var(--text-3)":"#fff",
                      cursor: currentIndex===questions.length-1&&!hasMore?"not-allowed":"pointer",
                      transition:"all .15s"
                    }}>
                    {isLoadingQuestions&&currentIndex>=questions.length-3?"Loading…":"Next"} <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            ) : null}

            {/* mobile sign-in CTA */}
            {!user&&(
              <div className="mobile-auth" style={{ marginTop:14 }}>
                <style>{`.mobile-auth{display:block}@media(min-width:1024px){.mobile-auth{display:none}}`}</style>
                <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", padding:"14px 18px",
                  display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, boxShadow:"var(--shadow-sm)" }}>
                  <div>
                    <p style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--text-1)" }}>Track your progress</p>
                    <p style={{ fontSize:"0.75rem", color:"var(--text-2)" }}>Sign in to save & earn points</p>
                  </div>
                  <button onClick={()=>setShowAuthModal(true)} style={{
                    padding:"8px 18px", background:"#1a1917", color:"#fff", border:"none",
                    borderRadius:9, fontFamily:"var(--font-sans)", fontWeight:600, fontSize:"0.83rem",
                    cursor:"pointer", flexShrink:0
                  }}>Sign In</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Toaster position="bottom-right" toastOptions={{ style: { fontFamily:"var(--font-sans)", fontSize:"0.875rem" } }} />
      </div>
    </>
  );
});

ChapterPracticePage.displayName = "ChapterPracticePage";
export default ChapterPracticePage;