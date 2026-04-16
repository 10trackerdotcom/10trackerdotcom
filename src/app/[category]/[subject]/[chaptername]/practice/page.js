// // "use client";

// // import React, {
// //   useState,
// //   useEffect,
// //   useLayoutEffect,
// //   useCallback,
// //   useMemo,
// //   memo,
// //   useRef,
// // } from "react";
// // import { MathJax, MathJaxContext } from "better-react-mathjax";
// // import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
// // import { createClient } from "@supabase/supabase-js";
// // import dynamic from "next/dynamic";
// // import Link from "next/link";
// // import { useAuth } from "@/app/context/AuthContext";
// // import { upsertUserProgress } from "@/lib/userProgressUpsert";
// // import toast, { Toaster } from "react-hot-toast";
// // import { Clock, ArrowLeft } from "lucide-react";

// // const QuestionCard = dynamic(() => import("@/components/QuestionCard"), {
// //   ssr: false,
// //   loading: () => <QuestionSkeleton />,
// // });
// // const Navbar      = dynamic(() => import("@/components/Navbar"),   { ssr: false });
// // const MetaDataJobs = dynamic(() => import("@/components/Seo"),     { ssr: false });

// // const supabase = createClient(
// //   process.env.NEXT_PUBLIC_SUPABASE_URL,
// //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// // );

// // const ADMIN_EMAIL          = "jain10gunjan@gmail.com";
// // const QUESTIONS_PER_PAGE   = 10;
// // const DIFFICULTIES         = ["easy", "medium", "hard"];
// // const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

// // // ─── helpers ────────────────────────────────────────────────────────────────

// // const parseDifficultyParam = (sp) => {
// //   if (!sp) return null;
// //   const d = String(sp.get("difficulty") ?? "").toLowerCase();
// //   return DIFFICULTIES.includes(d) ? d : null;
// // };

// // const normalizeChapterName = (name) =>
// //   name ? name.toLowerCase().trim().replace(/\s+/g, " ").replace(/-/g, " ") : "";

// // const chapterNamesMatch = (a, b) =>
// //   normalizeChapterName(a) === normalizeChapterName(b);

// // const progressQuestionId = (id) => (id == null ? "" : String(id));

// // const getChapterCandidates = (chapter) => {
// //   const ch = chapter ?? "";
// //   return Array.from(
// //     new Set(
// //       [
// //         ch,
// //         ch.trim(),
// //         ch.replace(/-/g, " "),
// //         normalizeChapterName(ch),
// //         normalizeChapterName(ch).replace(/\s+/g, "-"),
// //       ].filter(Boolean)
// //     )
// //   );
// // };

// // // ─── sub-components ─────────────────────────────────────────────────────────

// // const QuestionSkeleton = memo(() => (
// //   <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
// //     <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse" />
// //     <div className="space-y-2">
// //       {[1, 2, 3, 4].map((i) => (
// //         <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
// //       ))}
// //     </div>
// //   </div>
// // ));
// // QuestionSkeleton.displayName = "QuestionSkeleton";

// // const DifficultyButton = memo(({ difficulty, count, active, onClick, loading }) => (
// //   <button
// //     onClick={onClick}
// //     disabled={loading}
// //     className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
// //       active
// //         ? "bg-neutral-900 text-white"
// //         : "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
// //     }`}
// //   >
// //     <span className="capitalize">{difficulty}</span>
// //     <span
// //       className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
// //         active ? "bg-white/20" : "bg-neutral-100"
// //       }`}
// //     >
// //       {count ?? 0}
// //     </span>
// //   </button>
// // ));
// // DifficultyButton.displayName = "DifficultyButton";

// // // ─── main component ──────────────────────────────────────────────────────────

// // const ChapterPracticePage = memo(() => {
// //   const mathJaxConfig = useMemo(
// //     () => ({
// //       "fast-preview": { disabled: false },
// //       tex: {
// //         inlineMath:   [["$", "$"], ["\\(", "\\)"]],
// //         displayMath:  [["$$", "$$"], ["\\[", "\\]"]],
// //         processEscapes: true,
// //       },
// //       messageStyle: "none",
// //       showMathMenu: false,
// //     }),
// //     []
// //   );

// //   const { category, subject, chaptername } = useParams();
// //   const router       = useRouter();
// //   const searchParams = useSearchParams();
// //   const pathname     = usePathname();
// //   const { user, setShowAuthModal } = useAuth();

// //   const userRef              = useRef(user);
// //   const categoryRef          = useRef(category);
// //   const normalizedChapterRef = useRef("");
// //   const questionsRef         = useRef([]);
// //   const pendingRef           = useRef(new Map());
// //   const isSavingProgressRef  = useRef(false);
// //   const saveProgressTimerRef = useRef(null);
// //   const fetchAbortRef        = useRef(null);   // ← abort controller for fetchQuestions

// //   useEffect(() => { userRef.current = user; }, [user]);
// //   useEffect(() => { categoryRef.current = category; }, [category]);

// //   const isAdmin = useMemo(
// //     () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL,
// //     [user]
// //   );

// //   const normalizedChapter = useMemo(
// //     () => (chaptername ? chaptername.replace(/-/g, " ") : ""),
// //     [chaptername]
// //   );

// //   useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

// //   const activeDifficulty = useMemo(
// //     () => parseDifficultyParam(searchParams) ?? "easy",
// //     [searchParams]
// //   );

// //   // ── state ────────────────────────────────────────────────────────────────
// //   const [questions,          setQuestions]          = useState([]);
// //   const [counts,             setCounts]             = useState({ easy: 0, medium: 0, hard: 0 });
// //   const [totalQuestions,     setTotalQuestions]     = useState(0);
// //   const [isLoading,          setIsLoading]          = useState(true);
// //   const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
// //   const [progress,           setProgress]           = useState({ completed: [], correct: [], points: 0 });
// //   const [currentPage,        setCurrentPage]        = useState(1);
// //   const [hasMore,            setHasMore]            = useState(true);
// //   const [rewritingId,        setRewritingId]        = useState(null);

// //   useEffect(() => { questionsRef.current = questions; }, [questions]);

// //   // ── fetch counts ─────────────────────────────────────────────────────────
// //   const fetchCounts = useCallback(async () => {
// //     if (!category || !normalizedChapter) return;
// //     try {
// //       const res = await fetch(
// //         `/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}`
// //       );
// //       if (!res.ok) throw new Error("counts fetch failed");
// //       const r = await res.json();
// //       const c = { easy: r.easy ?? 0, medium: r.medium ?? 0, hard: r.hard ?? 0 };
// //       setCounts(c);
// //       setTotalQuestions(r.total ?? 0);
// //     } catch (e) {
// //       console.error("fetchCounts:", e);
// //       setCounts({ easy: 0, medium: 0, hard: 0 });
// //     }
// //   }, [category, normalizedChapter]);

// //   // ── fetch questions (with abort) ──────────────────────────────────────────
// //   const fetchQuestions = useCallback(
// //     async (difficulty, page = 1, append = false) => {
// //       if (!normalizedChapter || !category) return;

// //       // Cancel any in-flight fetch
// //       if (fetchAbortRef.current) fetchAbortRef.current.abort();
// //       const controller = new AbortController();
// //       fetchAbortRef.current = controller;

// //       setIsLoadingQuestions(true);
// //       try {
// //         const res = await fetch(
// //           `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}&difficulty=${difficulty}&page=${page}&limit=${QUESTIONS_PER_PAGE}`,
// //           { signal: controller.signal }
// //         );
// //         if (!res.ok) throw new Error("questions fetch failed");
// //         const r  = await res.json();
// //         const qs = r.questions ?? [];
// //         setQuestions((prev) => (append ? [...prev, ...qs] : qs));
// //         setHasMore(r.hasMore ?? false);
// //       } catch (e) {
// //         if (e.name === "AbortError") return; // silently ignore cancelled requests
// //         console.error("fetchQuestions:", e);
// //         toast.error("Failed to load questions");
// //         setQuestions([]);
// //         setHasMore(false);
// //       } finally {
// //         setIsLoadingQuestions(false);
// //       }
// //     },
// //     [category, normalizedChapter]
// //   );

// //   // ── fetch user progress ───────────────────────────────────────────────────
// //   const fetchUserProgress = useCallback(async () => {
// //     const userId         = userRef.current?.id;
// //     const currentCategory = categoryRef.current;
// //     const currentChapter  = normalizedChapterRef.current;

// //     if (!userId || !currentChapter || !currentCategory) {
// //       setProgress({ completed: [], correct: [], points: 0 });
// //       return;
// //     }

// //     try {
// //       const candidates     = getChapterCandidates(currentChapter);
// //       const categoryUpper  = currentCategory.toUpperCase();
// //       const normChapter    = normalizeChapterName(currentChapter);

// //       // Single query — all chapter variants at once
// //       const { data: rows, error: rowErr } = await supabase
// //         .from("examtracker")
// //         .select("topic, chapter")
// //         .eq("category", categoryUpper)
// //         .in("chapter", candidates);

// //       if (rowErr) throw rowErr;

// //       const topicSet = new Set();
// //       for (const r of rows ?? []) {
// //         if (r?.topic && chapterNamesMatch(r.chapter, normChapter)) {
// //           topicSet.add(String(r.topic).trim());
// //         }
// //       }
// //       // Also pick up topics from already-loaded questions
// //       for (const q of questionsRef.current ?? []) {
// //         if (q?.topic) topicSet.add(String(q.topic).trim());
// //       }

// //       const uniqueTopics = [...topicSet];
// //       if (!uniqueTopics.length) {
// //         setProgress({ completed: [], correct: [], points: 0 });
// //         return;
// //       }

// //       const area = currentCategory.toLowerCase();
// //       const { data: progressData, error: progressError } = await supabase
// //         .from("user_progress")
// //         .select("completedquestions, correctanswers, points, topic")
// //         .eq("user_id", userId)
// //         .eq("area", area)
// //         .in("topic", uniqueTopics);

// //       if (progressError && progressError.code !== "PGRST116") throw progressError;

// //       const completed    = new Set();
// //       const correct      = new Set();
// //       let   totalPoints  = 0;

// //       for (const item of progressData ?? []) {
// //         (Array.isArray(item.completedquestions) ? item.completedquestions : []).forEach(
// //           (id) => { const sid = progressQuestionId(id); if (sid) completed.add(sid); }
// //         );
// //         (Array.isArray(item.correctanswers) ? item.correctanswers : []).forEach(
// //           (id) => { const sid = progressQuestionId(id); if (sid) correct.add(sid); }
// //         );
// //         totalPoints += typeof item.points === "number" ? item.points : 0;
// //       }

// //       setProgress({
// //         completed: Array.from(completed),
// //         correct:   Array.from(correct),
// //         points:    totalPoints,
// //       });
// //     } catch (e) {
// //       console.error("fetchUserProgress:", e);
// //       setProgress({ completed: [], correct: [], points: 0 });
// //     }
// //   }, []);

// //   // ── save progress ─────────────────────────────────────────────────────────
// //   const mergePendingIntoRef = useCallback((snapshot) => {
// //     snapshot.forEach((value, questionId) => {
// //       if (!pendingRef.current.has(questionId)) pendingRef.current.set(questionId, value);
// //     });
// //   }, []);

// //   const saveProgress = useCallback(
// //     async (options = {}) => {
// //       const silent      = options?.silent === true;
// //       const currentUser = userRef.current;
// //       const userId      = currentUser?.id;
// //       const currentCategory = categoryRef.current;

// //       if (!userId || !pendingRef.current.size) return;
// //       if (isSavingProgressRef.current) return;

// //       const snapshot = new Map(pendingRef.current);
// //       pendingRef.current.clear();
// //       isSavingProgressRef.current = true;

// //       const area      = currentCategory?.toLowerCase() ?? "";
// //       const userEmail = currentUser?.primaryEmailAddress?.emailAddress ?? null;
// //       let   saveOk    = false;

// //       const restoreSnapshot = () => mergePendingIntoRef(snapshot);

// //       try {
// //         if (!area) { restoreSnapshot(); return; }

// //         const entries   = Array.from(snapshot.entries());
// //         const orphanIds = entries
// //           .filter(([, u]) => !String(u?.topic ?? "").trim())
// //           .map(([id]) => id);

// //         const idToTopic = new Map();
// //         if (orphanIds.length) {
// //           const { data: topicRows, error: topicErr } = await supabase
// //             .from("examtracker")
// //             .select("_id, topic")
// //             .eq("category", currentCategory.toUpperCase())
// //             .in("_id", orphanIds);
// //           if (topicErr) throw topicErr;
// //           for (const r of topicRows ?? []) {
// //             if (r?._id != null && r?.topic)
// //               idToTopic.set(progressQuestionId(r._id), String(r.topic).trim());
// //           }
// //         }

// //         for (const [qid, u] of entries) {
// //           const t = String(u?.topic ?? "").trim() || idToTopic.get(qid);
// //           if (!t) pendingRef.current.set(qid, u);
// //         }

// //         const completedByTopic  = new Map();
// //         const touchedIdsByTopic = new Map();

// //         for (const [qid, u] of entries) {
// //           const topic = String(u?.topic ?? "").trim() || idToTopic.get(qid);
// //           if (!topic) continue;
// //           if (!completedByTopic.has(topic)) {
// //             completedByTopic.set(topic, new Set());
// //             touchedIdsByTopic.set(topic, new Set());
// //           }
// //           (u.completed ?? []).forEach((id) =>
// //             completedByTopic.get(topic).add(progressQuestionId(id))
// //           );
// //           touchedIdsByTopic.get(topic).add(qid);
// //         }

// //         const topicsToSave = [...completedByTopic.keys()];
// //         if (!topicsToSave.length) {
// //           if (entries.some(([qid, u]) => !String(u?.topic ?? "").trim() && !idToTopic.get(qid)))
// //             toast.error("Some questions are missing topic data; reload the page.");
// //           return;
// //         }

// //         const { data: existing, error: fetchErr } = await supabase
// //           .from("user_progress")
// //           .select("topic, completedquestions, correctanswers, points")
// //           .eq("user_id", userId)
// //           .eq("area", area)
// //           .in("topic", topicsToSave);
// //         if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;

// //         const existingMap = new Map((existing ?? []).map((r) => [r.topic, r]));

// //         const upsertRows = topicsToSave.map((topic) => {
// //           const prev         = existingMap.get(topic);
// //           const prevCompleted = (
// //             Array.isArray(prev?.completedquestions) ? prev.completedquestions : []
// //           ).map(progressQuestionId);
// //           const prevCorrect  = (
// //             Array.isArray(prev?.correctanswers) ? prev.correctanswers : []
// //           ).map(progressQuestionId);
// //           const prevPoints       = typeof prev?.points === "number" ? prev.points : 0;
// //           const prevCompletedSet = new Set(prevCompleted);

// //           const deltaCompleted  = [...(completedByTopic.get(topic) ?? [])].map(progressQuestionId);
// //           const mergedCompleted = [...new Set([...prevCompleted, ...deltaCompleted])];

// //           let mergedCorrect = [...prevCorrect];
// //           for (const qid of touchedIdsByTopic.get(topic) ?? []) {
// //             const u = snapshot.get(qid);
// //             if (!u) continue;
// //             if ((u.correct ?? []).map(progressQuestionId).includes(qid)) {
// //               if (!mergedCorrect.includes(qid)) mergedCorrect.push(qid);
// //             } else {
// //               mergedCorrect = mergedCorrect.filter((id) => id !== qid);
// //             }
// //           }

// //           const newlyCompleted = deltaCompleted.filter((id) => !prevCompletedSet.has(id));
// //           const pointsToAdd    = newlyCompleted.reduce((sum, id) => {
// //             const u = snapshot.get(id);
// //             return sum + (typeof u?.points === "number" ? u.points : 0);
// //           }, 0);

// //           return {
// //             user_id:            userId,
// //             email:              userEmail,
// //             topic,
// //             area,
// //             completedquestions: mergedCompleted,
// //             correctanswers:     mergedCorrect,
// //             points:             prevPoints + pointsToAdd,
// //           };
// //         });

// //         const { error: upsertErr } = await upsertUserProgress(supabase, upsertRows);
// //         if (upsertErr) throw upsertErr;

// //         await fetchUserProgress();
// //         saveOk = true;
// //         if (!silent) toast.success("Progress saved!", { duration: 2000 });
// //       } catch (e) {
// //         console.error("saveProgress:", e);
// //         toast.error("Failed to save progress. Retrying...");
// //         restoreSnapshot();
// //       } finally {
// //         isSavingProgressRef.current = false;
// //         if (saveOk && pendingRef.current.size > 0) {
// //           queueMicrotask(() => saveProgress({ silent: true }));
// //         }
// //       }
// //     },
// //     [fetchUserProgress, mergePendingIntoRef]
// //   );

// //   // ── answer handler ────────────────────────────────────────────────────────
// //   const handleAnswer = useCallback(
// //     (questionId, isCorrect, questionTopic) => {
// //       if (!userRef.current) { setShowAuthModal(true); return; }

// //       const qid   = progressQuestionId(questionId);
// //       if (!qid) return;
// //       const topic = questionTopic != null && String(questionTopic).trim() !== ""
// //         ? String(questionTopic).trim()
// //         : null;

// //       setProgress((prev) => {
// //         const completedSet    = new Set(prev.completed.map(progressQuestionId));
// //         const correctSet      = new Set(prev.correct.map(progressQuestionId));
// //         const alreadyCompleted = completedSet.has(qid);
// //         const wasCorrect       = correctSet.has(qid);
// //         const pointsDelta      = alreadyCompleted ? 0 : isCorrect ? 100 : 0;
// //         if (!alreadyCompleted) completedSet.add(qid);
// //         if (isCorrect) correctSet.add(qid); else correctSet.delete(qid);
// //         return {
// //           completed: Array.from(completedSet),
// //           correct:   Array.from(correctSet),
// //           points:    prev.points + pointsDelta - (wasCorrect && !isCorrect ? 100 : 0),
// //         };
// //       });

// //       pendingRef.current.set(qid, {
// //         completed: [qid],
// //         correct:   isCorrect ? [qid] : [],
// //         points:    isCorrect ? 100 : 0,
// //         topic,
// //       });

// //       if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
// //       saveProgressTimerRef.current = setTimeout(() => saveProgress(), 1500); // increased to 1.5s
// //     },
// //     [setShowAuthModal, saveProgress]
// //   );

// //   // ── difficulty / routing ──────────────────────────────────────────────────
// //   useLayoutEffect(() => {
// //     if (typeof window === "undefined" || !category || !normalizedChapter) return;
// //     if (parseDifficultyParam(searchParams)) return;
// //     try {
// //       const saved = sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
// //       if (saved && DIFFICULTIES.includes(saved) && saved !== "easy") {
// //         const params = new URLSearchParams(searchParams.toString());
// //         params.set("difficulty", saved);
// //         router.replace(`${pathname}?${params.toString()}`, { scroll: false });
// //       }
// //     } catch (_) {}
// //   }, [category, normalizedChapter, pathname, router, searchParams]);

// //   useEffect(() => {
// //     try { sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty); } catch (_) {}
// //   }, [activeDifficulty]);

// //   const handleDifficultyChange = useCallback(
// //     (difficulty) => {
// //       if (difficulty === activeDifficulty || isLoadingQuestions) return;
// //       setCurrentPage(1);
// //       setHasMore(true);
// //       const params = new URLSearchParams(searchParams.toString());
// //       params.set("difficulty", difficulty);
// //       router.replace(`${pathname}?${params.toString()}`, { scroll: false });
// //     },
// //     [activeDifficulty, isLoadingQuestions, router, searchParams, pathname]
// //   );

// //   // ── load more ────────────────────────────────────────────────────────────
// //   const loadMore = useCallback(() => {
// //     if (!hasMore || isLoadingQuestions) return;
// //     const next = currentPage + 1;
// //     setCurrentPage(next);
// //     fetchQuestions(activeDifficulty, next, true);
// //   }, [hasMore, isLoadingQuestions, currentPage, activeDifficulty, fetchQuestions]);

// //   // ── admin: rewrite question ───────────────────────────────────────────────
// //   const extractRewrittenStem = useCallback((content) => {
// //     if (!content) return null;
// //     let text = String(content).trim();
// //     text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
// //     text = text.replace(/^["'\s]*Question\s*:\s*/i, "").trim();
// //     const stop = /(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(text);
// //     if (stop?.index > 0) text = text.slice(0, stop.index).trim();
// //     text = (text.split(/\n\s*\n/)[0] ?? text).trim();
// //     return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;
// //   }, []);

// //   const rewriteQuestionInDb = useCallback(
// //     async (question) => {
// //       if (!isAdmin || !question?._id || rewritingId) return;
// //       setRewritingId(question._id);
// //       const tid = toast.loading("Rewriting question...");
// //       try {
// //         const stem = String(question.question ?? "").replace(/<\/?[^>]+(>|$)/g, " ").trim();
// //         if (!stem) throw new Error("empty stem");
// //         const resp = await fetch("/api/generate-similar", {
// //           method:  "POST",
// //           headers: { "Content-Type": "application/json" },
// //           body:    JSON.stringify({ mode: "rewrite-question", question: stem, maxTokens: 160 }),
// //         });
// //         if (!resp.ok) throw new Error(await resp.text());
// //         const rewritten = extractRewrittenStem((await resp.json())?.content);
// //         if (!rewritten) throw new Error("no rewritten text");
// //         const { error } = await supabase
// //           .from("examtracker")
// //           .update({ question: rewritten })
// //           .eq("_id", question._id);
// //         if (error) throw error;
// //         setQuestions((prev) =>
// //           prev.map((q) => (q?._id === question._id ? { ...q, question: rewritten } : q))
// //         );
// //         toast.success("Question rewritten & updated.", { id: tid });
// //       } catch (e) {
// //         console.error("rewrite:", e);
// //         toast.error("Failed to rewrite question.", { id: tid });
// //       } finally {
// //         setRewritingId(null);
// //       }
// //     },
// //     [extractRewrittenStem, isAdmin, rewritingId]
// //   );

// //   // ── effects: data loading ─────────────────────────────────────────────────
// //   useEffect(() => {
// //     if (!category || !normalizedChapter) return;
// //     let cancelled = false;
// //     const load = async () => {
// //       setIsLoading(true);
// //       setCurrentPage(1);
// //       setHasMore(true);
// //       try {
// //         await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty, 1, false)]);
// //       } finally {
// //         if (!cancelled) setIsLoading(false);
// //       }
// //     };
// //     load();
// //     return () => { cancelled = true; };
// //   }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

// //   useEffect(() => { fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);

// //   useEffect(() => {
// //     if (!user?.id || !questions.length) return;
// //     fetchUserProgress();
// //   }, [user, questions, fetchUserProgress]);

// //   // Flush pending on unmount / page unload
// //   useEffect(() => {
// //     const flush = () => {
// //       if (pendingRef.current.size > 0 && userRef.current) saveProgress();
// //     };
// //     window.addEventListener("beforeunload", flush);
// //     return () => {
// //       window.removeEventListener("beforeunload", flush);
// //       if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
// //       flush();
// //     };
// //   }, [saveProgress]);

// //   // ── derived stats ─────────────────────────────────────────────────────────
// //   const progressCompletedSet = useMemo(
// //     () => new Set((progress.completed ?? []).map(progressQuestionId)),
// //     [progress.completed]
// //   );
// //   const progressCorrectSet = useMemo(
// //     () => new Set((progress.correct ?? []).map(progressQuestionId)),
// //     [progress.correct]
// //   );

// //   const stats = useMemo(() => {
// //     const completed = questions.filter((q) =>
// //       progressCompletedSet.has(progressQuestionId(q._id))
// //     ).length;
// //     const correct = questions.filter((q) =>
// //       progressCorrectSet.has(progressQuestionId(q._id))
// //     ).length;
// //     const total    = counts[activeDifficulty] ?? 0;
// //     const totalAll = totalQuestions || counts.easy + counts.medium + counts.hard;
// //     return {
// //       completed,
// //       correct,
// //       total,
// //       totalAll,
// //       completionPercentage: total ? Math.round((completed / total) * 100) : 0,
// //       accuracy:             completed ? Math.round((correct / completed) * 100) : 0,
// //       points:               progress.points,
// //     };
// //   }, [questions, progress, counts, activeDifficulty, totalQuestions]);

// //   const chapterName = useMemo(
// //     () => normalizedChapter?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? "",
// //     [normalizedChapter]
// //   );

// //   // ── render ────────────────────────────────────────────────────────────────
// //   if (isLoading) {
// //     return (
// //       <div className="min-h-screen bg-neutral-50">
// //         <MetaDataJobs
// //           seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
// //           seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
// //         />
// //         <Navbar />
// //         <div className="flex justify-center items-center min-h-[60vh] pt-16 px-4">
// //           <div className="bg-white p-8 rounded-lg border border-neutral-200 flex items-center space-x-4">
// //             <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
// //             <div>
// //               <h3 className="text-lg font-medium text-neutral-900">Loading questions</h3>
// //               <p className="text-sm text-neutral-600">Please wait...</p>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <>
// //       <Navbar />
// //       <div className="min-h-screen bg-neutral-50">
// //         <MetaDataJobs
// //           seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
// //           seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
// //         />
// //         <div className="bg-neutral-50 pt-4 overflow-x-hidden">
// //           <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">

// //             {/* Breadcrumb */}
// //             <div className="mb-4">
// //               <Link
// //                 href={`/${category}/${subject}/${chaptername}`}
// //                 className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors text-sm"
// //               >
// //                 <ArrowLeft className="w-4 h-4" />
// //                 <span>Back to Chapter Topics</span>
// //               </Link>
// //             </div>

// //             {/* Header */}
// //             <div className="mb-4 sm:mb-8 mt-8">
// //               <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-1">
// //                 {chapterName} - Chapter Practice
// //               </h1>
// //               <p className="text-xs sm:text-sm text-neutral-600 mb-4">
// //                 {stats.total} {activeDifficulty} questions • {stats.totalAll} total questions
// //               </p>

// //               {/* Stats */}
// //               <div className="bg-white rounded-lg border border-neutral-200 p-3 mb-4">
// //                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
// //                   {[
// //                     ["Completion", `${stats.completionPercentage}%`],
// //                     ["Correct",    stats.correct],
// //                     ["Accuracy",   `${stats.accuracy}%`],
// //                     ["Points",     stats.points],
// //                   ].map(([label, value]) => (
// //                     <div key={label}>
// //                       <p className="text-xs text-neutral-600 mb-1">{label}</p>
// //                       <p className="text-lg font-semibold text-neutral-900">{value}</p>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Controls */}
// //             <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-4">
// //               <div className="mb-4">
// //                 <div className="flex justify-between text-xs sm:text-sm mb-2">
// //                   <span className="text-neutral-700">Progress</span>
// //                   <span className="text-neutral-600">
// //                     {stats.completed}/{stats.total} questions
// //                   </span>
// //                 </div>
// //                 <div className="w-full bg-neutral-200 rounded-full h-2">
// //                   <div
// //                     className="bg-neutral-900 h-2 rounded-full transition-all duration-300"
// //                     style={{ width: `${stats.completionPercentage}%` }}
// //                   />
// //                 </div>
// //               </div>

// //               <div className="flex flex-wrap gap-2 mb-3">
// //                 {DIFFICULTIES.map((d) => (
// //                   <DifficultyButton
// //                     key={d}
// //                     difficulty={d}
// //                     count={counts[d]}
// //                     active={activeDifficulty === d}
// //                     loading={isLoadingQuestions}
// //                     onClick={() => handleDifficultyChange(d)}
// //                   />
// //                 ))}
// //               </div>

// //               {!user && (
// //                 <div className="bg-neutral-50 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
// //                   <div>
// //                     <p className="text-xs sm:text-sm font-medium text-neutral-900">
// //                       Sign in to track progress
// //                     </p>
// //                     <p className="text-xs text-neutral-600">
// //                       Save your answers and track your improvement
// //                     </p>
// //                   </div>
// //                   <button
// //                     onClick={() => setShowAuthModal(true)}
// //                     className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-800 whitespace-nowrap"
// //                   >
// //                     Sign In
// //                   </button>
// //                 </div>
// //               )}
// //             </div>

// //             {/* Question list */}
// //             <div className="space-y-4 w-full overflow-x-hidden">
// //               <MathJaxContext config={mathJaxConfig}>
// //                 <MathJax>
// //                   {isLoadingQuestions && questions.length === 0 ? (
// //                     <div className="space-y-4">
// //                       {[1, 2, 3].map((i) => <QuestionSkeleton key={i} />)}
// //                     </div>
// //                   ) : questions.length > 0 ? (
// //                     <>
// //                       {questions.map((question, index) => (
// //                         <div key={question._id} className="space-y-2">
// //                           {isAdmin && (
// //                             <div className="flex justify-end">
// //                               <button
// //                                 onClick={() => rewriteQuestionInDb(question)}
// //                                 disabled={rewritingId === question._id}
// //                                 className="px-3 py-1.5 rounded-lg bg-white border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
// //                               >
// //                                 {rewritingId === question._id ? "Rewriting..." : "Rewrite (AI)"}
// //                               </button>
// //                             </div>
// //                           )}
// //                           <QuestionCard
// //                             category={category}
// //                             question={question}
// //                             index={index}
// //                             onAnswer={(isCorrect) =>
// //                               handleAnswer(question._id, isCorrect, question.topic)
// //                             }
// //                             isCompleted={progressCompletedSet.has(progressQuestionId(question._id))}
// //                             isCorrect={progressCorrectSet.has(progressQuestionId(question._id))}
// //                             isAdmin={isAdmin}
// //                           />
// //                         </div>
// //                       ))}

// //                       {hasMore && (
// //                         <div className="text-center py-4">
// //                           <button
// //                             onClick={loadMore}
// //                             disabled={isLoadingQuestions}
// //                             className="px-6 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
// //                           >
// //                             {isLoadingQuestions ? "Loading..." : "Load More Questions"}
// //                           </button>
// //                         </div>
// //                       )}
// //                     </>
// //                   ) : (
// //                     <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
// //                       <Clock size={36} className="mx-auto text-neutral-400 mb-3" />
// //                       <h3 className="text-lg font-semibold text-neutral-900 mb-2">
// //                         No questions available
// //                       </h3>
// //                       <p className="text-sm text-neutral-600">
// //                         No questions found for {activeDifficulty} difficulty.
// //                       </p>
// //                     </div>
// //                   )}
// //                 </MathJax>
// //               </MathJaxContext>
// //             </div>

// //           </div>
// //         </div>
// //         <Toaster position="bottom-right" />
// //       </div>
// //     </>
// //   );
// // });

// // ChapterPracticePage.displayName = "ChapterPracticePage";
// // export default ChapterPracticePage;

// // "use client";

// // import React, {
// //   useState,
// //   useEffect,
// //   useLayoutEffect,
// //   useCallback,
// //   useMemo,
// //   memo,
// //   useRef,
// // } from "react";
// // import { MathJax, MathJaxContext } from "better-react-mathjax";
// // import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
// // import { createClient } from "@supabase/supabase-js";
// // import dynamic from "next/dynamic";
// // import Link from "next/link";
// // import { useAuth } from "@/app/context/AuthContext";
// // import { upsertUserProgress } from "@/lib/userProgressUpsert";
// // import toast, { Toaster } from "react-hot-toast";
// // import { ArrowLeft, ArrowRight, ChevronLeft, CheckCircle2, XCircle, BookOpen, BarChart2, Zap, RotateCcw } from "lucide-react";

// // const QuestionCard = dynamic(() => import("@/components/QuestionCard"), {
// //   ssr: false,
// //   loading: () => <QuestionSkeleton />,
// // });
// // const Navbar       = dynamic(() => import("@/components/Navbar"),  { ssr: false });
// // const MetaDataJobs = dynamic(() => import("@/components/Seo"),     { ssr: false });

// // const supabase = createClient(
// //   process.env.NEXT_PUBLIC_SUPABASE_URL,
// //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// // );

// // const ADMIN_EMAIL          = "jain10gunjan@gmail.com";
// // const QUESTIONS_PER_PAGE   = 10;
// // const DIFFICULTIES         = ["easy", "medium", "hard"];
// // const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

// // // ─── helpers (unchanged) ─────────────────────────────────────────────────────

// // const parseDifficultyParam = (sp) => {
// //   if (!sp) return null;
// //   const d = String(sp.get("difficulty") ?? "").toLowerCase();
// //   return DIFFICULTIES.includes(d) ? d : null;
// // };

// // const normalizeChapterName = (name) =>
// //   name ? name.toLowerCase().trim().replace(/\s+/g, " ").replace(/-/g, " ") : "";

// // const chapterNamesMatch = (a, b) =>
// //   normalizeChapterName(a) === normalizeChapterName(b);

// // const progressQuestionId = (id) => (id == null ? "" : String(id));

// // const getChapterCandidates = (chapter) => {
// //   const ch = chapter ?? "";
// //   return Array.from(
// //     new Set(
// //       [
// //         ch,
// //         ch.trim(),
// //         ch.replace(/-/g, " "),
// //         normalizeChapterName(ch),
// //         normalizeChapterName(ch).replace(/\s+/g, "-"),
// //       ].filter(Boolean)
// //     )
// //   );
// // };

// // // ─── difficulty colors ────────────────────────────────────────────────────────

// // const DIFFICULTY_CONFIG = {
// //   easy:   { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Easy" },
// //   medium: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Medium" },
// //   hard:   { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", label: "Hard" },
// // };

// // // ─── sub-components ───────────────────────────────────────────────────────────

// // const QuestionSkeleton = memo(() => (
// //   <div className="space-y-4 px-2">
// //     <div className="h-5 bg-neutral-100 rounded-lg w-4/5 animate-pulse" />
// //     <div className="h-5 bg-neutral-100 rounded-lg w-3/5 animate-pulse" />
// //     <div className="mt-6 space-y-3">
// //       {[1, 2, 3, 4].map((i) => (
// //         <div key={i} className="h-14 bg-neutral-50 border border-neutral-100 rounded-xl animate-pulse" />
// //       ))}
// //     </div>
// //   </div>
// // ));
// // QuestionSkeleton.displayName = "QuestionSkeleton";

// // // Thin segmented progress bar showing per-question status
// // const SegmentedProgress = memo(({ total, currentIndex, completed, correct, progressCompletedSet, progressCorrectSet, questions, progressQuestionId }) => {
// //   if (!total) return null;
// //   const MAX_SEGMENTS = 40;
// //   const segments = Math.min(total, MAX_SEGMENTS);
// //   const step = total / segments;

// //   return (
// //     <div className="flex gap-[2px] h-1.5 w-full">
// //       {Array.from({ length: segments }, (_, i) => {
// //         const qIdx = Math.floor(i * step);
// //         const q = questions[qIdx];
// //         const isCompleted = q && progressCompletedSet.has(progressQuestionId(q._id));
// //         const isCorrect   = q && progressCorrectSet.has(progressQuestionId(q._id));
// //         const isCurrent   = qIdx === currentIndex;
// //         return (
// //           <div
// //             key={i}
// //             className="flex-1 rounded-full transition-all duration-300"
// //             style={{
// //               backgroundColor: isCurrent
// //                 ? "#0f172a"
// //                 : isCompleted
// //                 ? isCorrect ? "#16a34a" : "#ef4444"
// //                 : "#e2e8f0",
// //             }}
// //           />
// //         );
// //       })}
// //     </div>
// //   );
// // });
// // SegmentedProgress.displayName = "SegmentedProgress";

// // // ─── main component ───────────────────────────────────────────────────────────

// // const ChapterPracticePage = memo(() => {
// //   const mathJaxConfig = useMemo(
// //     () => ({
// //       "fast-preview": { disabled: false },
// //       tex: {
// //         inlineMath:  [["$", "$"], ["\\(", "\\)"]],
// //         displayMath: [["$$", "$$"], ["\\[", "\\]"]],
// //         processEscapes: true,
// //       },
// //       messageStyle: "none",
// //       showMathMenu: false,
// //     }),
// //     []
// //   );

// //   const { category, subject, chaptername } = useParams();
// //   const router       = useRouter();
// //   const searchParams = useSearchParams();
// //   const pathname     = usePathname();
// //   const { user, setShowAuthModal } = useAuth();

// //   const userRef              = useRef(user);
// //   const categoryRef          = useRef(category);
// //   const normalizedChapterRef = useRef("");
// //   const questionsRef         = useRef([]);
// //   const pendingRef           = useRef(new Map());
// //   const isSavingProgressRef  = useRef(false);
// //   const saveProgressTimerRef = useRef(null);
// //   const fetchAbortRef        = useRef(null);

// //   useEffect(() => { userRef.current = user; }, [user]);
// //   useEffect(() => { categoryRef.current = category; }, [category]);

// //   const isAdmin = useMemo(
// //     () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL,
// //     [user]
// //   );

// //   const normalizedChapter = useMemo(
// //     () => (chaptername ? chaptername.replace(/-/g, " ") : ""),
// //     [chaptername]
// //   );

// //   useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

// //   const activeDifficulty = useMemo(
// //     () => parseDifficultyParam(searchParams) ?? "easy",
// //     [searchParams]
// //   );

// //   // ── state (all original state preserved) ─────────────────────────────────
// //   const [questions,          setQuestions]          = useState([]);
// //   const [counts,             setCounts]             = useState({ easy: 0, medium: 0, hard: 0 });
// //   const [totalQuestions,     setTotalQuestions]     = useState(0);
// //   const [isLoading,          setIsLoading]          = useState(true);
// //   const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
// //   const [progress,           setProgress]           = useState({ completed: [], correct: [], points: 0 });
// //   const [currentPage,        setCurrentPage]        = useState(1);
// //   const [hasMore,            setHasMore]            = useState(true);
// //   const [rewritingId,        setRewritingId]        = useState(null);

// //   // ── NEW UI state ──────────────────────────────────────────────────────────
// //   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
// //   const [showSummary,          setShowSummary]          = useState(false);
// //   const [slideDirection,       setSlideDirection]       = useState("next"); // "next" | "prev"
// //   const [isAnimating,          setIsAnimating]          = useState(false);
// //   const [panelOpen,            setPanelOpen]            = useState(false); // mobile difficulty panel

// //   useEffect(() => { questionsRef.current = questions; }, [questions]);

// //   // Reset question index on difficulty/question set changes
// //   useEffect(() => { setCurrentQuestionIndex(0); setShowSummary(false); }, [activeDifficulty]);

// //   // Auto-advance to load more when near end
// //   useEffect(() => {
// //     if (!hasMore || isLoadingQuestions) return;
// //     const threshold = 3;
// //     if (questions.length > 0 && currentQuestionIndex >= questions.length - threshold) {
// //       const next = currentPage + 1;
// //       setCurrentPage(next);
// //       fetchQuestions(activeDifficulty, next, true);
// //     }
// //   // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, [currentQuestionIndex, questions.length]);

// //   // ── fetch counts (unchanged) ──────────────────────────────────────────────
// //   const fetchCounts = useCallback(async () => {
// //     if (!category || !normalizedChapter) return;
// //     try {
// //       const res = await fetch(
// //         `/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}`
// //       );
// //       if (!res.ok) throw new Error("counts fetch failed");
// //       const r = await res.json();
// //       const c = { easy: r.easy ?? 0, medium: r.medium ?? 0, hard: r.hard ?? 0 };
// //       setCounts(c);
// //       setTotalQuestions(r.total ?? 0);
// //     } catch (e) {
// //       console.error("fetchCounts:", e);
// //       setCounts({ easy: 0, medium: 0, hard: 0 });
// //     }
// //   }, [category, normalizedChapter]);

// //   // ── fetch questions (unchanged logic) ────────────────────────────────────
// //   const fetchQuestions = useCallback(
// //     async (difficulty, page = 1, append = false) => {
// //       if (!normalizedChapter || !category) return;
// //       if (fetchAbortRef.current) fetchAbortRef.current.abort();
// //       const controller = new AbortController();
// //       fetchAbortRef.current = controller;
// //       setIsLoadingQuestions(true);
// //       try {
// //         const res = await fetch(
// //           `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}&difficulty=${difficulty}&page=${page}&limit=${QUESTIONS_PER_PAGE}`,
// //           { signal: controller.signal }
// //         );
// //         if (!res.ok) throw new Error("questions fetch failed");
// //         const r  = await res.json();
// //         const qs = r.questions ?? [];
// //         setQuestions((prev) => (append ? [...prev, ...qs] : qs));
// //         setHasMore(r.hasMore ?? false);
// //       } catch (e) {
// //         if (e.name === "AbortError") return;
// //         console.error("fetchQuestions:", e);
// //         toast.error("Failed to load questions");
// //         setQuestions([]);
// //         setHasMore(false);
// //       } finally {
// //         setIsLoadingQuestions(false);
// //       }
// //     },
// //     [category, normalizedChapter]
// //   );

// //   // ── fetch user progress (unchanged) ──────────────────────────────────────
// //   const fetchUserProgress = useCallback(async () => {
// //     const userId          = userRef.current?.id;
// //     const currentCategory = categoryRef.current;
// //     const currentChapter  = normalizedChapterRef.current;
// //     if (!userId || !currentChapter || !currentCategory) {
// //       setProgress({ completed: [], correct: [], points: 0 });
// //       return;
// //     }
// //     try {
// //       const candidates    = getChapterCandidates(currentChapter);
// //       const categoryUpper = currentCategory.toUpperCase();
// //       const normChapter   = normalizeChapterName(currentChapter);
// //       const { data: rows, error: rowErr } = await supabase
// //         .from("examtracker")
// //         .select("topic, chapter")
// //         .eq("category", categoryUpper)
// //         .in("chapter", candidates);
// //       if (rowErr) throw rowErr;
// //       const topicSet = new Set();
// //       for (const r of rows ?? []) {
// //         if (r?.topic && chapterNamesMatch(r.chapter, normChapter))
// //           topicSet.add(String(r.topic).trim());
// //       }
// //       for (const q of questionsRef.current ?? []) {
// //         if (q?.topic) topicSet.add(String(q.topic).trim());
// //       }
// //       const uniqueTopics = [...topicSet];
// //       if (!uniqueTopics.length) { setProgress({ completed: [], correct: [], points: 0 }); return; }
// //       const area = currentCategory.toLowerCase();
// //       const { data: progressData, error: progressError } = await supabase
// //         .from("user_progress")
// //         .select("completedquestions, correctanswers, points, topic")
// //         .eq("user_id", userId)
// //         .eq("area", area)
// //         .in("topic", uniqueTopics);
// //       if (progressError && progressError.code !== "PGRST116") throw progressError;
// //       const completed   = new Set();
// //       const correct     = new Set();
// //       let   totalPoints = 0;
// //       for (const item of progressData ?? []) {
// //         (Array.isArray(item.completedquestions) ? item.completedquestions : []).forEach(
// //           (id) => { const sid = progressQuestionId(id); if (sid) completed.add(sid); }
// //         );
// //         (Array.isArray(item.correctanswers) ? item.correctanswers : []).forEach(
// //           (id) => { const sid = progressQuestionId(id); if (sid) correct.add(sid); }
// //         );
// //         totalPoints += typeof item.points === "number" ? item.points : 0;
// //       }
// //       setProgress({ completed: Array.from(completed), correct: Array.from(correct), points: totalPoints });
// //     } catch (e) {
// //       console.error("fetchUserProgress:", e);
// //       setProgress({ completed: [], correct: [], points: 0 });
// //     }
// //   }, []);

// //   // ── save progress (unchanged) ─────────────────────────────────────────────
// //   const mergePendingIntoRef = useCallback((snapshot) => {
// //     snapshot.forEach((value, questionId) => {
// //       if (!pendingRef.current.has(questionId)) pendingRef.current.set(questionId, value);
// //     });
// //   }, []);

// //   const saveProgress = useCallback(
// //     async (options = {}) => {
// //       const silent      = options?.silent === true;
// //       const currentUser = userRef.current;
// //       const userId      = currentUser?.id;
// //       const currentCategory = categoryRef.current;
// //       if (!userId || !pendingRef.current.size) return;
// //       if (isSavingProgressRef.current) return;
// //       const snapshot = new Map(pendingRef.current);
// //       pendingRef.current.clear();
// //       isSavingProgressRef.current = true;
// //       const area      = currentCategory?.toLowerCase() ?? "";
// //       const userEmail = currentUser?.primaryEmailAddress?.emailAddress ?? null;
// //       let   saveOk    = false;
// //       const restoreSnapshot = () => mergePendingIntoRef(snapshot);
// //       try {
// //         if (!area) { restoreSnapshot(); return; }
// //         const entries   = Array.from(snapshot.entries());
// //         const orphanIds = entries.filter(([, u]) => !String(u?.topic ?? "").trim()).map(([id]) => id);
// //         const idToTopic = new Map();
// //         if (orphanIds.length) {
// //           const { data: topicRows, error: topicErr } = await supabase
// //             .from("examtracker").select("_id, topic").eq("category", currentCategory.toUpperCase()).in("_id", orphanIds);
// //           if (topicErr) throw topicErr;
// //           for (const r of topicRows ?? []) {
// //             if (r?._id != null && r?.topic) idToTopic.set(progressQuestionId(r._id), String(r.topic).trim());
// //           }
// //         }
// //         for (const [qid, u] of entries) {
// //           const t = String(u?.topic ?? "").trim() || idToTopic.get(qid);
// //           if (!t) pendingRef.current.set(qid, u);
// //         }
// //         const completedByTopic  = new Map();
// //         const touchedIdsByTopic = new Map();
// //         for (const [qid, u] of entries) {
// //           const topic = String(u?.topic ?? "").trim() || idToTopic.get(qid);
// //           if (!topic) continue;
// //           if (!completedByTopic.has(topic)) { completedByTopic.set(topic, new Set()); touchedIdsByTopic.set(topic, new Set()); }
// //           (u.completed ?? []).forEach((id) => completedByTopic.get(topic).add(progressQuestionId(id)));
// //           touchedIdsByTopic.get(topic).add(qid);
// //         }
// //         const topicsToSave = [...completedByTopic.keys()];
// //         if (!topicsToSave.length) {
// //           if (entries.some(([qid, u]) => !String(u?.topic ?? "").trim() && !idToTopic.get(qid)))
// //             toast.error("Some questions are missing topic data; reload the page.");
// //           return;
// //         }
// //         const { data: existing, error: fetchErr } = await supabase
// //           .from("user_progress").select("topic, completedquestions, correctanswers, points")
// //           .eq("user_id", userId).eq("area", area).in("topic", topicsToSave);
// //         if (fetchErr && fetchErr.code !== "PGRST116") throw fetchErr;
// //         const existingMap = new Map((existing ?? []).map((r) => [r.topic, r]));
// //         const upsertRows = topicsToSave.map((topic) => {
// //           const prev          = existingMap.get(topic);
// //           const prevCompleted = (Array.isArray(prev?.completedquestions) ? prev.completedquestions : []).map(progressQuestionId);
// //           const prevCorrect   = (Array.isArray(prev?.correctanswers) ? prev.correctanswers : []).map(progressQuestionId);
// //           const prevPoints    = typeof prev?.points === "number" ? prev.points : 0;
// //           const prevCompletedSet = new Set(prevCompleted);
// //           const deltaCompleted   = [...(completedByTopic.get(topic) ?? [])].map(progressQuestionId);
// //           const mergedCompleted  = [...new Set([...prevCompleted, ...deltaCompleted])];
// //           let mergedCorrect = [...prevCorrect];
// //           for (const qid of touchedIdsByTopic.get(topic) ?? []) {
// //             const u = snapshot.get(qid);
// //             if (!u) continue;
// //             if ((u.correct ?? []).map(progressQuestionId).includes(qid)) {
// //               if (!mergedCorrect.includes(qid)) mergedCorrect.push(qid);
// //             } else {
// //               mergedCorrect = mergedCorrect.filter((id) => id !== qid);
// //             }
// //           }
// //           const newlyCompleted = deltaCompleted.filter((id) => !prevCompletedSet.has(id));
// //           const pointsToAdd    = newlyCompleted.reduce((sum, id) => {
// //             const u = snapshot.get(id);
// //             return sum + (typeof u?.points === "number" ? u.points : 0);
// //           }, 0);
// //           return {
// //             user_id: userId, email: userEmail, topic, area,
// //             completedquestions: mergedCompleted, correctanswers: mergedCorrect, points: prevPoints + pointsToAdd,
// //           };
// //         });
// //         const { error: upsertErr } = await upsertUserProgress(supabase, upsertRows);
// //         if (upsertErr) throw upsertErr;
// //         await fetchUserProgress();
// //         saveOk = true;
// //         if (!silent) toast.success("Progress saved!", { duration: 2000 });
// //       } catch (e) {
// //         console.error("saveProgress:", e);
// //         toast.error("Failed to save progress. Retrying...");
// //         restoreSnapshot();
// //       } finally {
// //         isSavingProgressRef.current = false;
// //         if (saveOk && pendingRef.current.size > 0) queueMicrotask(() => saveProgress({ silent: true }));
// //       }
// //     },
// //     [fetchUserProgress, mergePendingIntoRef]
// //   );

// //   // ── answer handler (unchanged logic) ─────────────────────────────────────
// //   const handleAnswer = useCallback(
// //     (questionId, isCorrect, questionTopic) => {
// //       if (!userRef.current) { setShowAuthModal(true); return; }
// //       const qid   = progressQuestionId(questionId);
// //       if (!qid) return;
// //       const topic = questionTopic != null && String(questionTopic).trim() !== ""
// //         ? String(questionTopic).trim()
// //         : null;
// //       setProgress((prev) => {
// //         const completedSet     = new Set(prev.completed.map(progressQuestionId));
// //         const correctSet       = new Set(prev.correct.map(progressQuestionId));
// //         const alreadyCompleted = completedSet.has(qid);
// //         const wasCorrect       = correctSet.has(qid);
// //         const pointsDelta      = alreadyCompleted ? 0 : isCorrect ? 100 : 0;
// //         if (!alreadyCompleted) completedSet.add(qid);
// //         if (isCorrect) correctSet.add(qid); else correctSet.delete(qid);
// //         return {
// //           completed: Array.from(completedSet),
// //           correct:   Array.from(correctSet),
// //           points:    prev.points + pointsDelta - (wasCorrect && !isCorrect ? 100 : 0),
// //         };
// //       });
// //       pendingRef.current.set(qid, {
// //         completed: [qid], correct: isCorrect ? [qid] : [], points: isCorrect ? 100 : 0, topic,
// //       });
// //       if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
// //       saveProgressTimerRef.current = setTimeout(() => saveProgress(), 1500);
// //     },
// //     [setShowAuthModal, saveProgress]
// //   );

// //   // ── difficulty / routing (unchanged) ─────────────────────────────────────
// //   useLayoutEffect(() => {
// //     if (typeof window === "undefined" || !category || !normalizedChapter) return;
// //     if (parseDifficultyParam(searchParams)) return;
// //     try {
// //       const saved = sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
// //       if (saved && DIFFICULTIES.includes(saved) && saved !== "easy") {
// //         const params = new URLSearchParams(searchParams.toString());
// //         params.set("difficulty", saved);
// //         router.replace(`${pathname}?${params.toString()}`, { scroll: false });
// //       }
// //     } catch (_) {}
// //   }, [category, normalizedChapter, pathname, router, searchParams]);

// //   useEffect(() => {
// //     try { sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty); } catch (_) {}
// //   }, [activeDifficulty]);

// //   const handleDifficultyChange = useCallback(
// //     (difficulty) => {
// //       if (difficulty === activeDifficulty || isLoadingQuestions) return;
// //       setCurrentPage(1);
// //       setHasMore(true);
// //       const params = new URLSearchParams(searchParams.toString());
// //       params.set("difficulty", difficulty);
// //       router.replace(`${pathname}?${params.toString()}`, { scroll: false });
// //     },
// //     [activeDifficulty, isLoadingQuestions, router, searchParams, pathname]
// //   );

// //   // ── NEW: question navigation ──────────────────────────────────────────────
// //   const navigateQuestion = useCallback((direction) => {
// //     if (isAnimating) return;
// //     const total = questions.length;
// //     if (direction === "next") {
// //       if (currentQuestionIndex >= total - 1) { setShowSummary(true); return; }
// //       setSlideDirection("next");
// //     } else {
// //       if (currentQuestionIndex <= 0) return;
// //       setSlideDirection("prev");
// //     }
// //     setIsAnimating(true);
// //     setTimeout(() => {
// //       setCurrentQuestionIndex((i) => direction === "next" ? i + 1 : i - 1);
// //       setIsAnimating(false);
// //     }, 180);
// //   }, [isAnimating, questions.length, currentQuestionIndex]);

// //   const handleKeyNav = useCallback((e) => {
// //     if (e.key === "ArrowRight" || e.key === "ArrowDown") navigateQuestion("next");
// //     if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   navigateQuestion("prev");
// //   }, [navigateQuestion]);

// //   useEffect(() => {
// //     window.addEventListener("keydown", handleKeyNav);
// //     return () => window.removeEventListener("keydown", handleKeyNav);
// //   }, [handleKeyNav]);

// //   // ── effects: data loading (unchanged) ────────────────────────────────────
// //   useEffect(() => {
// //     if (!category || !normalizedChapter) return;
// //     let cancelled = false;
// //     const load = async () => {
// //       setIsLoading(true);
// //       setCurrentPage(1);
// //       setHasMore(true);
// //       try {
// //         await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty, 1, false)]);
// //       } finally {
// //         if (!cancelled) setIsLoading(false);
// //       }
// //     };
// //     load();
// //     return () => { cancelled = true; };
// //   }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

// //   useEffect(() => { fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);
// //   useEffect(() => {
// //     if (!user?.id || !questions.length) return;
// //     fetchUserProgress();
// //   }, [user, questions, fetchUserProgress]);

// //   useEffect(() => {
// //     const flush = () => {
// //       if (pendingRef.current.size > 0 && userRef.current) saveProgress();
// //     };
// //     window.addEventListener("beforeunload", flush);
// //     return () => {
// //       window.removeEventListener("beforeunload", flush);
// //       if (saveProgressTimerRef.current) clearTimeout(saveProgressTimerRef.current);
// //       flush();
// //     };
// //   }, [saveProgress]);

// //   // ── admin: rewrite (unchanged) ────────────────────────────────────────────
// //   const extractRewrittenStem = useCallback((content) => {
// //     if (!content) return null;
// //     let text = String(content).trim();
// //     text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""));
// //     text = text.replace(/^["'\s]*Question\s*:\s*/i, "").trim();
// //     const stop = /(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(text);
// //     if (stop?.index > 0) text = text.slice(0, stop.index).trim();
// //     text = (text.split(/\n\s*\n/)[0] ?? text).trim();
// //     return text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;
// //   }, []);

// //   const rewriteQuestionInDb = useCallback(
// //     async (question) => {
// //       if (!isAdmin || !question?._id || rewritingId) return;
// //       setRewritingId(question._id);
// //       const tid = toast.loading("Rewriting question...");
// //       try {
// //         const stem = String(question.question ?? "").replace(/<\/?[^>]+(>|$)/g, " ").trim();
// //         if (!stem) throw new Error("empty stem");
// //         const resp = await fetch("/api/generate-similar", {
// //           method: "POST", headers: { "Content-Type": "application/json" },
// //           body: JSON.stringify({ mode: "rewrite-question", question: stem, maxTokens: 160 }),
// //         });
// //         if (!resp.ok) throw new Error(await resp.text());
// //         const rewritten = extractRewrittenStem((await resp.json())?.content);
// //         if (!rewritten) throw new Error("no rewritten text");
// //         const { error } = await supabase.from("examtracker").update({ question: rewritten }).eq("_id", question._id);
// //         if (error) throw error;
// //         setQuestions((prev) => prev.map((q) => (q?._id === question._id ? { ...q, question: rewritten } : q)));
// //         toast.success("Question rewritten & updated.", { id: tid });
// //       } catch (e) {
// //         console.error("rewrite:", e);
// //         toast.error("Failed to rewrite question.", { id: tid });
// //       } finally {
// //         setRewritingId(null);
// //       }
// //     },
// //     [extractRewrittenStem, isAdmin, rewritingId]
// //   );

// //   // ── derived stats ─────────────────────────────────────────────────────────
// //   const progressCompletedSet = useMemo(
// //     () => new Set((progress.completed ?? []).map(progressQuestionId)),
// //     [progress.completed]
// //   );
// //   const progressCorrectSet = useMemo(
// //     () => new Set((progress.correct ?? []).map(progressQuestionId)),
// //     [progress.correct]
// //   );

// //   const stats = useMemo(() => {
// //     const completed = questions.filter((q) => progressCompletedSet.has(progressQuestionId(q._id))).length;
// //     const correct   = questions.filter((q) => progressCorrectSet.has(progressQuestionId(q._id))).length;
// //     const total     = counts[activeDifficulty] ?? 0;
// //     const totalAll  = totalQuestions || counts.easy + counts.medium + counts.hard;
// //     return {
// //       completed, correct, total, totalAll,
// //       completionPercentage: total ? Math.round((completed / total) * 100) : 0,
// //       accuracy:             completed ? Math.round((correct / completed) * 100) : 0,
// //       points:               progress.points,
// //     };
// //   }, [questions, progress, counts, activeDifficulty, totalQuestions]);

// //   const chapterName = useMemo(
// //     () => normalizedChapter?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? "",
// //     [normalizedChapter]
// //   );

// //   const currentQuestion = questions[currentQuestionIndex] ?? null;
// //   const totalLoaded     = questions.length;
// //   const diffCfg         = DIFFICULTY_CONFIG[activeDifficulty];

// //   // ── loading state ─────────────────────────────────────────────────────────
// //   if (isLoading) {
// //     return (
// //       <div className="min-h-screen bg-[#f8f7f4]">
// //         <MetaDataJobs
// //           seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
// //           seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
// //         />
// //         <Navbar />
// //         <div className="flex justify-center items-center min-h-[80vh]">
// //           <div className="text-center">
// //             <div className="w-10 h-10 border-[3px] border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto mb-4" />
// //             <p className="text-sm text-neutral-500 font-medium tracking-wide">Loading questions…</p>
// //           </div>
// //         </div>
// //       </div>
// //     );
// //   }

// //   // ── summary screen ────────────────────────────────────────────────────────
// //   if (showSummary) {
// //     const pct = stats.completionPercentage;
// //     const grade = pct >= 80 ? "Excellent" : pct >= 60 ? "Good" : pct >= 40 ? "Fair" : "Keep Practicing";
// //     return (
// //       <>
// //         <Navbar />
// //         <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center px-4 py-8">
// //           <MetaDataJobs
// //             seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
// //             seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
// //           />
// //           <div className="w-full max-w-md">
// //             <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
// //               {/* Banner */}
// //               <div className="bg-neutral-900 px-6 py-8 text-center">
// //                 <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
// //                   <BarChart2 className="w-8 h-8 text-white" />
// //                 </div>
// //                 <h2 className="text-2xl font-bold text-white mb-1">{grade}!</h2>
// //                 <p className="text-neutral-400 text-sm">{chapterName} · {activeDifficulty}</p>
// //               </div>

// //               {/* Stats grid */}
// //               <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100">
// //                 {[
// //                   ["Attempted",  stats.completed],
// //                   ["Correct",    stats.correct],
// //                   ["Accuracy",   `${stats.accuracy}%`],
// //                   ["Points",     stats.points],
// //                 ].map(([label, value]) => (
// //                   <div key={label} className="p-5 text-center">
// //                     <p className="text-2xl font-bold text-neutral-900">{value}</p>
// //                     <p className="text-xs text-neutral-500 mt-1">{label}</p>
// //                   </div>
// //                 ))}
// //               </div>

// //               {/* Actions */}
// //               <div className="p-4 flex flex-col gap-2">
// //                 <button
// //                   onClick={() => { setCurrentQuestionIndex(0); setShowSummary(false); }}
// //                   className="w-full py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors"
// //                 >
// //                   <RotateCcw className="w-4 h-4" /> Review Answers
// //                 </button>
// //                 <Link
// //                   href={`/${category}/${subject}/${chaptername}`}
// //                   className="w-full py-3 border border-neutral-200 text-neutral-700 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors"
// //                 >
// //                   <ArrowLeft className="w-4 h-4" /> Back to Chapter
// //                 </Link>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //         <Toaster position="bottom-right" />
// //       </>
// //     );
// //   }

// //   // ── main practice UI ──────────────────────────────────────────────────────
// //   return (
// //     <>
// //       <Navbar />
// //       <MetaDataJobs
// //         seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
// //         seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
// //       />

// //       {/* ── Page shell ── */}
// //       <div className="min-h-screen bg-[#f8f7f4] flex flex-col" style={{ paddingTop: "64px" }}>

// //         {/* ── Top bar ── */}
// //         <div className="bg-white border-b border-neutral-100 sticky top-[64px] z-20">
// //           <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
// //             <div className="flex items-center justify-between h-12">

// //               {/* Back + breadcrumb */}
// //               <div className="flex items-center gap-3 min-w-0">
// //                 <Link
// //                   href={`/${category}/${subject}/${chaptername}`}
// //                   className="flex-shrink-0 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500 hover:text-neutral-800"
// //                 >
// //                   <ChevronLeft className="w-4 h-4" />
// //                 </Link>
// //                 <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 min-w-0">
// //                   <span className="uppercase tracking-wider font-semibold text-neutral-600">{category}</span>
// //                   <span>·</span>
// //                   <span className="truncate text-neutral-500">{chapterName}</span>
// //                 </div>
// //               </div>

// //               {/* Progress counter */}
// //               <div className="flex items-center gap-3">
// //                 <span className="text-xs font-semibold text-neutral-500 tabular-nums">
// //                   <span className="text-neutral-900">{currentQuestionIndex + 1}</span>
// //                   <span className="text-neutral-300 mx-1">/</span>
// //                   <span>{stats.total || totalLoaded}</span>
// //                 </span>

// //                 {/* Difficulty selector — inline pills */}
// //                 <div className="hidden sm:flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-0.5">
// //                   {DIFFICULTIES.map((d) => (
// //                     <button
// //                       key={d}
// //                       onClick={() => handleDifficultyChange(d)}
// //                       disabled={isLoadingQuestions}
// //                       className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all disabled:opacity-40"
// //                       style={activeDifficulty === d
// //                         ? { background: DIFFICULTY_CONFIG[d].color, color: "#fff" }
// //                         : { color: "#6b7280" }
// //                       }
// //                     >
// //                       {d.charAt(0).toUpperCase() + d.slice(1)}
// //                       <span className="ml-1 opacity-60">·{counts[d]}</span>
// //                     </button>
// //                   ))}
// //                 </div>

// //                 {/* Mobile difficulty: compact tag */}
// //                 <button
// //                   onClick={() => setPanelOpen((v) => !v)}
// //                   className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors"
// //                   style={{ borderColor: diffCfg.border, background: diffCfg.bg, color: diffCfg.color }}
// //                 >
// //                   {activeDifficulty.charAt(0).toUpperCase() + activeDifficulty.slice(1)}
// //                 </button>
// //               </div>
// //             </div>

// //             {/* Segmented bar */}
// //             <div className="pb-2">
// //               <SegmentedProgress
// //                 total={stats.total || totalLoaded}
// //                 currentIndex={currentQuestionIndex}
// //                 progressCompletedSet={progressCompletedSet}
// //                 progressCorrectSet={progressCorrectSet}
// //                 questions={questions}
// //                 progressQuestionId={progressQuestionId}
// //               />
// //             </div>
// //           </div>

// //           {/* Mobile difficulty panel */}
// //           {panelOpen && (
// //             <div className="sm:hidden border-t border-neutral-100 bg-white px-4 py-3 flex gap-2">
// //               {DIFFICULTIES.map((d) => (
// //                 <button
// //                   key={d}
// //                   onClick={() => { handleDifficultyChange(d); setPanelOpen(false); }}
// //                   disabled={isLoadingQuestions}
// //                   className="flex-1 py-2 rounded-lg text-xs font-bold border transition-all disabled:opacity-40"
// //                   style={activeDifficulty === d
// //                     ? { background: DIFFICULTY_CONFIG[d].color, color: "#fff", borderColor: DIFFICULTY_CONFIG[d].color }
// //                     : { background: DIFFICULTY_CONFIG[d].bg, color: DIFFICULTY_CONFIG[d].color, borderColor: DIFFICULTY_CONFIG[d].border }
// //                   }
// //                 >
// //                   {d.charAt(0).toUpperCase() + d.slice(1)}
// //                   <span className="ml-1 opacity-70">({counts[d]})</span>
// //                 </button>
// //               ))}
// //             </div>
// //           )}
// //         </div>

// //         {/* ── Main content ── */}
// //         <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
// //           <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6 h-full">

// //             {/* ── Question area ── */}
// //             <div className="flex flex-col">

// //               {/* Question card wrapper with slide animation */}
// //               <div className="flex-1">
// //                 {isLoadingQuestions && questions.length === 0 ? (
// //                   <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 sm:p-8">
// //                     <QuestionSkeleton />
// //                   </div>
// //                 ) : currentQuestion ? (
// //                   <div
// //                     className="transition-all duration-180"
// //                     style={{
// //                       opacity:   isAnimating ? 0 : 1,
// //                       transform: isAnimating
// //                         ? `translateX(${slideDirection === "next" ? "-16px" : "16px"})`
// //                         : "translateX(0)",
// //                       transition: "opacity 0.18s ease, transform 0.18s ease",
// //                     }}
// //                   >
// //                     {/* Question meta chip */}
// //                     <div className="flex items-center gap-2 mb-3 flex-wrap">
// //                       <span
// //                         className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border"
// //                         style={{ background: diffCfg.bg, color: diffCfg.color, borderColor: diffCfg.border }}
// //                       >
// //                         {diffCfg.label}
// //                       </span>
// //                       {currentQuestion.topic && (
// //                         <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
// //                           <BookOpen className="w-3 h-3" />
// //                           {String(currentQuestion.topic).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
// //                         </span>
// //                       )}
// //                       {progressCompletedSet.has(progressQuestionId(currentQuestion._id)) && (
// //                         progressCorrectSet.has(progressQuestionId(currentQuestion._id))
// //                           ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
// //                               <CheckCircle2 className="w-3 h-3" /> Correct
// //                             </span>
// //                           : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
// //                               <XCircle className="w-3 h-3" /> Incorrect
// //                             </span>
// //                       )}
// //                     </div>

// //                     {/* Admin rewrite */}
// //                     {isAdmin && (
// //                       <div className="flex justify-end mb-2">
// //                         <button
// //                           onClick={() => rewriteQuestionInDb(currentQuestion)}
// //                           disabled={rewritingId === currentQuestion._id}
// //                           className="px-3 py-1 rounded-lg bg-white border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
// //                         >
// //                           {rewritingId === currentQuestion._id ? "Rewriting…" : "Rewrite (AI)"}
// //                         </button>
// //                       </div>
// //                     )}

// //                     {/* QuestionCard — unchanged component, same props */}
// //                     <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
// //                       <MathJaxContext config={mathJaxConfig}>
// //                         <MathJax>
// //                           <QuestionCard
// //                             category={category}
// //                             question={currentQuestion}
// //                             index={currentQuestionIndex}
// //                             onAnswer={(isCorrect) =>
// //                               handleAnswer(currentQuestion._id, isCorrect, currentQuestion.topic)
// //                             }
// //                             isCompleted={progressCompletedSet.has(progressQuestionId(currentQuestion._id))}
// //                             isCorrect={progressCorrectSet.has(progressQuestionId(currentQuestion._id))}
// //                             isAdmin={isAdmin}
// //                           />
// //                         </MathJax>
// //                       </MathJaxContext>
// //                     </div>
// //                   </div>
// //                 ) : (
// //                   <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-12 text-center">
// //                     <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
// //                       <BookOpen className="w-6 h-6 text-neutral-400" />
// //                     </div>
// //                     <h3 className="text-base font-semibold text-neutral-800 mb-1">No questions available</h3>
// //                     <p className="text-sm text-neutral-500">No {activeDifficulty} questions found for this chapter.</p>
// //                   </div>
// //                 )}
// //               </div>

// //               {/* ── Navigation controls ── */}
// //               {currentQuestion && (
// //                 <div className="flex items-center justify-between mt-4 gap-3">
// //                   <button
// //                     onClick={() => navigateQuestion("prev")}
// //                     disabled={currentQuestionIndex === 0 || isAnimating}
// //                     className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
// //                   >
// //                     <ArrowLeft className="w-4 h-4" /> Prev
// //                   </button>

// //                   {/* Dot indicators (mobile: compact) */}
// //                   <div className="flex items-center gap-1 overflow-hidden max-w-[160px] sm:max-w-xs">
// //                     {Array.from({ length: Math.min(totalLoaded, 7) }, (_, i) => {
// //                       const idx = Math.max(0, Math.min(currentQuestionIndex - 3, totalLoaded - 7)) + i;
// //                       if (idx >= totalLoaded) return null;
// //                       const q   = questions[idx];
// //                       const done = progressCompletedSet.has(progressQuestionId(q?._id));
// //                       const ok   = progressCorrectSet.has(progressQuestionId(q?._id));
// //                       return (
// //                         <button
// //                           key={idx}
// //                           onClick={() => { if (!isAnimating) { setSlideDirection(idx > currentQuestionIndex ? "next" : "prev"); setIsAnimating(true); setTimeout(() => { setCurrentQuestionIndex(idx); setIsAnimating(false); }, 180); } }}
// //                           className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-200"
// //                           style={{
// //                             background: idx === currentQuestionIndex
// //                               ? "#0f172a"
// //                               : done ? (ok ? "#16a34a" : "#ef4444") : "#d1d5db",
// //                             transform: idx === currentQuestionIndex ? "scale(1.3)" : "scale(1)",
// //                           }}
// //                         />
// //                       );
// //                     })}
// //                   </div>

// //                   <button
// //                     onClick={() => navigateQuestion("next")}
// //                     disabled={isAnimating}
// //                     className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm"
// //                   >
// //                     {currentQuestionIndex >= totalLoaded - 1 && !hasMore ? "Finish" : "Next"}
// //                     <ArrowRight className="w-4 h-4" />
// //                   </button>
// //                 </div>
// //               )}

// //               {/* Sign-in nudge (mobile only, compact) */}
// //               {!user && (
// //                 <div className="mt-4 lg:hidden flex items-center justify-between gap-3 bg-white rounded-xl border border-neutral-200 px-4 py-3 shadow-sm">
// //                   <p className="text-xs text-neutral-600 font-medium">Sign in to track your progress</p>
// //                   <button
// //                     onClick={() => setShowAuthModal(true)}
// //                     className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 whitespace-nowrap"
// //                   >Sign In</button>
// //                 </div>
// //               )}
// //             </div>

// //             {/* ── Right sidebar (desktop only) ── */}
// //             <div className="hidden lg:flex flex-col gap-4">

// //               {/* Chapter info */}
// //               <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
// //                 <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Chapter</p>
// //                 <h2 className="text-base font-bold text-neutral-900 leading-snug mb-1">{chapterName}</h2>
// //                 <p className="text-xs text-neutral-400 uppercase tracking-wide font-semibold">{category}</p>
// //               </div>

// //               {/* Stats card */}
// //               <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
// //                 <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Your Progress</p>
// //                 <div className="space-y-4">
// //                   {/* Completion ring-style bar */}
// //                   <div>
// //                     <div className="flex justify-between text-xs mb-1.5">
// //                       <span className="text-neutral-600 font-medium">Completion</span>
// //                       <span className="font-bold text-neutral-900">{stats.completionPercentage}%</span>
// //                     </div>
// //                     <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
// //                       <div
// //                         className="h-full rounded-full transition-all duration-500"
// //                         style={{ width: `${stats.completionPercentage}%`, background: "#0f172a" }}
// //                       />
// //                     </div>
// //                   </div>

// //                   <div className="grid grid-cols-2 gap-3">
// //                     {[
// //                       ["Correct",  stats.correct,   "#16a34a"],
// //                       ["Accuracy", `${stats.accuracy}%`, "#2563eb"],
// //                     ].map(([label, value, color]) => (
// //                       <div key={label} className="bg-neutral-50 rounded-xl p-3 text-center">
// //                         <p className="text-lg font-bold" style={{ color }}>{value}</p>
// //                         <p className="text-[10px] text-neutral-500 font-medium mt-0.5">{label}</p>
// //                       </div>
// //                     ))}
// //                   </div>

// //                   <div className="flex items-center justify-between bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
// //                     <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
// //                       <Zap className="w-3.5 h-3.5" /> Points
// //                     </span>
// //                     <span className="text-sm font-bold text-amber-800">{stats.points}</span>
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Difficulty counts */}
// //               <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5">
// //                 <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3">Difficulty</p>
// //                 <div className="space-y-2">
// //                   {DIFFICULTIES.map((d) => {
// //                     const cfg = DIFFICULTY_CONFIG[d];
// //                     return (
// //                       <button
// //                         key={d}
// //                         onClick={() => handleDifficultyChange(d)}
// //                         disabled={isLoadingQuestions}
// //                         className="w-full flex items-center justify-between px-3 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40"
// //                         style={activeDifficulty === d
// //                           ? { background: cfg.color, color: "#fff", borderColor: cfg.color }
// //                           : { background: cfg.bg, color: cfg.color, borderColor: cfg.border }
// //                         }
// //                       >
// //                         <span>{cfg.label}</span>
// //                         <span className="text-xs font-medium opacity-80">{counts[d]} questions</span>
// //                       </button>
// //                     );
// //                   })}
// //                 </div>
// //               </div>

// //               {/* Sign-in card */}
// //               {!user && (
// //                 <div className="bg-neutral-900 rounded-2xl p-5 text-white">
// //                   <p className="text-sm font-bold mb-1">Track your progress</p>
// //                   <p className="text-xs text-neutral-400 mb-4">Sign in to save answers and see your improvement over time.</p>
// //                   <button
// //                     onClick={() => setShowAuthModal(true)}
// //                     className="w-full py-2.5 bg-white text-neutral-900 rounded-xl text-sm font-bold hover:bg-neutral-100 transition-colors"
// //                   >Sign In</button>
// //                 </div>
// //               )}

// //               {/* Keyboard hint */}
// //               <div className="text-center">
// //                 <p className="text-[10px] text-neutral-400">
// //                   Use <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono text-[10px]">←</kbd>{" "}
// //                   <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-mono text-[10px]">→</kbd> to navigate
// //                 </p>
// //               </div>
// //             </div>

// //           </div>
// //         </div>
// //       </div>

// //       <Toaster position="bottom-right" />
// //     </>
// //   );
// // });

// // ChapterPracticePage.displayName = "ChapterPracticePage";
// // export default ChapterPracticePage;

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
// import {
//   readProgressBuffer,
//   writeProgressBuffer,
//   clearProgressBuffer,
//   saveProgressBufferToSupabase,
// } from "@/lib/progressBuffer";
// import toast, { Toaster } from "react-hot-toast";
// import {
//   Clock, ArrowLeft, ChevronLeft, ChevronRight,
//   CheckCircle2, XCircle, BookOpen, Target, Zap, Award,
//   LayoutGrid, X, ChevronUp,
// } from "lucide-react";

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

// const ADMIN_EMAIL            = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
// const QUESTIONS_PER_PAGE     = 10;
// const DIFFICULTIES           = ["easy", "medium", "hard"];
// const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

// const parseDifficultyParam   = (sp) => {
//   if (!sp) return null;
//   const d = String(sp.get("difficulty") ?? "").toLowerCase();
//   return DIFFICULTIES.includes(d) ? d : null;
// };
// const normalizeChapterName   = (name) =>
//   name ? name.toLowerCase().trim().replace(/\s+/g, " ").replace(/-/g, " ") : "";
// const chapterNamesMatch      = (a, b) =>
//   normalizeChapterName(a) === normalizeChapterName(b);
// const progressQuestionId     = (id) => (id == null ? "" : String(id));
// const getChapterCandidates   = (chapter) => {
//   const ch = chapter ?? "";
//   return Array.from(
//     new Set(
//       [ch, ch.trim(), ch.replace(/-/g, " "), normalizeChapterName(ch),
//         normalizeChapterName(ch).replace(/\s+/g, "-")].filter(Boolean)
//     )
//   );
// };

// const DIFF_CONFIG = {
//   easy:   { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  dot: "bg-emerald-500",  activeBg: "bg-emerald-600",  activeText: "text-white" },
//   medium: { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200",    dot: "bg-amber-500",    activeBg: "bg-amber-500",    activeText: "text-white" },
//   hard:   { bg: "bg-rose-50",     text: "text-rose-700",     border: "border-rose-200",     dot: "bg-rose-500",     activeBg: "bg-rose-600",     activeText: "text-white" },
// };

// const globalStyles = `
//   @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

//   :root {
//     --surface:   #fafaf9;
//     --card:      #ffffff;
//     --border:    #e8e5e0;
//     --border-md: #d4cfc9;
//     --text-1:    #1a1917;
//     --text-2:    #57534e;
//     --text-3:    #a8a29e;
//     --accent:    #1a1917;
//     --accent-fg: #ffffff;
//     --radius:    14px;
//     --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
//     --shadow-md: 0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05);
//     --shadow-lg: 0 12px 40px rgba(0,0,0,.10), 0 4px 12px rgba(0,0,0,.06);
//     --font-sans: 'DM Sans', sans-serif;
//     --font-display: 'Instrument Serif', serif;
//     --nav-h: 64px;

//     /* status colors */
//     --correct-bg:   #ecfdf5;
//     --correct-fg:   #059669;
//     --correct-bdr:  #059669;
//     --wrong-bg:     #fef2f2;
//     --wrong-fg:     #dc2626;
//     --wrong-bdr:    #dc2626;
//     --pending-bg:   #fefce8;
//     --pending-fg:   #ca8a04;
//     --pending-bdr:  #fbbf24;
//   }

//   /* Mobile navbar is taller (logo row + menu) → prevent sticky header clipping */
//   @media (max-width: 1023px) {
//     :root { --nav-h: 86px; }
//   }

//   .quiz-root * { box-sizing: border-box; }
//   .quiz-root { font-family: var(--font-sans); background: var(--surface); min-height: 100svh; }
//   .quiz-root button { font-family: var(--font-sans); }
//   .quiz-root a { color: inherit; }

//   /* Sticky header uses CSS var (no hardcoded inline top) */
//   .practice-topbar {
//     position: sticky;
//     top: var(--nav-h);
//     z-index: 40;
//   }

//   /* Mobile difficulty bar (always visible under header) */
//   .practice-diffbar {
//     display: none;
//     gap: 8px;
//     overflow-x: auto;
//     padding: 2px 2px 0;
//     -webkit-overflow-scrolling: touch;
//   }
//   .practice-diffbar::-webkit-scrollbar { height: 4px; }
//   .practice-diffbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }

//   .diff-pill {
//     display: inline-flex;
//     align-items: center;
//     gap: 7px;
//     padding: 8px 12px;
//     border-radius: 999px;
//     border: 1.5px solid var(--border);
//     font-size: 0.78rem;
//     font-weight: 700;
//     white-space: nowrap;
//     flex-shrink: 0;
//     transition: all .15s;
//   }
//   .diff-dot { width: 7px; height: 7px; border-radius: 99px; flex-shrink: 0; }
//   .diff-count {
//     font-size: 0.74rem;
//     font-weight: 800;
//     padding: 1px 8px;
//     border-radius: 999px;
//     background: rgba(0,0,0,.08);
//   }
//   .diff-pill.active .diff-count { background: rgba(255,255,255,.18); }

//   @media (max-width: 1023px) {
//     .practice-diffbar { display: flex; }
//   }
//   @media (min-width: 1024px) {
//     .practice-diffbar { display: none !important; }
//   }

//   /* consistent interactive controls */
//   .btn {
//     display: inline-flex; align-items: center; justify-content: center; gap: 8px;
//     border-radius: 10px; padding: 9px 14px;
//     border: 1.5px solid var(--border);
//     background: var(--card);
//     color: var(--text-1);
//     font-weight: 600;
//     font-size: 0.85rem;
//     transition: transform .08s, background .15s, border-color .15s, box-shadow .15s, opacity .15s;
//     box-shadow: var(--shadow-sm);
//   }
//   .btn:hover:not(:disabled) { border-color: var(--border-md); background: #f5f4f2; box-shadow: var(--shadow-md); transform: translateY(-1px); }
//   .btn:active:not(:disabled) { transform: translateY(0); }
//   .btn:disabled { opacity: .6; cursor: not-allowed; box-shadow: none; }

//   .btn-primary { background: #1a1917; border-color: #1a1917; color: #fff; }
//   .btn-primary:hover:not(:disabled) { background: #0f0e0d; border-color: #0f0e0d; }
//   .btn-ghost { background: var(--card); color: var(--text-2); border-color: var(--border-md); }
//   .btn-ghost:disabled {
//     opacity: 1;
//     background: #f5f4f2;
//     border-color: #cfc9c2;
//     color: #57534e;
//     box-shadow: none;
//   }

//   /* Practice page: avoid cramped / overlapping sticky header on small screens */
//   .practice-topbar-inner {
//     max-width: 1200px;
//     margin: 0 auto;
//     padding: 10px 16px;
//     display: flex;
//     flex-direction: column;
//     gap: 10px;
//   }
//   .practice-topbar-row1 {
//     display: flex;
//     align-items: flex-start;
//     gap: 10px;
//     width: 100%;
//     min-width: 0;
//   }
//   .practice-breadcrumb {
//     flex: 1;
//     min-width: 0;
//     display: flex;
//     align-items: center;
//     gap: 6px;
//   }
//   .practice-topbar-row2 {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     gap: 10px;
//     flex-wrap: wrap;
//     width: 100%;
//   }
//   .practice-topbar-mid {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     flex: 1;
//     min-width: 0;
//   }
//   .practice-topbar-actions {
//     display: flex;
//     align-items: center;
//     gap: 8px;
//     flex-shrink: 0;
//   }
//   /* One Save CTA: desktop = header; mobile = progress card only */
//   @media (max-width: 1023px) {
//     .save-in-header { display: none !important; }
//   }
//   @media (min-width: 1024px) {
//     .practice-topbar-inner {
//       flex-direction: row;
//       flex-wrap: wrap;
//       align-items: center;
//       gap: 10px 12px;
//     }
//     .practice-topbar-row1 { flex: 1 1 220px; min-width: 0; }
//     .practice-topbar-row2 {
//       flex: 1 1 auto;
//       justify-content: flex-end;
//       width: auto;
//     }
//   }

//   /* Mobile uses fixed bottom bar for prev/next — hide duplicate footer inside card */
//   @media (max-width: 1023px) {
//     .question-card-nav-footer { display: none !important; }
//   }

//   @keyframes slideIn  { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
//   @keyframes slideOut { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(-24px); } }
//   @keyframes fadeUp   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
//   @keyframes sheetUp  { from { transform: translateY(100%); } to { transform: translateY(0); } }
//   @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

//   .q-enter { animation: slideIn .28s cubic-bezier(.22,.68,0,1.2) forwards; }
//   .q-exit  { animation: slideOut .18s ease-in forwards; }
//   .progress-fill { transition: width .6s cubic-bezier(.22,.68,0,1.2); }

//   /* answer option states */
//   .opt-btn {
//     position: relative; width: 100%; text-align: left;
//     padding: 14px 18px; border-radius: 12px; cursor: pointer;
//     border: 1.5px solid var(--border); background: var(--card);
//     transition: border-color .15s, background .15s, box-shadow .15s, transform .1s;
//     font-family: var(--font-sans); font-size: 0.925rem; color: var(--text-1);
//     display: flex; align-items: flex-start; gap: 12px;
//     box-shadow: var(--shadow-sm);
//   }
//   .opt-btn:hover:not(:disabled) { border-color: var(--border-md); background: #f5f4f2; transform: translateY(-1px); box-shadow: var(--shadow-md); }
//   .opt-btn:active:not(:disabled) { transform: translateY(0); }
//   .opt-btn:disabled { cursor: default; }
//   .opt-btn.selected  { border-color: #1a1917; background: #1a1917; color: #fff; box-shadow: var(--shadow-md); }
//   .opt-btn.correct   { border-color: #059669; background: #ecfdf5; color: #065f46; }
//   .opt-btn.incorrect { border-color: #dc2626; background: #fef2f2; color: #991b1b; }
//   .opt-btn .opt-label {
//     min-width: 26px; height: 26px; border-radius: 7px;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 0.8rem; font-weight: 600; flex-shrink: 0;
//     background: rgba(0,0,0,.06); transition: background .15s;
//   }
//   .opt-btn.selected .opt-label  { background: rgba(255,255,255,.18); }
//   .opt-btn.correct  .opt-label  { background: rgba(5,150,105,.15); color: #059669; }
//   .opt-btn.incorrect .opt-label { background: rgba(220,38,38,.12); color: #dc2626; }

//   /* sidebar scrollbar */
//   .q-sidebar::-webkit-scrollbar { width: 4px; }
//   .q-sidebar::-webkit-scrollbar-track { background: transparent; }
//   .q-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

//   @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
//   .skel { animation: pulse 1.8s ease-in-out infinite; background: #e8e5e0; border-radius: 8px; }

//   /* dot grid nav */
//   .dot-nav { display: flex; flex-wrap: wrap; gap: 6px; }
//   .dot {
//     width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid var(--border);
//     display: flex; align-items: center; justify-content: center;
//     font-size: 0.75rem; font-weight: 600; cursor: pointer;
//     transition: all .15s; color: var(--text-2); background: var(--card);
//     position: relative;
//   }
//   .dot:hover { border-color: var(--border-md); background: #f5f4f2; }
//   .dot.dot-current { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); box-shadow: 0 2px 8px rgba(0,0,0,.18); }
//   .dot.dot-correct  { background: var(--correct-bg); border-color: var(--correct-bdr); color: var(--correct-fg); }
//   .dot.dot-wrong    { background: var(--wrong-bg); border-color: var(--wrong-bdr); color: var(--wrong-fg); }

//   /* bottom sheet overlay */
//   .sheet-overlay {
//     position: fixed; inset: 0; background: rgba(0,0,0,.45);
//     z-index: 60; animation: overlayIn .2s ease forwards;
//     backdrop-filter: blur(2px);
//   }
//   .sheet-panel {
//     position: fixed; bottom: 0; left: 0; right: 0; z-index: 61;
//     background: var(--card); border-radius: 20px 20px 0 0;
//     animation: sheetUp .3s cubic-bezier(.22,.68,0,1.2) forwards;
//     max-height: 75svh; display: flex; flex-direction: column;
//     box-shadow: 0 -8px 40px rgba(0,0,0,.12);
//   }
//   .sheet-handle {
//     width: 36px; height: 4px; background: var(--border-md);
//     border-radius: 99px; margin: 10px auto 0;
//     flex-shrink: 0;
//   }
//   .sheet-body {
//     overflow-y: auto; padding: 0 18px 18px; flex: 1;
//   }
//   .sheet-body::-webkit-scrollbar { width: 3px; }
//   .sheet-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

//   /* mobile bottom bar */
//   .mobile-bottom-bar {
//     position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
//     background: rgba(250,250,249,0.92);
//     backdrop-filter: blur(14px);
//     border-top: 1px solid var(--border);
//     padding: 10px 12px;
//     padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
//     display: none;
//   }
//   @media(max-width:1023px){ .mobile-bottom-bar { display: block; } }
//   @media(min-width:1024px){ .mobile-bottom-bar { display: none; } }

//   .mobile-bottom-inner {
//     max-width: 1200px;
//     margin: 0 auto;
//     display: flex;
//     align-items: center;
//     gap: 10px;
//   }

//   .mb-icon-btn {
//     width: 42px; height: 42px;
//     border-radius: 12px;
//     border: 1.5px solid var(--border);
//     background: var(--card);
//     color: var(--text-1);
//     box-shadow: var(--shadow-sm);
//     transition: all .15s;
//   }
//   .mb-icon-btn:disabled { opacity: .5; box-shadow: none; }

//   .mb-center {
//     flex: 1;
//     border-radius: 14px;
//     border: 1.5px solid var(--border);
//     background: var(--card);
//     box-shadow: var(--shadow-sm);
//     padding: 10px 12px;
//     display: flex;
//     align-items: center;
//     gap: 10px;
//     min-width: 0;
//     transition: all .15s;
//   }
//   .mb-center:active { transform: translateY(1px); }

//   /* status legend items */
//   .legend-item {
//     display: flex; align-items: center; gap: 5px;
//     font-size: 0.72rem; font-weight: 500; color: var(--text-2);
//   }
//   .legend-dot {
//     width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0;
//   }

//   @media(max-width:767px){
//     .opt-btn { padding: 12px 14px; font-size: 0.875rem; }
//   }

//   @keyframes spin { to { transform: rotate(360deg); } }

//   /* circular progress ring */
//   .ring-track { fill: none; stroke: var(--border); }
//   .ring-fill  { fill: none; stroke: #1a1917; stroke-linecap: round; transition: stroke-dashoffset .7s cubic-bezier(.22,.68,0,1.2); }
// `;

// // ─── sub-components ───────────────────────────────────────────────────────────

// const QuestionSkeleton = memo(() => (
//   <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//     <div className="skel" style={{ height: 24, width: "70%" }} />
//     <div className="skel" style={{ height: 20, width: "90%" }} />
//     {[1,2,3,4].map(i => <div key={i} className="skel" style={{ height: 52 }} />)}
//   </div>
// ));
// QuestionSkeleton.displayName = "QuestionSkeleton";

// const StatPill = memo(({ icon: Icon, label, value, accent }) => (
//   <div style={{
//     display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
//     background: accent ? "#1a1917" : "var(--card)",
//     border: `1.5px solid ${accent ? "#1a1917" : "var(--border)"}`,
//     borderRadius:10, boxShadow:"var(--shadow-sm)",
//   }}>
//     <Icon size={15} style={{ color: accent ? "#fff" : "var(--text-3)", flexShrink:0 }} />
//     <div>
//       <div style={{ fontSize:"0.68rem", color: accent ? "rgba(255,255,255,.6)" : "var(--text-3)", fontWeight:500, lineHeight:1 }}>{label}</div>
//       <div style={{ fontSize:"0.9rem", fontWeight:600, color: accent ? "#fff" : "var(--text-1)", lineHeight:1.4 }}>{value}</div>
//     </div>
//   </div>
// ));
// StatPill.displayName = "StatPill";

// const DiffTab = memo(({ difficulty, count, active, onClick, loading }) => {
//   const cfg = DIFF_CONFIG[difficulty];
//   return (
//     <button
//       onClick={onClick}
//       disabled={loading}
//       style={{
//         display:"flex", alignItems:"center", gap:6, padding:"8px 16px", marginTop:"20px",
//         borderRadius:10, border:"1.5px solid",
//         borderColor: active ? "transparent" : cfg.border,
//         background: active ? (difficulty==="easy"?"#059669":difficulty==="medium"?"#d97706":"#dc2626") : cfg.bg,
//         color: active ? "#fff" : cfg.text,
//         fontFamily:"var(--font-sans)", fontWeight:500, fontSize:"0.85rem",
//         cursor: loading ? "not-allowed" : "pointer",
//         opacity: loading ? 0.5 : 1,
//         transition:"all .15s", whiteSpace:"nowrap",
//       }}
//     >
//       <span style={{ width:7, height:7, borderRadius:"50%", background: active ? "rgba(255,255,255,.6)" : cfg.dot, flexShrink:0 }} />
//       <span style={{ textTransform:"capitalize" }}>{difficulty}</span>
//       <span style={{
//         background: active ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.08)",
//         borderRadius:6, padding:"1px 7px", fontSize:"0.75rem", fontWeight:600,
//       }}>{count ?? 0}</span>
//     </button>
//   );
// });
// DiffTab.displayName = "DiffTab";

// // Mobile-only compact difficulty pills (no marginTop, fits under sticky header)
// const DiffPill = memo(({ difficulty, count, active, onClick, loading }) => {
//   const cfg = DIFF_CONFIG[difficulty];
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       disabled={loading}
//       className={`diff-pill ${active ? "active" : ""}`}
//       style={{
//         borderColor: active ? "transparent" : cfg.border,
//         background: active
//           ? (difficulty==="easy"?"#059669":difficulty==="medium"?"#d97706":"#dc2626")
//           : cfg.bg,
//         color: active ? "#fff" : cfg.text,
//       }}
//     >
//       <span className="diff-dot" style={{ background: active ? "rgba(255,255,255,.65)" : cfg.dot }} />
//       <span style={{ textTransform:"capitalize" }}>{difficulty}</span>
//       <span className="diff-count">{count ?? 0}</span>
//     </button>
//   );
// });
// DiffPill.displayName = "DiffPill";

// // ── Circular progress ring ────────────────────────────────────────────────────
// const CircleProgress = memo(({ pct, size=44, stroke=3.5 }) => {
//   const r = (size - stroke * 2) / 2;
//   const circ = 2 * Math.PI * r;
//   const offset = circ - (pct / 100) * circ;
//   return (
//     <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
//       <circle className="ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} />
//       <circle className="ring-fill"  cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
//         strokeDasharray={circ} strokeDashoffset={offset} />
//     </svg>
//   );
// });
// CircleProgress.displayName = "CircleProgress";

// // ── Question Status Badge ─────────────────────────────────────────────────────
// const QStatusBadge = memo(({ completed, correct }) => {
//   if (!completed) return (
//     <span style={{ fontSize:"0.65rem", fontWeight:600, padding:"2px 7px", borderRadius:5,
//       background:"#f5f4f2", color:"var(--text-3)", border:"1px solid var(--border)" }}>
//       Not attempted
//     </span>
//   );
//   if (correct) return (
//     <span style={{ fontSize:"0.65rem", fontWeight:600, padding:"2px 7px", borderRadius:5,
//       background:"var(--correct-bg)", color:"var(--correct-fg)", border:"1px solid var(--correct-bdr)" }}>
//       ✓ Correct
//     </span>
//   );
//   return (
//     <span style={{ fontSize:"0.65rem", fontWeight:600, padding:"2px 7px", borderRadius:5,
//       background:"var(--wrong-bg)", color:"var(--wrong-fg)", border:"1px solid var(--wrong-bdr)" }}>
//       ✗ Wrong
//     </span>
//   );
// });
// QStatusBadge.displayName = "QStatusBadge";

// // ── Bottom Sheet (mobile question navigator) ──────────────────────────────────
// const QuestionSheet = memo(({ questions, currentIndex, progressCompletedSet, progressCorrectSet,
//   onSelect, onClose, stats, hasMore }) => {

//   const correctCount   = questions.filter(q => progressCorrectSet.has(progressQuestionId(q._id))).length;
//   const wrongCount     = questions.filter(q => {
//     const id = progressQuestionId(q._id);
//     return progressCompletedSet.has(id) && !progressCorrectSet.has(id);
//   }).length;
//   const pendingCount   = questions.filter(q => !progressCompletedSet.has(progressQuestionId(q._id))).length;

//   // scroll current into view in the sheet
//   const currentRef = useRef(null);
//   useEffect(() => {
//     currentRef.current?.scrollIntoView({ behavior:"smooth", block:"nearest" });
//   }, [currentIndex]);

//   return (
//     <>
//       <div className="sheet-overlay" onClick={onClose} />
//       <div className="sheet-panel">
//         <div className="sheet-handle" />

//         {/* sheet header */}
//         <div style={{ padding:"14px 18px 10px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
//           <div>
//             <h3 style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"1.1rem", color:"var(--text-1)", margin:0 }}>
//               Question Navigator
//             </h3>
//             <p style={{ fontSize:"0.75rem", color:"var(--text-3)", margin:"2px 0 0", fontWeight:500 }}>
//               {questions.length}{hasMore ? "+" : ""} questions loaded
//             </p>
//           </div>
//           <button onClick={onClose} style={{ background:"var(--surface)", border:"1.5px solid var(--border)", borderRadius:9, width:34, height:34, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
//             <X size={16} style={{ color:"var(--text-2)" }} />
//           </button>
//         </div>

//         {/* legend */}
//         <div style={{ padding:"0 18px 12px", display:"flex", gap:12, flexShrink:0, flexWrap:"wrap" }}>
//           <div className="legend-item">
//             <div className="legend-dot" style={{ background:"var(--correct-bg)", border:"1.5px solid var(--correct-bdr)" }} />
//             Correct <strong style={{ color:"var(--correct-fg)", marginLeft:2 }}>{correctCount}</strong>
//           </div>
//           <div className="legend-item">
//             <div className="legend-dot" style={{ background:"var(--wrong-bg)", border:"1.5px solid var(--wrong-bdr)" }} />
//             Wrong <strong style={{ color:"var(--wrong-fg)", marginLeft:2 }}>{wrongCount}</strong>
//           </div>
//           <div className="legend-item">
//             <div className="legend-dot" style={{ background:"#f5f4f2", border:"1.5px solid var(--border)" }} />
//             Pending <strong style={{ color:"var(--text-2)", marginLeft:2 }}>{pendingCount}</strong>
//           </div>
//         </div>

//         {/* separator */}
//         <div style={{ height:1, background:"var(--border)", flexShrink:0 }} />

//         {/* dot grid */}
//         <div className="sheet-body" style={{ paddingTop:16 }}>
//           <div className="dot-nav">
//             {questions.map((q, i) => {
//               const qid     = progressQuestionId(q._id);
//               const isComp  = progressCompletedSet.has(qid);
//               const isCorr  = progressCorrectSet.has(qid);
//               const isCur   = i === currentIndex;
//               return (
//                 <div
//                   key={q._id}
//                   ref={isCur ? currentRef : null}
//                   className={`dot ${isCur ? "dot-current" : isComp ? (isCorr ? "dot-correct" : "dot-wrong") : ""}`}
//                   onClick={() => { onSelect(i); onClose(); }}
//                   title={`Q${i+1}${isComp ? (isCorr ? " · Correct" : " · Wrong") : " · Pending"}`}
//                   style={{ position:"relative" }}
//                 >
//                   {i + 1}
//                   {/* small dot indicator in corner */}
//                   {!isCur && isComp && (
//                     <span style={{
//                       position:"absolute", top:3, right:3,
//                       width:5, height:5, borderRadius:"50%",
//                       background: isCorr ? "var(--correct-fg)" : "var(--wrong-fg)",
//                     }} />
//                   )}
//                 </div>
//               );
//             })}
//           </div>

//           {/* section headers: highlight first unattempted */}
//           {(() => {
//             const firstPending = questions.findIndex(q => !progressCompletedSet.has(progressQuestionId(q._id)));
//             if (firstPending === -1 || questions.length === 0) return null;
//             return (
//               <div style={{ marginTop:16, padding:"10px 14px", background:"var(--pending-bg)", border:"1px solid var(--pending-bdr)", borderRadius:10 }}>
//                 <p style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--pending-fg)", margin:0 }}>
//                   ↑ First unattempted: Question {firstPending + 1}
//                 </p>
//                 <p style={{ fontSize:"0.72rem", color:"#92400e", margin:"2px 0 0" }}>
//                   Tap Q{firstPending + 1} above to jump there
//                 </p>
//               </div>
//             );
//           })()}
//         </div>
//       </div>
//     </>
//   );
// });
// QuestionSheet.displayName = "QuestionSheet";

// // ─── main component ───────────────────────────────────────────────────────────
// const ChapterPracticePage = memo(() => {
//   const mathJaxConfig = useMemo(() => ({
//     "fast-preview": { disabled: false },
//     tex: {
//       inlineMath:  [["$","$"],["\\(","\\)"]],
//       displayMath: [["$$","$$"],["\\[","\\]"]],
//       processEscapes: true,
//     },
//     messageStyle: "none",
//     showMathMenu: false,
//   }), []);

//   const { category, subject, chaptername } = useParams();
//   const router       = useRouter();
//   const searchParams = useSearchParams();
//   const pathname     = usePathname();
//   const { user, setShowAuthModal } = useAuth();

//   const userRef              = useRef(user);
//   const categoryRef          = useRef(category);
//   const normalizedChapterRef = useRef("");
//   const questionsRef         = useRef([]);
//   const isSavingProgressRef  = useRef(false);
//   const fetchAbortRef        = useRef(null);

//   // NEW: sheet state
//   const [sheetOpen, setSheetOpen] = useState(false);
//   const [unsavedCount, setUnsavedCount] = useState(0);
//   const [isManualSaving, setIsManualSaving] = useState(false);
//   const hasShownUnsavedToastRef = useRef(false);

//   useEffect(() => { userRef.current = user; },         [user]);
//   useEffect(() => { categoryRef.current = category; }, [category]);

//   const isAdmin = useMemo(
//     () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL, [user]
//   );

//   const normalizedChapter = useMemo(
//     () => (chaptername ? chaptername.replace(/-/g, " ") : ""), [chaptername]
//   );
//   useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

//   const activeDifficulty = useMemo(
//     () => parseDifficultyParam(searchParams) ?? "easy", [searchParams]
//   );

//   const [questions,          setQuestions]          = useState([]);
//   const [counts,             setCounts]             = useState({ easy:0, medium:0, hard:0 });
//   const [totalQuestions,     setTotalQuestions]     = useState(0);
//   const [isLoading,          setIsLoading]          = useState(true);
//   const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
//   const [progress,           setProgress]           = useState({ completed:[], correct:[], points:0 });
//   const [currentPage,        setCurrentPage]        = useState(1);
//   const [hasMore,            setHasMore]            = useState(true);
//   const [rewritingId,        setRewritingId]        = useState(null);

//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [animKey,      setAnimKey]      = useState(0);

//   useEffect(() => { questionsRef.current = questions; }, [questions]);

//   const fetchCounts = useCallback(async () => {
//     if (!category || !normalizedChapter) return;
//     try {
//       const res = await fetch(
//         `/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}`
//       );
//       if (!res.ok) throw new Error("counts fetch failed");
//       const r = await res.json();
//       setCounts({ easy: r.easy??0, medium: r.medium??0, hard: r.hard??0 });
//       setTotalQuestions(r.total??0);
//     } catch (e) {
//       console.error("fetchCounts:", e);
//       setCounts({ easy:0, medium:0, hard:0 });
//     }
//   }, [category, normalizedChapter]);

//   const fetchQuestions = useCallback(async (difficulty, page=1, append=false) => {
//     if (!normalizedChapter || !category) return;
//     if (fetchAbortRef.current) fetchAbortRef.current.abort();
//     const controller = new AbortController();
//     fetchAbortRef.current = controller;
//     setIsLoadingQuestions(true);
//     try {
//       const res = await fetch(
//         `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}&difficulty=${difficulty}&page=${page}&limit=${QUESTIONS_PER_PAGE}`,
//         { signal: controller.signal }
//       );
//       if (!res.ok) throw new Error("questions fetch failed");
//       const r  = await res.json();
//       const qs = r.questions ?? [];
//       setQuestions(prev => append ? [...prev, ...qs] : qs);
//       setHasMore(r.hasMore ?? false);
//       if (!append) setCurrentIndex(0);
//     } catch (e) {
//       if (e.name === "AbortError") return;
//       console.error("fetchQuestions:", e);
//       toast.error("Failed to load questions");
//       setQuestions([]);
//       setHasMore(false);
//     } finally {
//       setIsLoadingQuestions(false);
//     }
//   }, [category, normalizedChapter]);

//   const fetchUserProgress = useCallback(async () => {
//     const userId          = userRef.current?.id;
//     const currentCategory = categoryRef.current;
//     const currentChapter  = normalizedChapterRef.current;
//     if (!userId || !currentChapter || !currentCategory) {
//       setProgress({ completed:[], correct:[], points:0 });
//       return;
//     }
//     try {
//       const candidates    = getChapterCandidates(currentChapter);
//       const categoryUpper = currentCategory.toUpperCase();
//       const normChapter   = normalizeChapterName(currentChapter);
//       const { data: rows, error: rowErr } = await supabase
//         .from("examtracker").select("topic, chapter")
//         .eq("category", categoryUpper).in("chapter", candidates);
//       if (rowErr) throw rowErr;
//       const topicSet = new Set();
//       for (const r of rows ?? []) {
//         if (r?.topic && chapterNamesMatch(r.chapter, normChapter)) topicSet.add(String(r.topic).trim());
//       }
//       for (const q of questionsRef.current ?? []) {
//         if (q?.topic) topicSet.add(String(q.topic).trim());
//       }
//       const uniqueTopics = [...topicSet];
//       if (!uniqueTopics.length) { setProgress({ completed:[], correct:[], points:0 }); return; }
//       const area = currentCategory.toLowerCase();
//       const { data: progressData, error: progressError } = await supabase
//         .from("user_progress")
//         .select("completedquestions, correctanswers, points, topic")
//         .eq("user_id", userId).eq("area", area).in("topic", uniqueTopics);
//       if (progressError && progressError.code !== "PGRST116") throw progressError;
//       const completed = new Set(), correct = new Set();
//       let totalPoints = 0;
//       for (const item of progressData ?? []) {
//         (Array.isArray(item.completedquestions)?item.completedquestions:[]).forEach(id=>{const s=progressQuestionId(id);if(s)completed.add(s);});
//         (Array.isArray(item.correctanswers)?item.correctanswers:[]).forEach(id=>{const s=progressQuestionId(id);if(s)correct.add(s);});
//         totalPoints += typeof item.points==="number"?item.points:0;
//       }
//       setProgress({ completed:[...completed], correct:[...correct], points:totalPoints });
//     } catch (e) {
//       console.error("fetchUserProgress:", e);
//       setProgress({ completed:[], correct:[], points:0 });
//     }
//   }, []);

//   const refreshUnsavedCount = useCallback(() => {
//     const userId = userRef.current?.id;
//     if (!userId || typeof window === "undefined") { setUnsavedCount(0); return; }
//     const buffer = readProgressBuffer(userId);
//     const count = Object.keys(buffer.entries ?? {}).length;
//     setUnsavedCount(count);
//   }, []);

//   const saveBufferedProgress = useCallback(async () => {
//     const currentUser = userRef.current;
//     if (!currentUser?.id) { setShowAuthModal(true); return; }
//     const userId = currentUser.id;
//     if (Object.keys(readProgressBuffer(userId).entries ?? {}).length === 0) { setUnsavedCount(0); return; }

//     if (isSavingProgressRef.current) return;
//     setIsManualSaving(true);
//     isSavingProgressRef.current = true;
//     try {
//       await saveProgressBufferToSupabase({
//         supabase,
//         upsertUserProgress,
//         user: currentUser,
//         onMissingTopic: () => {},
//       });
//       await fetchUserProgress();
//       setUnsavedCount(0);
//     } catch (_) {
//       refreshUnsavedCount();
//     } finally {
//       isSavingProgressRef.current = false;
//       setIsManualSaving(false);
//     }
//   }, [fetchUserProgress, refreshUnsavedCount, setShowAuthModal]);

//   const handleAnswer = useCallback((questionId, isCorrect, questionTopic) => {
//     if (!userRef.current) { setShowAuthModal(true); return; }
//     const qid   = progressQuestionId(questionId);
//     if (!qid) return;
//     const topic = questionTopic!=null&&String(questionTopic).trim()!==""?String(questionTopic).trim():null;
//     setProgress(prev=>{
//       const completedSet=new Set(prev.completed.map(progressQuestionId));
//       const correctSet=new Set(prev.correct.map(progressQuestionId));
//       const alreadyCompleted=completedSet.has(qid);
//       const wasCorrect=correctSet.has(qid);
//       const pointsDelta=alreadyCompleted?0:isCorrect?100:0;
//       if(!alreadyCompleted) completedSet.add(qid);
//       if(isCorrect) correctSet.add(qid); else correctSet.delete(qid);
//       return { completed:[...completedSet], correct:[...correctSet], points:prev.points+pointsDelta-(wasCorrect&&!isCorrect?100:0) };
//     });

//     // buffer locally (cross-page) instead of saving per-click
//     try {
//       const userId = userRef.current?.id;
//       if (!userId) return;
//       const buffer = readProgressBuffer(userId);
//       const entries = buffer.entries ?? {};
//       entries[qid] = {
//         completed: true,
//         correct: !!isCorrect,
//         points: isCorrect ? 100 : 0,
//         topic,
//         area: (categoryRef.current ?? "").toLowerCase(),
//         updatedAt: Date.now(),
//       };
//       writeProgressBuffer(userId, { ...buffer, entries });
//       setUnsavedCount(Object.keys(entries).length);
//     } catch (_) {}
//   }, [setShowAuthModal]);

//   useLayoutEffect(() => {
//     if (typeof window==="undefined"||!category||!normalizedChapter) return;
//     if (parseDifficultyParam(searchParams)) return;
//     try {
//       const saved=sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
//       if (saved&&DIFFICULTIES.includes(saved)&&saved!=="easy") {
//         const params=new URLSearchParams(searchParams.toString());
//         params.set("difficulty",saved);
//         router.replace(`${pathname}?${params.toString()}`,{scroll:false});
//       }
//     } catch(_){}
//   }, [category, normalizedChapter, pathname, router, searchParams]);

//   useEffect(()=>{
//     try { sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty); } catch(_){}
//   }, [activeDifficulty]);

//   const handleDifficultyChange = useCallback((difficulty)=>{
//     if (difficulty===activeDifficulty||isLoadingQuestions) return;
//     setCurrentPage(1); setHasMore(true); setCurrentIndex(0);
//     const params=new URLSearchParams(searchParams.toString());
//     params.set("difficulty",difficulty);
//     router.replace(`${pathname}?${params.toString()}`,{scroll:false});
//   }, [activeDifficulty, isLoadingQuestions, router, searchParams, pathname]);

//   const navigateToIndex = useCallback((idx) => {
//     if (idx<0||idx>=questions.length) return;
//     setAnimKey(k=>k+1);
//     setCurrentIndex(idx);
//     if (idx>=questions.length-3 && hasMore && !isLoadingQuestions) {
//       const next=currentPage+1;
//       setCurrentPage(next);
//       fetchQuestions(activeDifficulty, next, true);
//     }
//   }, [questions.length, hasMore, isLoadingQuestions, currentPage, activeDifficulty, fetchQuestions]);

//   const goNext = useCallback(()=>navigateToIndex(currentIndex+1), [currentIndex, navigateToIndex]);
//   const goPrev = useCallback(()=>navigateToIndex(currentIndex-1), [currentIndex, navigateToIndex]);

//   useEffect(()=>{
//     const handler=(e)=>{
//       if (e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
//       if (e.key==="ArrowRight"||e.key==="ArrowDown") goNext();
//       if (e.key==="ArrowLeft"||e.key==="ArrowUp") goPrev();
//     };
//     window.addEventListener("keydown", handler);
//     return ()=>window.removeEventListener("keydown", handler);
//   }, [goNext, goPrev]);

//   useEffect(()=>{
//     if (!category||!normalizedChapter) return;
//     let cancelled=false;
//     const load=async()=>{
//       setIsLoading(true); setCurrentPage(1); setHasMore(true);
//       try { await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty,1,false)]); }
//       finally { if(!cancelled) setIsLoading(false); }
//     };
//     load();
//     return ()=>{ cancelled=true; };
//   }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

//   useEffect(()=>{ fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);
//   useEffect(()=>{ if(!user?.id||!questions.length) return; fetchUserProgress(); }, [user, questions, fetchUserProgress]);

//   // initialize unsaved count from local buffer
//   useEffect(() => { refreshUnsavedCount(); }, [user?.id, refreshUnsavedCount]);

//   // One-time UX hint if buffer exists (e.g. user returned later)
//   useEffect(() => {
//     if (!user?.id) return;
//     if (!unsavedCount) { hasShownUnsavedToastRef.current = false; return; }
//     if (hasShownUnsavedToastRef.current) return;
//     hasShownUnsavedToastRef.current = true;
//     toast("You have unsaved progress. Click “Save Progress” to sync it.", { duration: 3500 });
//   }, [user?.id, unsavedCount]);

//   // unsaved changes warning: tab close/refresh + internal navigation
//   useEffect(() => {
//     if (typeof window === "undefined") return;
//     if (!unsavedCount) return;

//     const warningText = "You have unsaved progress. Please save before leaving.";

//     const handleBeforeUnload = (e) => {
//       e.preventDefault();
//       e.returnValue = warningText;
//       return warningText;
//     };

//     const handleDocumentClickCapture = (e) => {
//       const a = e.target?.closest?.("a");
//       if (!a) return;
//       const href = a.getAttribute("href") || "";
//       if (!href) return;
//       if (href.startsWith("#")) return;
//       if (a.getAttribute("target") === "_blank") return;
//       if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

//       const ok = window.confirm(warningText);
//       if (!ok) {
//         e.preventDefault();
//         e.stopPropagation();
//       }
//     };

//     const handlePopState = () => {
//       const ok = window.confirm(warningText);
//       if (!ok) window.history.forward();
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);
//     document.addEventListener("click", handleDocumentClickCapture, true);
//     window.addEventListener("popstate", handlePopState);

//     return () => {
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//       document.removeEventListener("click", handleDocumentClickCapture, true);
//       window.removeEventListener("popstate", handlePopState);
//     };
//   }, [unsavedCount]);

//   // ── admin rewrite ─────────────────────────────────────────────────────────
//   const extractRewrittenStem = useCallback((content)=>{
//     if(!content) return null;
//     let text=String(content).trim();
//     text=text.replace(/```[\s\S]*?```/g,m=>m.replace(/```/g,""));
//     text=text.replace(/^["'\s]*Question\s*:\s*/i,"").trim();
//     const stop=/(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(text);
//     if(stop?.index>0) text=text.slice(0,stop.index).trim();
//     text=(text.split(/\n\s*\n/)[0]??text).trim();
//     return text.replace(/\s+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim()||null;
//   },[]);

//   const rewriteQuestionInDb = useCallback(async(question)=>{
//     if(!isAdmin||!question?._id||rewritingId) return;
//     setRewritingId(question._id);
//     const tid=toast.loading("Rewriting question...");
//     try {
//       const stem=String(question.question??"").replace(/<\/?[^>]+(>|$)/g," ").trim();
//       if(!stem) throw new Error("empty stem");
//       const resp=await fetch("/api/generate-similar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode:"rewrite-question",question:stem,maxTokens:160})});
//       if(!resp.ok) throw new Error(await resp.text());
//       const rewritten=extractRewrittenStem((await resp.json())?.content);
//       if(!rewritten) throw new Error("no rewritten text");
//       const { error }=await supabase.from("examtracker").update({question:rewritten}).eq("_id",question._id);
//       if(error) throw error;
//       setQuestions(prev=>prev.map(q=>q?._id===question._id?{...q,question:rewritten}:q));
//       toast.success("Question rewritten & updated.",{id:tid});
//     } catch(e) {
//       console.error("rewrite:",e);
//       toast.error("Failed to rewrite question.",{id:tid});
//     } finally { setRewritingId(null); }
//   }, [extractRewrittenStem, isAdmin, rewritingId]);

//   // ── derived stats ─────────────────────────────────────────────────────────
//   const savedCompletedSet = useMemo(
//     () => new Set((progress.completed ?? []).map(progressQuestionId)),
//     [progress.completed]
//   );
//   const savedCorrectSet = useMemo(
//     () => new Set((progress.correct ?? []).map(progressQuestionId)),
//     [progress.correct]
//   );

//   // Overlay buffered (unsaved) progress onto what we display for THIS page's loaded questions.
//   const bufferedOverlay = useMemo(() => {
//     const userId = user?.id;
//     if (!userId) return { completed: new Set(), correct: new Set(), pointsDelta: 0 };
//     const visibleIds = new Set((questions ?? []).map((q) => progressQuestionId(q?._id)).filter(Boolean));
//     if (!visibleIds.size) return { completed: new Set(), correct: new Set(), pointsDelta: 0 };

//     const area = String(category ?? "").toLowerCase();
//     const { entries } = readProgressBuffer(userId);
//     const overlayCompleted = new Set();
//     const overlayCorrect = new Set();
//     let pointsDelta = 0;

//     for (const [qidRaw, e] of Object.entries(entries ?? {})) {
//       const qid = progressQuestionId(qidRaw);
//       if (!qid || !visibleIds.has(qid)) continue;
//       if (String(e?.area ?? "") !== area) continue;

//       overlayCompleted.add(qid);
//       const isCorrect = e?.correct === true;
//       if (isCorrect) overlayCorrect.add(qid);

//       // Only count points for UI if this question wasn't already saved as completed
//       if (isCorrect && !savedCompletedSet.has(qid)) {
//         const pts = typeof e?.points === "number" ? e.points : 100;
//         pointsDelta += typeof pts === "number" ? pts : 0;
//       }
//     }

//     return { completed: overlayCompleted, correct: overlayCorrect, pointsDelta };
//   }, [user?.id, category, questions, unsavedCount, savedCompletedSet]);

//   const progressCompletedSet = useMemo(() => {
//     const merged = new Set(savedCompletedSet);
//     bufferedOverlay.completed.forEach((id) => merged.add(id));
//     return merged;
//   }, [savedCompletedSet, bufferedOverlay.completed]);

//   const progressCorrectSet = useMemo(() => {
//     const merged = new Set(savedCorrectSet);
//     // last-write-wins for questions visible on this page:
//     // if buffer says incorrect, remove from correct; if correct, add.
//     bufferedOverlay.completed.forEach((id) => {
//       if (bufferedOverlay.correct.has(id)) merged.add(id);
//       else merged.delete(id);
//     });
//     return merged;
//   }, [savedCorrectSet, bufferedOverlay.completed, bufferedOverlay.correct]);

//   const stats = useMemo(()=>{
//     const completed=questions.filter(q=>progressCompletedSet.has(progressQuestionId(q._id))).length;
//     const correct=questions.filter(q=>progressCorrectSet.has(progressQuestionId(q._id))).length;
//     const wrong = completed - correct;
//     const total=counts[activeDifficulty]??0;
//     const totalAll=totalQuestions||counts.easy+counts.medium+counts.hard;
//     return {
//       completed, correct, wrong,
//       pending: questions.length - completed,
//       total, totalAll,
//       completionPercentage: total?Math.round((completed/total)*100):0,
//       accuracy: completed?Math.round((correct/completed)*100):0,
//       points: progress.points + (bufferedOverlay.pointsDelta || 0),
//     };
//   }, [questions, progress, counts, activeDifficulty, totalQuestions, progressCompletedSet, progressCorrectSet, bufferedOverlay.pointsDelta]);

//   const chapterName = useMemo(
//     ()=>normalizedChapter?.replace(/\b\w/g,c=>c.toUpperCase())??"", [normalizedChapter]
//   );

//   const currentQuestion = questions[currentIndex];
//   const totalVisible    = questions.length;

//   // current question status
//   const curQid       = currentQuestion ? progressQuestionId(currentQuestion._id) : null;
//   const curCompleted = curQid ? progressCompletedSet.has(curQid) : false;
//   const curCorrect   = curQid ? progressCorrectSet.has(curQid) : false;

//   // ── loading screen ────────────────────────────────────────────────────────
//   if (isLoading) {
//     return (
//       <div className="quiz-root">
//         <style>{globalStyles}</style>
//         <MetaDataJobs
//           seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
//           seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
//         />
//         <Navbar />
//         <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"70vh", paddingTop:80 }}>
//           <div style={{ textAlign:"center" }}>
//             <div style={{ width:44, height:44, borderRadius:"50%", border:"3px solid #e8e5e0", borderTopColor:"#1a1917", animation:"spin 0.8s linear infinite", margin:"0 auto 20px" }} />
//             <p style={{ fontFamily:"var(--font-sans)", fontSize:"0.95rem", color:"var(--text-2)" }}>Loading questions…</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ── main render ───────────────────────────────────────────────────────────
//   return (
//     <>
//       <style>{globalStyles}</style>
//       <div className="quiz-root">
//         <MetaDataJobs
//           seoTitle={`${chapterName} ${category?.toUpperCase()} Chapter Practice`}
//           seoDescription={`Practice ${chapterName} chapter questions with detailed solutions.`}
//         />
//         <Navbar />

//         {/* ── mobile bottom sheet ── */}
//         {sheetOpen && (
//           <QuestionSheet
//             questions={questions}
//             currentIndex={currentIndex}
//             progressCompletedSet={progressCompletedSet}
//             progressCorrectSet={progressCorrectSet}
//             onSelect={navigateToIndex}
//             onClose={() => setSheetOpen(false)}
//             stats={stats}
//             hasMore={hasMore}
//           />
//         )}

//         {/* ── top bar ── */}
//         <div
//           className="practice-topbar"
//           style={{
//             background:"rgba(250,250,249,0.92)", backdropFilter:"blur(12px)",
//             borderBottom:"1px solid var(--border)",
//             paddingTop: "env(safe-area-inset-top, 0px)",
//             boxShadow:"0 1px 0 rgba(0,0,0,0.02)",
//           }}
//         >
//           <div className="practice-topbar-inner">

//             <div className="practice-topbar-row1">
//               <Link href={`/${category}/${subject}/${chaptername}`}
//                 className="btn btn-ghost"
//                 style={{ padding:"6px 10px", fontSize:"0.82rem", fontWeight:500, textDecoration:"none", flexShrink:0 }}
//               >
//                 <ArrowLeft size={13} /> Back
//               </Link>

//               <div className="practice-breadcrumb">
//                 <span style={{ fontSize:"0.75rem", color:"var(--text-3)", fontWeight:500, textTransform:"uppercase", letterSpacing:".06em", background:"var(--card)", border:"1px solid var(--border)", padding:"3px 8px", borderRadius:6, flexShrink:0 }}>
//                   {category?.toUpperCase()}
//                 </span>
//                 <span style={{ color:"var(--text-3)", fontSize:"0.75rem", flexShrink:0 }}>›</span>
//                 <span style={{
//                   fontSize:"0.82rem", color:"var(--text-1)", fontWeight:500, overflow:"hidden",
//                   display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", lineHeight:1.25,
//                   fontFamily:"var(--font-display)", fontStyle:"italic", minWidth:0,
//                 }}>
//                   {chapterName}
//                 </span>
//               </div>
//             </div>

//             <div className="practice-topbar-row2">
//               <div className="practice-topbar-mid">
//                 <span style={{ fontSize:"0.72rem", color:"var(--text-3)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", flexShrink:0 }}>This page</span>
//                 <span style={{ fontSize:"0.8rem", color:"var(--text-2)", fontWeight:600, flexShrink:0 }}>
//                   {currentIndex+1}<span style={{ color:"var(--text-3)", fontWeight:500 }}>/{totalVisible}</span>
//                 </span>
//                 <div style={{ flex:1, minWidth:48, maxWidth:120, height:5, background:"var(--border)", borderRadius:999, overflow:"hidden" }}>
//                   <div className="progress-fill" style={{
//                     height:"100%", borderRadius:999, background:"#1a1917",
//                     width:`${totalVisible?((currentIndex+1)/totalVisible)*100:0}%`
//                   }} />
//                 </div>
//               </div>

//               <div className="practice-topbar-actions">
//                 <div style={{
//                   display:"flex", alignItems:"center", gap:6, padding:"5px 12px",
//                   background:"#1a1917", borderRadius:8, color:"#fff", flexShrink:0
//                 }}>
//                   <Award size={13} style={{ opacity:.7 }} />
//                   <span style={{ fontSize:"0.8rem", fontWeight:600 }}>{stats.points} pts</span>
//                 </div>

//                 <button
//                   type="button"
//                   onClick={saveBufferedProgress}
//                   disabled={!user || unsavedCount === 0 || isManualSaving || isSavingProgressRef.current}
//                   className={`save-in-header btn ${unsavedCount > 0 ? "btn-primary" : "btn-ghost"}`}
//                   style={{ padding:"7px 12px", flexShrink:0, boxShadow:"var(--shadow-sm)" }}
//                   title={unsavedCount > 0 ? "Save buffered progress to your account" : "Nothing to save yet"}
//                 >
//                   <span style={{
//                     width:8, height:8, borderRadius:99,
//                     background: unsavedCount > 0 ? "rgba(255,255,255,.7)" : "var(--border-md)",
//                     flexShrink:0,
//                   }} />
//                   {isManualSaving ? "Saving…" : "Save"}
//                   {unsavedCount > 0 && (
//                     <span style={{
//                       marginLeft:2,
//                       padding:"1px 7px",
//                       borderRadius:999,
//                       background:"rgba(255,255,255,.18)",
//                       fontSize:"0.75rem",
//                       fontWeight:700,
//                     }}>
//                       {unsavedCount}
//                     </span>
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Mobile: difficulty selector lives in sticky header (so it never “disappears”) */}
//             <div className="practice-diffbar" aria-label="Difficulty">
//               {DIFFICULTIES.map((d) => (
//                 <DiffPill
//                   key={d}
//                   difficulty={d}
//                   count={counts[d]}
//                   active={activeDifficulty === d}
//                   loading={isLoadingQuestions}
//                   onClick={() => handleDifficultyChange(d)}
//                 />
//               ))}
//             </div>
//           </div>

//           {/* thin progress fill */}
//           <div style={{ height:2, background:"var(--border)" }}>
//             <div className="progress-fill" style={{
//               height:"100%", background:"#1a1917",
//               width:`${stats.completionPercentage}%`
//             }} />
//           </div>
//         </div>

//         {/* ── body layout ── */}
//         <div
//           style={{ maxWidth:1200, margin:"0 auto", padding:"20px 16px", paddingBottom:"130px", display:"grid", gridTemplateColumns:"1fr", gap:20 }}
//           className="main-grid"
//         >
//           <style>{`
//             @media(max-width:1023px){
//               .main-grid { gap: 22px !important; padding-left: 14px !important; padding-right: 14px !important; }
//             }
//             @media(min-width:1024px){
//               .main-grid { grid-template-columns: 280px 1fr !important; align-items: start; padding-bottom: 80px !important; }
//               .sidebar-col { display: flex !important; }
//               .diff-row { flex-direction: column !important; }
//             }
//             @media(min-width:768px) and (max-width:1023px){
//               .main-grid { grid-template-columns: 1fr !important; }
//             }
//           `}</style>

//           {/* ── sidebar (desktop) ── */}
//           <aside className="sidebar-col" style={{
//             display:"none", flexDirection:"column", gap:14,
//             position:"sticky", top:90, maxHeight:"calc(100svh - 110px)", overflow:"hidden"
//           }}>
//             {/* stats */}
//             <div style={{
//               background:"var(--card)", border:"1.5px solid var(--border)",
//               borderRadius:"var(--radius)", padding:"18px", boxShadow:"var(--shadow-sm)",
//             }}>
//               <p style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", color:"var(--text-3)", marginBottom:12 }}>
//                 Your Progress
//               </p>
//               <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
//                 <StatPill icon={Target} label="Completed" value={`${stats.completionPercentage}%`} accent />
//                 <StatPill icon={CheckCircle2} label="Correct" value={stats.correct} />
//                 <StatPill icon={Zap} label="Accuracy" value={`${stats.accuracy}%`} />
//                 <StatPill icon={Award} label="Points" value={stats.points} />
//               </div>

//               {/* Desktop: single Save lives in the sticky header — avoid duplicate button here */}
//               {user && (
//                 <p style={{ marginTop:12, fontSize:"0.72rem", color:"var(--text-3)", fontWeight:500, lineHeight:1.45 }}>
//                   {unsavedCount > 0 ? (
//                     <>
//                       <strong style={{ color:"var(--text-1)" }}>{unsavedCount} unsaved</strong>
//                       {" "}— use <strong style={{ color:"var(--text-1)" }}>Save</strong> in the top bar.
//                     </>
//                   ) : (
//                     "Progress is synced when you save from the top bar."
//                   )}
//                 </p>
//               )}
//             </div>

//             {/* difficulty */}
//             <div style={{
//               background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)",
//               padding:18, boxShadow:"var(--shadow-sm)",
//             }}>
//               <p style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", color:"var(--text-3)", marginBottom:12 }}>
//                 Difficulty
//               </p>
//               <div className="diff-row" style={{ display:"flex", gap:8, flexDirection:"column" }}>
//                 {DIFFICULTIES.map(d=>(
//                   <DiffTab key={d} difficulty={d} count={counts[d]} active={activeDifficulty===d}
//                     loading={isLoadingQuestions} onClick={()=>handleDifficultyChange(d)} />
//                 ))}
//               </div>
//             </div>

//             {/* question dot grid */}
//             {questions.length>0&&(
//               <div style={{
//                 background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)",
//                 padding:18, boxShadow:"var(--shadow-sm)", overflow:"auto"
//               }} className="q-sidebar">
//                 <p style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".08em", color:"var(--text-3)", marginBottom:12 }}>
//                   Questions
//                 </p>
//                 <div className="dot-nav">
//                   {questions.map((q,i)=>{
//                     const qid=progressQuestionId(q._id);
//                     const isComp=progressCompletedSet.has(qid);
//                     const isCorr=progressCorrectSet.has(qid);
//                     return (
//                       <div key={q._id}
//                         className={`dot ${i===currentIndex?"dot-current":isComp?(isCorr?"dot-correct":"dot-wrong"):""}`}
//                         onClick={()=>navigateToIndex(i)}
//                         title={`Question ${i+1}`}
//                       >{i+1}</div>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}

//             {/* sign in CTA */}
//             {!user&&(
//               <div style={{ background:"#fafaf9", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", padding:16 }}>
//                 <div style={{ display:"flex", gap:8, marginBottom:8 }}>
//                   <BookOpen size={16} style={{ color:"var(--text-3)", flexShrink:0, marginTop:2 }} />
//                   <div>
//                     <p style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--text-1)", marginBottom:2 }}>Track your progress</p>
//                     <p style={{ fontSize:"0.78rem", color:"var(--text-2)" }}>Sign in to save answers and earn points</p>
//                   </div>
//                 </div>
//                 <button onClick={()=>setShowAuthModal(true)} style={{
//                   width:"100%", padding:"9px 0", background:"#1a1917", color:"#fff", border:"none",
//                   borderRadius:9, fontFamily:"var(--font-sans)", fontWeight:600, fontSize:"0.85rem",
//                   cursor:"pointer", marginTop:4
//                 }}>Sign In</button>
//               </div>
//             )}
//           </aside>

//           {/* ── main question area ── */}
//           <div style={{ minWidth:0 }}>

//             {/* ── MOBILE: compact top info strip ── */}
//             <div className="mobile-top-strip">
//               <style>{`
//                 .mobile-top-strip { display: block; }
//                 @media(min-width:1024px){ .mobile-top-strip { display: none !important; } }
//               `}</style>

//               {/* ── Mobile progress card ── */}
//               <div style={{
//                 background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:14,
//                 padding:"14px 16px", marginBottom:12, boxShadow:"var(--shadow-sm)",
//               }}>
//                 {/* top row: circle + counts */}
//                 <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
//                   {/* circle ring */}
//                   <div style={{ position:"relative", flexShrink:0 }}>
//                     <CircleProgress pct={stats.completionPercentage} size={52} stroke={4} />
//                     <div style={{
//                       position:"absolute", inset:0, display:"flex", flexDirection:"column",
//                       alignItems:"center", justifyContent:"center",
//                     }}>
//                       <span style={{ fontSize:"0.72rem", fontWeight:700, color:"var(--text-1)", lineHeight:1 }}>
//                         {stats.completionPercentage}%
//                       </span>
//                     </div>
//                   </div>

//                   {/* label — chapter total vs this page */}
//                   <div style={{ flex:1, minWidth:0 }}>
//                     <p style={{ fontSize:"0.82rem", fontWeight:600, color:"var(--text-1)", margin:0, lineHeight:1.35 }}>
//                       Chapter ({activeDifficulty}): {stats.completed} / {stats.total} done
//                     </p>
//                     <p style={{ fontSize:"0.72rem", color:"var(--text-3)", margin:"4px 0 0" }}>
//                       This page: Q {currentIndex + 1} of {totalVisible}
//                       {hasMore ? " · more loading" : ""} · {stats.accuracy}% accuracy · {stats.points} pts
//                     </p>
//                   </div>

//                   {/* current q status badge */}
//                   {currentQuestion && (
//                     <QStatusBadge completed={curCompleted} correct={curCorrect} />
//                   )}
//                 </div>

//                 {/* Mobile: primary Save (header Save hidden on small screens) */}
//                 {user && (
//                   <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, marginBottom:10 }}>
//                     <p style={{ fontSize:"0.72rem", color:"var(--text-3)", fontWeight:600, margin:0 }}>
//                       {unsavedCount > 0 ? (
//                         <>
//                           <span style={{ color:"var(--text-1)" }}>{unsavedCount} unsaved</span>
//                           <span style={{ fontWeight:500 }}> — sync to account</span>
//                         </>
//                       ) : (
//                         <span style={{ fontWeight:500 }}>All caught up — nothing to save</span>
//                       )}
//                     </p>
//                     <button
//                       type="button"
//                       onClick={saveBufferedProgress}
//                       disabled={unsavedCount === 0 || isManualSaving || isSavingProgressRef.current}
//                       className={`btn ${unsavedCount > 0 ? "btn-primary" : "btn-ghost"}`}
//                       style={{ padding:"8px 14px", fontSize:"0.78rem", whiteSpace:"nowrap" }}
//                     >
//                       {isManualSaving ? "Saving…" : "Save progress"}
//                     </button>
//                   </div>
//                 )}

//                 {/* progress bar row */}
//                 <div style={{ display:"flex", gap:3, height:8, borderRadius:8, overflow:"hidden" }}>
//                   {/* correct portion */}
//                   <div style={{
//                     flex: stats.correct, background:"var(--correct-fg)",
//                     borderRadius:"8px 0 0 8px", transition:"flex .5s",
//                     minWidth: stats.correct > 0 ? 4 : 0,
//                   }} />
//                   {/* wrong portion */}
//                   <div style={{
//                     flex: stats.wrong, background:"var(--wrong-fg)",
//                     transition:"flex .5s",
//                     minWidth: stats.wrong > 0 ? 4 : 0,
//                   }} />
//                   {/* pending portion */}
//                   <div style={{
//                     flex: stats.pending, background:"var(--border)",
//                     borderRadius: stats.wrong === 0 && stats.correct === 0 ? "8px" : "0 8px 8px 0",
//                     transition:"flex .5s",
//                     minWidth: stats.pending > 0 ? 4 : 0,
//                   }} />
//                 </div>

//                 {/* legend row */}
//                 <div style={{ display:"flex", gap:12, marginTop:8, flexWrap:"wrap" }}>
//                   <div className="legend-item">
//                     <div className="legend-dot" style={{ background:"var(--correct-fg)", borderRadius:3 }} />
//                     Correct: <strong style={{ color:"var(--correct-fg)", marginLeft:2 }}>{stats.correct}</strong>
//                   </div>
//                   <div className="legend-item">
//                     <div className="legend-dot" style={{ background:"var(--wrong-fg)", borderRadius:3 }} />
//                     Wrong: <strong style={{ color:"var(--wrong-fg)", marginLeft:2 }}>{stats.wrong}</strong>
//                   </div>
//                   <div className="legend-item">
//                     <div className="legend-dot" style={{ background:"var(--border-md)", borderRadius:3 }} />
//                     Pending: <strong style={{ color:"var(--text-2)", marginLeft:2 }}>{stats.pending}</strong>
//                   </div>
//                 </div>
//                 <p style={{ margin:"8px 0 0", fontSize:"0.68rem", color:"var(--text-3)", fontWeight:500, lineHeight:1.35 }}>
//                   Bar shows correct / wrong / not tried for <strong style={{ color:"var(--text-2)" }}>questions loaded on this page</strong> (chapter total is above).
//                 </p>
//               </div>
//             </div>

//             {/* question card */}
//             {isLoadingQuestions&&questions.length===0 ? (
//               <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", padding:28, boxShadow:"var(--shadow-sm)" }}>
//                 <QuestionSkeleton />
//               </div>
//             ) : questions.length===0 ? (
//               <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)",
//                 padding:"48px 24px", textAlign:"center", boxShadow:"var(--shadow-sm)" }}>
//                 <Clock size={36} style={{ color:"var(--text-3)", margin:"0 auto 12px" }} />
//                 <h3 style={{ fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:"1.3rem", color:"var(--text-1)", marginBottom:6 }}>No questions available</h3>
//                 <p style={{ fontSize:"0.88rem", color:"var(--text-2)" }}>No {activeDifficulty} questions found for this chapter.</p>
//               </div>
//             ) : currentQuestion ? (
//               <div key={animKey} className="q-enter" style={{
//                 background:"var(--card)", border:"1.5px solid var(--border)",
//                 borderRadius:"var(--radius)", boxShadow:"var(--shadow-md)", overflow:"hidden"
//               }}>
//                 {/* question header */}
//                 <div style={{ padding:"18px 24px 14px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
//                   <div style={{ minWidth:0 }}>
//                     {currentQuestion.topic&&(
//                       <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
//                         background:"#f5f4f2", border:"1px solid var(--border)", borderRadius:6,
//                         fontSize:"0.72rem", fontWeight:600, color:"var(--text-2)", marginBottom:6,
//                         textTransform:"uppercase", letterSpacing:".05em"
//                       }}>
//                         <BookOpen size={10} /> {currentQuestion.topic}
//                       </div>
//                     )}
//                     <p style={{ fontSize:"0.78rem", color:"var(--text-3)", fontWeight:500 }}>
//                       Question {currentIndex+1} of {totalVisible}
//                       {hasMore&&<span style={{ color:"var(--text-3)", marginLeft:4 }}>+</span>}
//                     </p>
//                   </div>

//                   {/* admin rewrite */}
//                   {isAdmin&&(
//                     <button onClick={()=>rewriteQuestionInDb(currentQuestion)}
//                       disabled={rewritingId===currentQuestion._id}
//                       style={{ padding:"5px 12px", background:"var(--card)", border:"1.5px solid var(--border-md)",
//                         borderRadius:8, fontSize:"0.75rem", fontWeight:500, color:"var(--text-2)",
//                         cursor:"pointer", flexShrink:0, transition:"all .15s" }}>
//                       {rewritingId===currentQuestion._id?"Rewriting…":"Rewrite (AI)"}
//                     </button>
//                   )}
//                 </div>

//                 {/* question body */}
//                 <div style={{ padding:"6px 15px" }}>
//                   <MathJaxContext config={mathJaxConfig}>
//                     <MathJax>
//                       <QuestionCard
//                         category={category}
//                         question={currentQuestion}
//                         index={currentIndex}
//                         onAnswer={(isCorrect)=>handleAnswer(currentQuestion._id, isCorrect, currentQuestion.topic)}
//                         isCompleted={progressCompletedSet.has(progressQuestionId(currentQuestion._id))}
//                         isCorrect={progressCorrectSet.has(progressQuestionId(currentQuestion._id))}
//                         isAdmin={isAdmin}
//                       />
//                     </MathJax>
//                   </MathJaxContext>
//                 </div>

//                 {/* navigation footer (hidden on mobile — bottom bar handles prev/next) */}
//                 <div
//                   className="question-card-nav-footer"
//                   style={{
//                   padding:"14px 24px", borderTop:"1px solid var(--border)",
//                   display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
//                   background:"#fafaf9"
//                 }}
//                 >
//                   <button onClick={goPrev} disabled={currentIndex===0}
//                     style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
//                       background: currentIndex===0?"var(--surface)":"var(--card)",
//                       border:"1.5px solid var(--border)", borderRadius:10,
//                       fontFamily:"var(--font-sans)", fontWeight:500, fontSize:"0.85rem",
//                       color: currentIndex===0?"var(--text-3)":"var(--text-1)",
//                       cursor: currentIndex===0?"not-allowed":"pointer", transition:"all .15s"
//                     }}>
//                     <ChevronLeft size={15} /> Previous
//                   </button>

//                   {/* dot indicators */}
//                   <div style={{ display:"flex", gap:5, alignItems:"center" }}>
//                     {questions.slice(Math.max(0,currentIndex-2), currentIndex+3).map((_,ii)=>{
//                       const realIdx=Math.max(0,currentIndex-2)+ii;
//                       const isCur=realIdx===currentIndex;
//                       return <div key={realIdx} style={{
//                         width: isCur?20:6, height:6, borderRadius:999,
//                         background: isCur?"#1a1917":"var(--border-md)", transition:"all .2s"
//                       }} />;
//                     })}
//                   </div>

//                   <button onClick={goNext}
//                     disabled={currentIndex===questions.length-1&&!hasMore}
//                     style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
//                       background: currentIndex===questions.length-1&&!hasMore?"var(--surface)":"#1a1917",
//                       border:"1.5px solid",
//                       borderColor: currentIndex===questions.length-1&&!hasMore?"var(--border)":"#1a1917",
//                       borderRadius:10, fontFamily:"var(--font-sans)", fontWeight:500, fontSize:"0.85rem",
//                       color: currentIndex===questions.length-1&&!hasMore?"var(--text-3)":"#fff",
//                       cursor: currentIndex===questions.length-1&&!hasMore?"not-allowed":"pointer",
//                       transition:"all .15s"
//                     }}>
//                     {isLoadingQuestions&&currentIndex>=questions.length-3?"Loading…":"Next"} <ChevronRight size={15} />
//                   </button>
//                 </div>
//               </div>
//             ) : null}

//             {/* mobile sign-in CTA */}
//             {!user&&(
//               <div className="mobile-auth" style={{ marginTop:14 }}>
//                 <style>{`.mobile-auth{display:block}@media(min-width:1024px){.mobile-auth{display:none}}`}</style>
//                 <div style={{ background:"var(--card)", border:"1.5px solid var(--border)", borderRadius:"var(--radius)", padding:"14px 18px",
//                   display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, boxShadow:"var(--shadow-sm)" }}>
//                   <div>
//                     <p style={{ fontSize:"0.85rem", fontWeight:600, color:"var(--text-1)" }}>Track your progress</p>
//                     <p style={{ fontSize:"0.75rem", color:"var(--text-2)" }}>Sign in to save & earn points</p>
//                   </div>
//                   <button onClick={()=>setShowAuthModal(true)} style={{
//                     padding:"8px 18px", background:"#1a1917", color:"#fff", border:"none",
//                     borderRadius:9, fontFamily:"var(--font-sans)", fontWeight:600, fontSize:"0.83rem",
//                     cursor:"pointer", flexShrink:0
//                   }}>Sign In</button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* ── MOBILE BOTTOM BAR ── */}
//         <div className="mobile-bottom-bar">
//           <div className="mobile-bottom-inner">

//             {/* prev */}
//             <button onClick={goPrev} disabled={currentIndex===0}
//               className="mb-icon-btn"
//               style={{
//                 background: currentIndex===0 ? "var(--surface)" : "var(--card)",
//                 color: currentIndex===0 ? "var(--text-3)" : "var(--text-1)",
//               }}
//             >
//               <ChevronLeft size={18} />
//             </button>

//             {/* center: question navigator trigger */}
//             <button
//               onClick={() => setSheetOpen(true)}
//               className="mb-center"
//             >
//               {/* mini dot strip preview */}
//               <div style={{ display:"flex", gap:3, alignItems:"center", flex:1, overflow:"hidden" }}>
//                 {questions.slice(0, 10).map((q, i) => {
//                   const qid   = progressQuestionId(q._id);
//                   const comp  = progressCompletedSet.has(qid);
//                   const corr  = progressCorrectSet.has(qid);
//                   const isCur = i === currentIndex;
//                   return (
//                     <div key={q._id} style={{
//                       width: isCur ? 18 : 8,
//                       height: 8,
//                       borderRadius: 99,
//                       flexShrink: 0,
//                       background: isCur ? "#1a1917" : comp ? (corr ? "var(--correct-fg)" : "var(--wrong-fg)") : "var(--border-md)",
//                       transition:"all .2s",
//                     }} />
//                   );
//                 })}
//                 {questions.length > 10 && (
//                   <span style={{ fontSize:"0.65rem", color:"var(--text-3)", marginLeft:2, fontWeight:600, flexShrink:0 }}>
//                     +{questions.length - 10}
//                   </span>
//                 )}
//               </div>

//               {/* label */}
//               <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", flexShrink:0 }}>
//                 <span style={{ fontSize:"0.7rem", fontWeight:700, color:"var(--text-1)", lineHeight:1 }}>
//                   {currentIndex+1}/{totalVisible}
//                 </span>
//                 <span style={{ fontSize:"0.62rem", color:"var(--text-3)", lineHeight:1.3 }}>
//                   All questions
//                 </span>
//               </div>

//               <ChevronUp size={14} style={{ color:"var(--text-3)", flexShrink:0 }} />
//             </button>

//             {/* next */}
//             <button onClick={goNext}
//               disabled={currentIndex===questions.length-1&&!hasMore}
//               className="mb-icon-btn"
//               style={{
//                 background: currentIndex===questions.length-1&&!hasMore ? "var(--surface)" : "#1a1917",
//                 borderColor: currentIndex===questions.length-1&&!hasMore ? "var(--border)" : "#1a1917",
//                 color: currentIndex===questions.length-1&&!hasMore ? "var(--text-3)" : "#fff",
//               }}
//             >
//               <ChevronRight size={18} />
//             </button>
//           </div>
//         </div>

//         <Toaster position="bottom-center" toastOptions={{ style: { fontFamily:"var(--font-sans)", fontSize:"0.875rem", marginBottom:"70px" } }} />
//       </div>
//     </>
//   );
// });

// ChapterPracticePage.displayName = "ChapterPracticePage";
// export default ChapterPracticePage;

"use client";

import React, {
  useState, useEffect, useLayoutEffect, useCallback,
  useMemo, memo, useRef,
} from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { upsertUserProgress } from "@/lib/userProgressUpsert";
import {
  readProgressBuffer, writeProgressBuffer, saveProgressBufferToSupabase,
} from "@/lib/progressBuffer";
import toast, { Toaster } from "react-hot-toast";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  BookOpen, Award, X, ChevronUp, Save, Flame,
  Circle, LayoutGrid, AlertCircle,
} from "lucide-react";

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

const ADMIN_EMAIL            = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
const QUESTIONS_PER_PAGE     = 10;
const DIFFICULTIES           = ["easy", "medium", "hard"];
const DIFFICULTY_STORAGE_KEY = "pyq-practice-difficulty";

// ─── helpers ─────────────────────────────────────────────────────────────────
const parseDifficultyParam = (sp) => {
  if (!sp) return null;
  const d = String(sp.get("difficulty") ?? "").toLowerCase();
  return DIFFICULTIES.includes(d) ? d : null;
};
const normalizeChapterName = (name) =>
  name ? name.toLowerCase().trim().replace(/\s+/g, " ").replace(/-/g, " ") : "";
const chapterNamesMatch = (a, b) =>
  normalizeChapterName(a) === normalizeChapterName(b);
const progressQuestionId = (id) => (id == null ? "" : String(id));
const getChapterCandidates = (chapter) => {
  const ch = chapter ?? "";
  return Array.from(new Set([
    ch, ch.trim(), ch.replace(/-/g, " "),
    normalizeChapterName(ch), normalizeChapterName(ch).replace(/\s+/g, "-"),
  ].filter(Boolean)));
};

// ─── Navbar height — MUST match your Navbar exactly ──────────────────────────
// Desktop: 80px (h-20) + 1px footer strip ≈ 81px  →  round up to 82px
// Mobile: 80px (h-20)
const NAV_H_DESK = 82;   // px — adjust if your Navbar height changes
const NAV_H_MOB  = 80;   // px

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;1,500&display=swap');

  /* ── design tokens ── */
  :root {
    --nav-h: ${NAV_H_MOB}px;
    --topbar-h: 52px;
    --mob-diff-h: 48px;
    --mob-bar-h: 68px;

    /* neutral palette — matches Navbar (white/neutral-900) */
    --bg:rgb(255, 255, 255);
    --surface:  #FFFFFF;
    --surface2: #F0EEE9;
    --border:   #E5E1DC;
    --border2:  #C8C3BC;
    --ink1:     #1A1917;
    --ink2:     #57524D;
    --ink3:     #9C968F;
    --ink4:     #C5BFB8;

    /* accent — matches Navbar's neutral-900 cta */
    --accent:   #171614;
    --accent-f: #FFFFFF;

    /* difficulty */
    --easy:     #059669;
    --easy-bg:  #ECFDF5;
    --easy-bd:  #6EE7B7;
    --med:      #D97706;
    --med-bg:   #FFFBEB;
    --med-bd:   #FCD34D;
    --hard:     #DC2626;
    --hard-bg:  #FEF2F2;
    --hard-bd:  #FCA5A5;

    /* state */
    --ok-bg:  #ECFDF5; --ok-fg:  #059669; --ok-bd:  #059669;
    --err-bg: #FEF2F2; --err-fg: #DC2626; --err-bd: #DC2626;

    /* misc */
    --r:  10px;
    --sh: 0 1px 3px rgba(26,25,23,.06), 0 1px 2px rgba(26,25,23,.04);
    --sh2: 0 4px 16px rgba(26,25,23,.08), 0 1px 4px rgba(26,25,23,.04);
    --font: 'Sora', sans-serif;
    --display: 'Playfair Display', serif;
  }

  @media(min-width:768px) {
    :root {
      --nav-h: ${NAV_H_DESK}px;
      --topbar-h: 56px;
      --mob-diff-h: 0px;
    }
  }

  /* derived offset: where sticky topbar begins */
  :root {
    --stick-top: var(--nav-h);
    --content-start: calc(var(--nav-h) + var(--topbar-h));
  }
  @media(max-width:767px) {
    :root { --content-start: calc(var(--nav-h) + var(--topbar-h) + var(--mob-diff-h)); }
  }

  /* ── reset ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── root ── */
  .pq { font-family: var(--font); background: var(--bg); min-height: 100svh; color: var(--ink1); }
  .pq * { font-family: var(--font); }

  /* ── topbar ── */
  .pq-topbar {
    position: sticky;
    top: var(--stick-top);
    z-index: 40;
    background: rgba(255,255,255,.96);
    backdrop-filter: blur(16px) saturate(1.4);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    border-bottom: 1px solid var(--border);
  }
  .pq-topbar-row {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 16px;
    height: var(--topbar-h);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pq-strip {
    height: 2px;
    background: var(--border);
    position: relative;
    overflow: hidden;
  }
  .pq-strip-fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--accent);
    transition: width .7s cubic-bezier(.22,.68,0,1.2);
  }

  /* mobile diff row */
  .pq-diff-row {
    display: flex;
    gap: 6px;
    padding: 8px 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .pq-diff-row::-webkit-scrollbar { display: none; }
  @media(min-width:768px) { .pq-diff-row { display: none !important; } }

  /* ── body layout ── */
  .pq-body {
    max-width: 1280px;
    margin: 0 auto;
    padding: 20px 16px 88px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    align-items: start;
  }
  @media(min-width:1024px) {
    .pq-body {
      grid-template-columns: 280px 1fr;
      padding: 24px 24px 40px;
      gap: 20px;
    }
  }
  @media(min-width:1280px) {
    .pq-body { grid-template-columns: 300px 1fr; }
  }

  /* ── sidebar ── */
  .pq-sidebar {
    display: none;
    flex-direction: column;
    gap: 12px;
    position: sticky;
    top: calc(var(--content-start) + 16px);
    max-height: calc(100svh - var(--content-start) - 32px);
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 14px;
    scrollbar-gutter: stable;
    min-height: 0;
  }
  @media(min-width:1024px) { .pq-sidebar { display: flex; } }
  .pq-sidebar::-webkit-scrollbar { width: 3px; }
  .pq-sidebar::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  /* ── cards ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    box-shadow: var(--sh);
  }
  .card-main {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--r);
    box-shadow: var(--sh2);
  }

  /* ── buttons ── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 5px;
    padding: 7px 14px; border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface); color: var(--ink1);
    font-family: var(--font); font-weight: 600; font-size: .8rem;
    cursor: pointer; transition: all .12s ease; box-shadow: var(--sh);
    white-space: nowrap; text-decoration: none; line-height: 1;
  }
  .btn:hover:not(:disabled) { border-color: var(--border2); background: var(--surface2); transform: translateY(-1px); box-shadow: var(--sh2); }
  .btn:active:not(:disabled) { transform: translateY(0); }
  .btn:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; transform: none; }
  .btn-ink { background: var(--accent); border-color: var(--accent); color: #fff; }
  .btn-ink:hover:not(:disabled) { background: #2c2a28; border-color: #2c2a28; }
  .btn-sm { padding: 5px 10px; font-size: .75rem; border-radius: 7px; }
  .btn-ghost { background: transparent; box-shadow: none; border-color: var(--border); color: var(--ink2); }
  .btn-ghost:hover:not(:disabled) { background: var(--surface2); }

  /* ── difficulty chips ── */
  .diff-easy   { background: var(--easy-bg); color: var(--easy); border-color: var(--easy-bd); }
  .diff-medium { background: var(--med-bg);  color: var(--med);  border-color: var(--med-bd);  }
  .diff-hard   { background: var(--hard-bg); color: var(--hard); border-color: var(--hard-bd); }
  .diff-easy.active   { background: var(--easy); color: #fff; border-color: var(--easy); }
  .diff-medium.active { background: var(--med);  color: #fff; border-color: var(--med);  }
  .diff-hard.active   { background: var(--hard); color: #fff; border-color: var(--hard); }

  /* ── dot nav ── */
  .dot-grid { display: flex; flex-wrap: wrap; gap: 5px; }
  .dot {
    width: 30px; height: 30px; border-radius: 7px; border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: .7rem; font-weight: 600; cursor: pointer; color: var(--ink2);
    transition: all .12s; background: var(--surface); position: relative;
  }
  .dot:hover  { border-color: var(--border2); background: var(--surface2); }
  .dot-cur    { background: var(--accent) !important; color: #fff !important; border-color: var(--accent) !important; }
  .dot-ok     { background: var(--ok-bg) !important; border-color: var(--ok-bd) !important; color: var(--ok-fg) !important; }
  .dot-err    { background: var(--err-bg) !important; border-color: var(--err-bd) !important; color: var(--err-fg) !important; }

  /* ── progress ring ── */
  .ring-track { fill: none; stroke: var(--border); }
  .ring-fill {
    fill: none; stroke: var(--accent); stroke-linecap: round;
    transition: stroke-dashoffset .7s cubic-bezier(.22,.68,0,1.2);
  }

  /* ── tricolor bar ── */
  .tri-bar { display: flex; height: 7px; border-radius: 99px; overflow: hidden; gap: 2px; }
  .tri-seg { border-radius: 99px; transition: flex .6s cubic-bezier(.22,.68,0,1.2); min-width: 0; }

  /* ── labels & misc ── */
  .label {
    font-size: .65rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: .08em; color: var(--ink3);
  }
  .topic-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 9px; border-radius: 6px;
    background: var(--surface2); border: 1px solid var(--border);
    font-size: .68rem; font-weight: 700; color: var(--ink2);
    text-transform: uppercase; letter-spacing: .05em;
  }
  .unsaved-badge {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    background: #EF4444; color: #fff; border-radius: 99px;
    font-size: .65rem; font-weight: 700;
  }
  .status-badge-ok {
    font-size: .63rem; font-weight: 700; padding: 2px 8px; border-radius: 5px;
    background: var(--ok-bg); color: var(--ok-fg); border: 1px solid var(--ok-bd);
  }
  .status-badge-err {
    font-size: .63rem; font-weight: 700; padding: 2px 8px; border-radius: 5px;
    background: var(--err-bg); color: var(--err-fg); border: 1px solid var(--err-bd);
  }
  .status-badge-none {
    font-size: .63rem; font-weight: 700; padding: 2px 8px; border-radius: 5px;
    background: var(--surface2); color: var(--ink3); border: 1px solid var(--border);
  }
  .legend-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: .7rem; font-weight: 500; color: var(--ink2); }
  .legend-dot  { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }

  /* ── desktop question map (sidebar) ── */
  .qmap-card {
    padding: 14px 14px 12px;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 260px;
  }
  .qmap-head { display:flex; align-items:flex-end; justify-content:space-between; gap: 10px; margin-bottom: 10px; }
  .qmap-title { display:flex; flex-direction:column; gap: 2px; min-width:0; }
  .qmap-sub { font-size: .68rem; color: var(--ink3); font-weight: 600; }
  .qmap-actions { display:flex; align-items:center; gap: 6px; flex-shrink:0; }
  .qmap-mini {
    display:inline-flex; align-items:center; gap: 4px;
    padding: 4px 8px; border-radius: 999px;
    border: 1px solid var(--border); background: var(--surface2);
    font-size: .68rem; font-weight: 800; color: var(--ink2);
  }
  .qmap-jump { display:flex; align-items:center; gap: 6px; margin-bottom: 10px; }
  .qmap-input {
    flex: 1; min-width: 0;
    height: 34px;
    border-radius: 9px;
    border: 1px solid var(--border);
    background: var(--surface);
    padding: 0 10px;
    font-size: .78rem;
    font-weight: 700;
    color: var(--ink1);
    outline: none;
    box-shadow: var(--sh);
  }
  .qmap-input:focus { border-color: var(--border2); box-shadow: var(--sh2); }
  .qmap-grid {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 6px;
  }
  .qmap-grid .dot { width: 100%; height: 30px; border-radius: 9px; }
  .qmap-scroll {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding-right: 6px;
  }
  .qmap-foot {
    margin-top: 10px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 10px;
  }
  .qmap-legend { display:flex; align-items:center; gap: 10px; flex-wrap: wrap; }
  .qmap-legend-item { display:flex; align-items:center; gap: 5px; font-size: .66rem; font-weight: 700; color: var(--ink2); }
  .qmap-legend-swatch { width: 10px; height: 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--surface2); }
  .qmap-legend-swatch.ok  { background: var(--ok-bg); border-color: var(--ok-bd); }
  .qmap-legend-swatch.err { background: var(--err-bg); border-color: var(--err-bd); }
  .qmap-legend-swatch.cur { background: var(--accent); border-color: var(--accent); }

  /* ── animations ── */
  @keyframes qIn    { from { opacity:0; transform:translateX(18px) scale(.99); } to { opacity:1; transform:none; } }
  @keyframes sheetUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes savePop { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }

  .q-enter { animation: qIn .28s cubic-bezier(.22,.68,0,1.2) both; }
  .skel    { animation: pulse 1.6s ease-in-out infinite; background: var(--surface2); border-radius: 7px; }
  .save-pop { animation: savePop .3s ease; }

  /* ── bottom sheet ── */
  .sheet-overlay {
    position: fixed; inset: 0; background: rgba(26,25,23,.5);
    backdrop-filter: blur(4px); z-index: 60; animation: fadeIn .18s ease;
  }
  .sheet {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 61;
    background: var(--surface); border-radius: 16px 16px 0 0;
    animation: sheetUp .3s cubic-bezier(.22,.68,0,1.2);
    max-height: 76svh; display: flex; flex-direction: column;
    box-shadow: 0 -8px 40px rgba(26,25,23,.14);
  }
  .sheet-drag { width: 36px; height: 4px; background: var(--border2); border-radius: 99px; margin: 10px auto 0; flex-shrink: 0; }
  .sheet-body { overflow-y: auto; padding: 0 16px 20px; flex: 1; }
  .sheet-body::-webkit-scrollbar { width: 3px; }
  .sheet-body::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  /* ── mobile bottom bar ── */
  .mob-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
    background: rgba(255,255,255,.97);
    backdrop-filter: blur(16px);
    border-top: 1px solid var(--border);
    padding: 10px 16px;
    padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
  }
  @media(min-width:1024px) { .mob-bar { display: none !important; } }
  .mob-bar-inner { display: flex; align-items: center; gap: 8px; max-width: 600px; margin: 0 auto; }
  .mob-icon-btn {
    width: 44px; height: 44px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all .12s; flex-shrink: 0; box-shadow: var(--sh);
  }
  .mob-icon-btn:disabled { opacity: .38; cursor: not-allowed; }
  .mob-icon-btn:hover:not(:disabled) { border-color: var(--border2); background: var(--surface2); }
  .mob-center-btn {
    flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 10px;
    border: 1px solid var(--border); background: var(--surface);
    cursor: pointer; transition: all .12s; box-shadow: var(--sh);
  }
  .mob-center-btn:hover { border-color: var(--border2); background: var(--surface2); }

  /* ── desktop nav footer ── */
  .desk-nav { display: flex; }
  @media(max-width:1023px) { .desk-nav { display: none !important; } }

  /* ── mobile progress card ── */
  .mob-progress { display: flex; }
  @media(min-width:1024px) { .mob-progress { display: none !important; } }

  /* ── responsive typography ── */
  @media(max-width:767px) {
    .pq-topbar-row { padding: 0 12px; height: 52px; gap: 8px; }
    .pq-body { padding: 14px 12px 84px; gap: 12px; }
  }
`;

// ─── sub-components ───────────────────────────────────────────────────────────

const QuestionSkeleton = memo(() => (
  <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
    <div className="skel" style={{ height: 20, width: "65%" }} />
    <div className="skel" style={{ height: 16, width: "85%" }} />
    <div className="skel" style={{ height: 16, width: "75%" }} />
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      {[0,1,2,3].map(i => (
        <div key={i} className="skel" style={{ height: 52, borderRadius: 10 }} />
      ))}
    </div>
  </div>
));
QuestionSkeleton.displayName = "QuestionSkeleton";

const Ring = memo(({ pct, size = 52, stroke = 4.5 }) => {
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle className="ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} />
      <circle className="ring-fill"
        cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        style={{ transform: `rotate(-90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}
      />
    </svg>
  );
});
Ring.displayName = "Ring";

const StatusBadge = memo(({ completed, correct }) => {
  if (!completed) return <span className="status-badge-none">Not tried</span>;
  if (correct) return <span className="status-badge-ok">✓ Correct</span>;
  return <span className="status-badge-err">✗ Wrong</span>;
});
StatusBadge.displayName = "StatusBadge";

const DiffButton = memo(({ d, count, active, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={`btn diff-${d} ${active ? "active" : ""}`}
    style={{ justifyContent: "space-between", padding: "7px 12px", width: "100%" }}
  >
    <span style={{ textTransform: "capitalize", fontWeight: 700, fontSize: ".8rem" }}>{d}</span>
    <span style={{
      background: active ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.08)",
      borderRadius: 5, padding: "1px 7px", fontSize: ".72rem", fontWeight: 700,
    }}>{count ?? 0}</span>
  </button>
));
DiffButton.displayName = "DiffButton";

// ── NavSheet (bottom sheet on mobile) ────────────────────────────────────────
const NavSheet = memo(({
  questions,
  currentIndex,
  completedSet,
  correctSet,
  onSelect,
  onClose,
  hasMore,
  stats,
  user,
  unsaved,
  saving,
  onSave,
  onSignIn,
}) => {
  const curRef = useRef(null);
  useEffect(() => { curRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [currentIndex]);

  const correctCount = questions.filter(q => correctSet.has(progressQuestionId(q._id))).length;
  const wrongCount   = questions.filter(q => {
    const id = progressQuestionId(q._id);
    return completedSet.has(id) && !correctSet.has(id);
  }).length;
  const pendingCount = questions.filter(q => !completedSet.has(progressQuestionId(q._id))).length;
  const firstPending = questions.findIndex(q => !completedSet.has(progressQuestionId(q._id)));

  return (
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-drag" />
        <div style={{ padding: "12px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h3 style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: "1.1rem", color: "var(--ink1)" }}>Question Map</h3>
            <p style={{ fontSize: ".7rem", color: "var(--ink3)", marginTop: 2, fontWeight: 500 }}>
              {questions.length}{hasMore ? "+" : ""} loaded · tap to jump
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "6px 8px" }}>
            <X size={14} />
          </button>
        </div>

        {/* progress summary */}
        {!!stats && (
          <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <Ring pct={stats.pct ?? 0} size={46} stroke={4.5} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: ".68rem", fontWeight: 800, color: "var(--ink1)" }}>{stats.pct ?? 0}%</span>
                </div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: ".82rem", fontWeight: 800, color: "var(--ink1)", lineHeight: 1.2 }}>
                  {stats.comp ?? 0}
                  <span style={{ color: "var(--ink4)", fontWeight: 500 }}>/{stats.total ?? 0}</span> completed
                </p>
                <p style={{ fontSize: ".7rem", color: "var(--ink3)", fontWeight: 600, marginTop: 2 }}>
                  {stats.acc ?? 0}% accuracy · {stats.pts ?? 0} pts
                </p>
              </div>

              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                {user ? (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={!unsaved || saving}
                    className={`btn btn-sm ${unsaved ? "btn-ink" : ""}`}
                    style={{ padding: "6px 10px" }}
                    title={unsaved ? "Save buffered progress to your account" : "Nothing to save yet"}
                  >
                    {saving ? "Saving…" : "Save"}
                    {unsaved > 0 && <span className="unsaved-badge" style={{ marginLeft: 4 }}>{unsaved}</span>}
                  </button>
                ) : (
                  <button type="button" onClick={onSignIn} className="btn btn-sm btn-ink" style={{ padding: "6px 10px" }}>
                    Sign in
                  </button>
                )}
              </div>
            </div>

            {user && (
              <p style={{ fontSize: ".68rem", color: "var(--ink3)", fontWeight: 600, marginTop: 6 }}>
                {unsaved ? `${unsaved} unsaved answers` : "Nothing to save yet"}
              </p>
            )}
          </div>
        )}

        {/* legend */}
        <div style={{ padding: "0 16px 10px", flexShrink: 0 }}>
          <div className="legend-row">
            {[
              ["var(--ok-bg)", "var(--ok-bd)", "var(--ok-fg)", "Correct", correctCount],
              ["var(--err-bg)", "var(--err-bd)", "var(--err-fg)", "Wrong", wrongCount],
              ["var(--surface2)", "var(--border)", "var(--ink3)", "Pending", pendingCount],
            ].map(([bg, bd, fg, label, count]) => (
              <div key={label} className="legend-item">
                <div className="legend-dot" style={{ background: bg, border: `1.5px solid ${bd}` }} />
                {label}: <strong style={{ color: fg, marginLeft: 3 }}>{count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border)", flexShrink: 0 }} />
        <div className="sheet-body" style={{ paddingTop: 12 }}>
          <div className="dot-grid">
            {questions.map((q, i) => {
              const qid = progressQuestionId(q._id);
              const ok  = correctSet.has(qid);
              const bad = completedSet.has(qid) && !ok;
              const cur = i === currentIndex;
              return (
                <div key={q._id} ref={cur ? curRef : null}
                  className={`dot ${cur ? "dot-cur" : ok ? "dot-ok" : bad ? "dot-err" : ""}`}
                  onClick={() => { onSelect(i); onClose(); }}
                >
                  {i + 1}
                  {!cur && (ok || bad) && (
                    <span style={{
                      position: "absolute", top: 2, right: 2,
                      width: 5, height: 5, borderRadius: "50%",
                      background: ok ? "var(--ok-fg)" : "var(--err-fg)",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
          {firstPending !== -1 && (
            <div style={{ marginTop: 12, padding: "9px 12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 9 }}>
              <p style={{ fontSize: ".75rem", fontWeight: 600, color: "#92400E", margin: 0 }}>
                First unattempted: Q{firstPending + 1}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
});
NavSheet.displayName = "NavSheet";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const ChapterPracticePage = memo(() => {
  const mathJaxConfig = useMemo(() => ({
    "fast-preview": { disabled: false },
    tex: {
      inlineMath: [["$","$"],["\\(","\\)"]],
      displayMath: [["$$","$$"],["\\[","\\]"]],
      processEscapes: true,
    },
    messageStyle: "none", showMathMenu: false,
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
  const isSavingRef          = useRef(false);
  const fetchAbortRef        = useRef(null);
  const hasShownToastRef     = useRef(false);
  const qmapJumpRef          = useRef(null);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { categoryRef.current = category; }, [category]);

  const isAdmin = useMemo(
    () => user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL, [user]
  );
  const normalizedChapter = useMemo(
    () => chaptername ? chaptername.replace(/-/g, " ") : "", [chaptername]
  );
  useEffect(() => { normalizedChapterRef.current = normalizedChapter; }, [normalizedChapter]);

  const activeDifficulty = useMemo(
    () => parseDifficultyParam(searchParams) ?? "easy", [searchParams]
  );

  // ── state ──────────────────────────────────────────────────────────────────
  const [questions,   setQuestions]   = useState([]);
  const [counts,      setCounts]      = useState({ easy: 0, medium: 0, hard: 0 });
  const [totalQ,      setTotalQ]      = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingQ,    setLoadingQ]    = useState(false);
  const [progress,    setProgress]    = useState({ completed: [], correct: [], points: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore,     setHasMore]     = useState(true);
  const [rewritingId, setRewritingId] = useState(null);
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [animKey,     setAnimKey]     = useState(0);
  const [sheetOpen,   setSheetOpen]   = useState(false);
  const [unsaved,     setUnsaved]     = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [saveBtnKey,  setSaveBtnKey]  = useState(0);

  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // ── fetchers ───────────────────────────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    if (!category || !normalizedChapter) return;
    try {
      const r = await fetch(`/api/questions/chapter/counts?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setCounts({ easy: d.easy ?? 0, medium: d.medium ?? 0, hard: d.hard ?? 0 });
      setTotalQ(d.total ?? 0);
    } catch { setCounts({ easy: 0, medium: 0, hard: 0 }); }
  }, [category, normalizedChapter]);

  const fetchQuestions = useCallback(async (diff, page = 1, append = false) => {
    if (!normalizedChapter || !category) return;
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;
    setLoadingQ(true);
    try {
      const r = await fetch(
        `/api/questions/chapter?category=${encodeURIComponent(category)}&chapter=${encodeURIComponent(normalizedChapter)}&difficulty=${diff}&page=${page}&limit=${QUESTIONS_PER_PAGE}`,
        { signal: ctrl.signal }
      );
      if (!r.ok) throw new Error();
      const d = await r.json();
      const qs = d.questions ?? [];
      setQuestions(prev => append ? [...prev, ...qs] : qs);
      setHasMore(d.hasMore ?? false);
      if (!append) setCurrentIdx(0);
    } catch (e) {
      if (e.name === "AbortError") return;
      toast.error("Failed to load questions");
      setQuestions([]); setHasMore(false);
    } finally { setLoadingQ(false); }
  }, [category, normalizedChapter]);

  const fetchUserProgress = useCallback(async () => {
    const uid = userRef.current?.id, cat = categoryRef.current, ch = normalizedChapterRef.current;
    if (!uid || !ch || !cat) { setProgress({ completed: [], correct: [], points: 0 }); return; }
    try {
      const cands = getChapterCandidates(ch);
      const { data: rows, error: re } = await supabase.from("examtracker")
        .select("topic, chapter").eq("category", cat.toUpperCase()).in("chapter", cands);
      if (re) throw re;
      const topicSet = new Set();
      const norm = normalizeChapterName(ch);
      for (const row of rows ?? []) {
        if (row?.topic && chapterNamesMatch(row.chapter, norm)) topicSet.add(String(row.topic).trim());
      }
      for (const q of questionsRef.current ?? []) { if (q?.topic) topicSet.add(String(q.topic).trim()); }
      const topics = [...topicSet];
      if (!topics.length) { setProgress({ completed: [], correct: [], points: 0 }); return; }
      const area = cat.toLowerCase();
      const { data: pd, error: pe } = await supabase.from("user_progress")
        .select("completedquestions, correctanswers, points, topic")
        .eq("user_id", uid).eq("area", area).in("topic", topics);
      if (pe && pe.code !== "PGRST116") throw pe;
      const comp = new Set(), corr = new Set(); let pts = 0;
      for (const item of pd ?? []) {
        (Array.isArray(item.completedquestions) ? item.completedquestions : []).forEach(id => { const s = progressQuestionId(id); if (s) comp.add(s); });
        (Array.isArray(item.correctanswers) ? item.correctanswers : []).forEach(id => { const s = progressQuestionId(id); if (s) corr.add(s); });
        pts += typeof item.points === "number" ? item.points : 0;
      }
      setProgress({ completed: [...comp], correct: [...corr], points: pts });
    } catch { setProgress({ completed: [], correct: [], points: 0 }); }
  }, []);

  const refreshUnsaved = useCallback(() => {
    const uid = userRef.current?.id;
    if (!uid) { setUnsaved(0); return; }
    try {
      const buf = readProgressBuffer(uid);
      setUnsaved(Object.keys(buf.entries ?? {}).length);
    } catch { setUnsaved(0); }
  }, []);

  const saveProgress = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser?.id) { setShowAuthModal(true); return; }
    const uid = currentUser.id;
    if (isSavingRef.current) return;
    try {
      const buf = readProgressBuffer(uid);
      if (!Object.keys(buf.entries ?? {}).length) { setUnsaved(0); return; }
      isSavingRef.current = true;
      setSaving(true);
      await saveProgressBufferToSupabase({ supabase, upsertUserProgress, user: currentUser, onMissingTopic: () => {} });
      await fetchUserProgress();
      setUnsaved(0);
      setSaveBtnKey(k => k + 1);
      toast.success("Progress saved!", { duration: 2200 });
    } catch {
      refreshUnsaved();
      toast.error("Save failed. Try again.");
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [fetchUserProgress, refreshUnsaved, setShowAuthModal]);

  const handleAnswer = useCallback((questionId, isCorrect, questionTopic) => {
    if (!userRef.current) { setShowAuthModal(true); return; }
    const qid = progressQuestionId(questionId);
    if (!qid) return;
    const topic = questionTopic != null && String(questionTopic).trim() ? String(questionTopic).trim() : null;
    setProgress(prev => {
      const comp = new Set(prev.completed.map(progressQuestionId));
      const corr = new Set(prev.correct.map(progressQuestionId));
      const wasDone = comp.has(qid), wasCorr = corr.has(qid);
      if (!wasDone) comp.add(qid);
      if (isCorrect) corr.add(qid); else corr.delete(qid);
      const delta = wasDone ? 0 : isCorrect ? 100 : 0;
      return { completed: [...comp], correct: [...corr], points: prev.points + delta - (wasCorr && !isCorrect ? 100 : 0) };
    });
    try {
      const uid = userRef.current?.id;
      if (!uid) return;
      const buf = readProgressBuffer(uid);
      const entries = { ...(buf.entries ?? {}) };
      entries[qid] = { completed: true, correct: !!isCorrect, points: isCorrect ? 100 : 0, topic, area: (categoryRef.current ?? "").toLowerCase(), updatedAt: Date.now() };
      writeProgressBuffer(uid, { ...buf, entries });
      setUnsaved(Object.keys(entries).length);
    } catch {}
  }, [setShowAuthModal]);

  // ── routing ────────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !category || !normalizedChapter) return;
    if (parseDifficultyParam(searchParams)) return;
    try {
      const saved = sessionStorage.getItem(DIFFICULTY_STORAGE_KEY);
      if (saved && DIFFICULTIES.includes(saved) && saved !== "easy") {
        const p = new URLSearchParams(searchParams.toString());
        p.set("difficulty", saved);
        router.replace(`${pathname}?${p.toString()}`, { scroll: false });
      }
    } catch {}
  }, [category, normalizedChapter, pathname, router, searchParams]);

  useEffect(() => {
    try { sessionStorage.setItem(DIFFICULTY_STORAGE_KEY, activeDifficulty); } catch {}
  }, [activeDifficulty]);

  const changeDifficulty = useCallback((d) => {
    if (d === activeDifficulty || loadingQ) return;
    setCurrentPage(1); setHasMore(true); setCurrentIdx(0);
    const p = new URLSearchParams(searchParams.toString());
    p.set("difficulty", d);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [activeDifficulty, loadingQ, router, searchParams, pathname]);

  // ── navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= questions.length) return;
    setAnimKey(k => k + 1);
    setCurrentIdx(idx);
    if (idx >= questions.length - 3 && hasMore && !loadingQ) {
      const next = currentPage + 1;
      setCurrentPage(next);
      fetchQuestions(activeDifficulty, next, true);
    }
  }, [questions.length, hasMore, loadingQ, currentPage, activeDifficulty, fetchQuestions]);

  const goNext = useCallback(() => goTo(currentIdx + 1), [currentIdx, goTo]);
  const goPrev = useCallback(() => goTo(currentIdx - 1), [currentIdx, goTo]);

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [goNext, goPrev]);

  // ── data effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!category || !normalizedChapter) return;
    let cancelled = false;
    (async () => {
      setLoading(true); setCurrentPage(1); setHasMore(true);
      try { await Promise.all([fetchCounts(), fetchQuestions(activeDifficulty, 1, false)]); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [category, normalizedChapter, activeDifficulty, fetchCounts, fetchQuestions]);

  useEffect(() => { fetchUserProgress(); }, [user, category, normalizedChapter, fetchUserProgress]);
  useEffect(() => { if (!user?.id || !questions.length) return; fetchUserProgress(); }, [user, questions, fetchUserProgress]);
  useEffect(() => { refreshUnsaved(); }, [user?.id, refreshUnsaved]);

  useEffect(() => {
    if (!user?.id || !unsaved || hasShownToastRef.current) return;
    hasShownToastRef.current = true;
    toast("You have unsaved answers — save before leaving.", { duration: 3500, icon: "⚠️" });
  }, [user?.id, unsaved]);

  useEffect(() => {
    if (!unsaved) return;
    const warn = "You have unsaved progress. Leave anyway?";
    const h = (e) => { e.preventDefault(); e.returnValue = warn; return warn; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [unsaved]);

  // ── admin rewrite ──────────────────────────────────────────────────────────
  const extractStem = useCallback((content) => {
    if (!content) return null;
    let t = String(content).trim().replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ""));
    t = t.replace(/^["'\s]*Question\s*:\s*/i, "").trim();
    const stop = /(\n\s*(?:A[\).\]:-]|\(A\)|Option\s*A\b|Options?\b)|\n\s*(?:Answer|Correct\s*Answer|Explanation|Solution)\b|(?:^|\n)\s*(?:A\)|A\.|A:)\s+)/i.exec(t);
    if (stop?.index > 0) t = t.slice(0, stop.index).trim();
    t = (t.split(/\n\s*\n/)[0] ?? t).trim();
    return t.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;
  }, []);

  const rewriteQuestion = useCallback(async (question) => {
    if (!isAdmin || !question?._id || rewritingId) return;
    setRewritingId(question._id);
    const tid = toast.loading("Rewriting…");
    try {
      const stem = String(question.question ?? "").replace(/<\/?[^>]+(>|$)/g, " ").trim();
      if (!stem) throw new Error("empty");
      const resp = await fetch("/api/generate-similar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "rewrite-question", question: stem, maxTokens: 160 }) });
      if (!resp.ok) throw new Error(await resp.text());
      const rewritten = extractStem((await resp.json())?.content);
      if (!rewritten) throw new Error("empty result");
      const { error } = await supabase.from("examtracker").update({ question: rewritten }).eq("_id", question._id);
      if (error) throw error;
      setQuestions(prev => prev.map(q => q?._id === question._id ? { ...q, question: rewritten } : q));
      toast.success("Rewritten!", { id: tid });
    } catch { toast.error("Failed to rewrite", { id: tid }); }
    finally { setRewritingId(null); }
  }, [extractStem, isAdmin, rewritingId]);

  // ── derived ────────────────────────────────────────────────────────────────
  const savedComp = useMemo(() => new Set((progress.completed ?? []).map(progressQuestionId)), [progress.completed]);
  const savedCorr = useMemo(() => new Set((progress.correct ?? []).map(progressQuestionId)), [progress.correct]);

  const bufferOverlay = useMemo(() => {
    const uid = user?.id;
    if (!uid) return { comp: new Set(), corr: new Set(), ptsDelta: 0 };
    const visible = new Set((questions ?? []).map(q => progressQuestionId(q?._id)).filter(Boolean));
    if (!visible.size) return { comp: new Set(), corr: new Set(), ptsDelta: 0 };
    const area = String(category ?? "").toLowerCase();
    const { entries } = readProgressBuffer(uid) ?? { entries: {} };
    const comp = new Set(), corr = new Set(); let ptsDelta = 0;
    for (const [id, e] of Object.entries(entries ?? {})) {
      const qid = progressQuestionId(id);
      if (!qid || !visible.has(qid) || String(e?.area ?? "") !== area) continue;
      comp.add(qid);
      if (e?.correct === true) { corr.add(qid); if (!savedComp.has(qid)) ptsDelta += typeof e.points === "number" ? e.points : 100; }
    }
    return { comp, corr, ptsDelta };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, category, questions, unsaved, savedComp]);

  const compSet = useMemo(() => {
    const s = new Set(savedComp); bufferOverlay.comp.forEach(id => s.add(id)); return s;
  }, [savedComp, bufferOverlay.comp]);

  const corrSet = useMemo(() => {
    const s = new Set(savedCorr);
    bufferOverlay.comp.forEach(id => { if (bufferOverlay.corr.has(id)) s.add(id); else s.delete(id); });
    return s;
  }, [savedCorr, bufferOverlay.comp, bufferOverlay.corr]);

  const stats = useMemo(() => {
    const comp    = questions.filter(q => compSet.has(progressQuestionId(q._id))).length;
    const corr    = questions.filter(q => corrSet.has(progressQuestionId(q._id))).length;
    const wrong   = comp - corr;
    const pending = questions.length - comp;
    const total   = counts[activeDifficulty] ?? 0;
    return {
      comp, corr, wrong, pending, total,
      pct: total ? Math.round((comp / total) * 100) : 0,
      acc: comp ? Math.round((corr / comp) * 100) : 0,
      pts: progress.points + (bufferOverlay.ptsDelta || 0),
    };
  }, [questions, progress, counts, activeDifficulty, compSet, corrSet, bufferOverlay.ptsDelta]);

  const chapterName = useMemo(
    () => normalizedChapter?.replace(/\b\w/g, c => c.toUpperCase()) ?? "", [normalizedChapter]
  );

  const curQ    = questions[currentIdx];
  const curQid  = curQ ? progressQuestionId(curQ._id) : null;
  const curDone = curQid ? compSet.has(curQid) : false;
  const curCorr = curQid ? corrSet.has(curQid) : false;
  const nVisible = questions.length;
  const diffColor = { easy: "var(--easy)", medium: "var(--med)", hard: "var(--hard)" }[activeDifficulty];
  const firstPendingIdx = useMemo(
    () => questions.findIndex(q => !compSet.has(progressQuestionId(q._id))),
    [questions, compSet]
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="pq">
      <style>{STYLES}</style>
      <MetaDataJobs seoTitle={`${chapterName} Practice`} seoDescription={`Practice ${chapterName} questions.`} />
      <Navbar />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--accent)", animation: "spin .7s linear infinite", margin: "0 auto 14px" }} />
          <p style={{ fontSize: ".85rem", color: "var(--ink3)", fontWeight: 600 }}>Loading questions…</p>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="pq">
        <MetaDataJobs seoTitle={`${chapterName} ${category?.toUpperCase()} Practice`} seoDescription={`Practice ${chapterName} questions.`} />
        <Navbar />

        {/* Bottom sheet (mobile) */}
        {sheetOpen && (
          <NavSheet
            questions={questions} currentIndex={currentIdx}
            completedSet={compSet} correctSet={corrSet}
            onSelect={goTo} onClose={() => setSheetOpen(false)}
            hasMore={hasMore}
            stats={stats}
            user={user}
            unsaved={unsaved}
            saving={saving}
            onSave={saveProgress}
            onSignIn={() => setShowAuthModal(true)}
          />
        )}

        {/* ── TOP BAR ── */}
        <div className="pq-topbar">
          <div className="pq-topbar-row">

            {/* Back */}
            <Link
              href={`/${category}/${subject}`}
              className="btn btn-ghost btn-sm"
              style={{ padding: "6px 10px", textDecoration: "none", flexShrink: 0 }}
            >
              <ArrowLeft size={13} />
              <span style={{ display: "none" }} className="back-label">Back</span>
              <style>{`@media(min-width:640px){.back-label{display:inline}}`}</style>
            </Link>

            {/* Breadcrumb */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
              <span style={{
                fontSize: ".65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em",
                background: "var(--surface2)", border: "1px solid var(--border)", padding: "2px 7px",
                borderRadius: 5, color: "var(--ink2)", flexShrink: 0,
              }}>{category?.toUpperCase()}</span>
              <span style={{ color: "var(--ink4)", fontSize: ".75rem", flexShrink: 0 }}>›</span>
              <span style={{
                fontFamily: "var(--display)", fontStyle: "italic", fontSize: ".9rem",
                color: "var(--ink1)", fontWeight: 600,
                overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
              }}>{chapterName}</span>
            </div>

            {/* Counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--ink1)", fontVariantNumeric: "tabular-nums" }}>
                {currentIdx + 1}
                <span style={{ color: "var(--ink4)", fontWeight: 400 }}>/{nVisible}</span>
              </span>
              <div style={{ width: 64, height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden", flexShrink: 0 }}>
                <div style={{ height: "100%", borderRadius: 99, background: "var(--accent)", transition: "width .5s", width: `${nVisible ? ((currentIdx + 1) / nVisible) * 100 : 0}%` }} />
              </div>
            </div>

            {/* Points */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "var(--accent)", borderRadius: 7, color: "#fff", flexShrink: 0 }}>
              <Award size={12} style={{ opacity: .75 }} />
              <span style={{ fontSize: ".76rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{stats.pts}</span>
            </div>

            {/* Save */}
            {user ? (
              <button
                key={saveBtnKey}
                type="button"
                onClick={saveProgress}
                disabled={!unsaved || saving}
                className={`btn btn-sm ${unsaved ? "btn-ink save-pop" : ""}`}
                style={{ position: "relative", flexShrink: 0 }}
              >
                <Save size={12} />
                <span style={{ display: "none" }} className="save-label">{saving ? "Saving…" : "Save"}</span>
                <style>{`@media(min-width:480px){.save-label{display:inline}}`}</style>
                {unsaved > 0 && <span className="unsaved-badge">{unsaved}</span>}
              </button>
            ) : (
              <button type="button" onClick={() => setShowAuthModal(true)} className="btn btn-sm btn-ink" style={{ flexShrink: 0 }}>
                Sign in
              </button>
            )}
          </div>

          {/* Chapter progress strip */}
          <div className="pq-strip">
            <div className="pq-strip-fill" style={{ width: `${stats.pct}%` }} />
          </div>

          {/* Mobile difficulty row */}
          <div className="pq-diff-row">
            {DIFFICULTIES.map(d => (
              <button key={d} type="button" onClick={() => changeDifficulty(d)} disabled={loadingQ}
                className={`btn btn-sm diff-${d} ${activeDifficulty === d ? "active" : ""}`}
                style={{ flexShrink: 0, gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: activeDifficulty === d ? "rgba(255,255,255,.7)" : diffColor }} />
                <span style={{ textTransform: "capitalize" }}>{d}</span>
                <span style={{ fontWeight: 700, opacity: .75 }}>{counts[d]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="pq-body">

          {/* ── SIDEBAR ── */}
          <aside className="pq-sidebar">

            {/* Chapter info */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <p className="label" style={{ marginBottom: 6 }}>Chapter</p>
              <h2 style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: "1.15rem", fontWeight: 600, color: "var(--ink1)", lineHeight: 1.3, marginBottom: 3 }}>
                {chapterName}
              </h2>
              <p style={{ fontSize: ".68rem", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, color: "var(--ink3)" }}>{category}</p>
            </div>

            {/* Progress */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <p className="label" style={{ marginBottom: 12 }}>Your Progress</p>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Ring pct={stats.pct} size={54} stroke={5} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: ".75rem", fontWeight: 700, color: "var(--ink1)" }}>{stats.pct}%</span>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink1)", lineHeight: 1 }}>
                    {stats.comp}<span style={{ color: "var(--ink4)", fontWeight: 400, fontSize: ".82rem" }}>/{stats.total}</span>
                  </p>
                  <p style={{ fontSize: ".7rem", color: "var(--ink3)", marginTop: 2, fontWeight: 500 }}>questions done</p>
                  <p style={{ fontSize: ".68rem", color: "var(--ink3)", marginTop: 2 }}>{stats.acc}% accuracy</p>
                </div>
              </div>

              <div className="tri-bar" style={{ marginBottom: 9 }}>
                <div className="tri-seg" style={{ flex: stats.corr, background: "var(--easy)", minWidth: stats.corr ? 4 : 0 }} />
                <div className="tri-seg" style={{ flex: stats.wrong, background: "var(--hard)", minWidth: stats.wrong ? 4 : 0 }} />
                <div className="tri-seg" style={{ flex: stats.pending, background: "var(--border)", minWidth: stats.pending ? 4 : 0, borderRadius: "0 99px 99px 0" }} />
              </div>

              <div className="legend-row">
                {[["var(--easy)", "Correct", stats.corr], ["var(--hard)", "Wrong", stats.wrong], ["var(--border2)", "Pending", stats.pending]].map(([c, l, v]) => (
                  <div key={l} className="legend-item">
                    <div className="legend-dot" style={{ background: c }} />{l}: <strong style={{ marginLeft: 2 }}>{v}</strong>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: ".76rem", fontWeight: 600, color: "var(--ink2)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Flame size={13} style={{ color: "var(--med)" }} /> Points earned
                </span>
                <span style={{ fontSize: ".95rem", fontWeight: 700, color: "var(--ink1)" }}>{stats.pts}</span>
              </div>

              {user && unsaved > 0 && (
                <div style={{ marginTop: 10, padding: "8px 10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: ".7rem", color: "#92400E", fontWeight: 700 }}>{unsaved} unsaved</span>
                  <button type="button" onClick={saveProgress} disabled={saving} className="btn btn-sm btn-ink" style={{ padding: "4px 9px" }}>
                    {saving ? "…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {/* Difficulty */}
            <div className="card" style={{ padding: "16px 18px" }}>
              <p className="label" style={{ marginBottom: 10 }}>Difficulty</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {DIFFICULTIES.map(d => (
                  <DiffButton key={d} d={d} count={counts[d]} active={activeDifficulty === d} loading={loadingQ} onClick={() => changeDifficulty(d)} />
                ))}
              </div>
            </div>

            {/* Question map */}
            {questions.length > 0 && (
              <div className="card qmap-card" style={{ overflow: "hidden" }}>
                <div className="qmap-head">
                  <div className="qmap-title">
                    <p className="label">Question Map</p>
                    <p className="qmap-sub">
                      Jump fast · {questions.length}{hasMore ? "+" : ""} loaded
                    </p>
                  </div>
                  <div className="qmap-actions">
                    {firstPendingIdx !== -1 && (
                      <button
                        type="button"
                        className="qmap-mini"
                        onClick={() => goTo(firstPendingIdx)}
                        title={`First pending: Q${firstPendingIdx + 1}`}
                      >
                        Pending
                      </button>
                    )}
                    <button
                      type="button"
                      className="qmap-mini"
                      onClick={() => goTo(currentIdx)}
                      title={`Current: Q${currentIdx + 1}`}
                    >
                      Current
                    </button>
                  </div>
                </div>

                <div className="qmap-jump">
                  <input
                    ref={qmapJumpRef}
                    className="qmap-input"
                    inputMode="numeric"
                    type="number"
                    min={1}
                    max={Math.max(1, questions.length)}
                    placeholder="Jump to question #"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const raw = qmapJumpRef.current?.value;
                      const n = Math.floor(Number(raw));
                      if (!Number.isFinite(n)) return;
                      const i = Math.max(1, Math.min(n, questions.length));
                      goTo(i - 1);
                      if (qmapJumpRef.current) qmapJumpRef.current.value = "";
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ height: 34, padding: "0 10px" }}
                    onClick={() => {
                      const raw = qmapJumpRef.current?.value;
                      const n = Math.floor(Number(raw));
                      if (!Number.isFinite(n)) return;
                      const i = Math.max(1, Math.min(n, questions.length));
                      goTo(i - 1);
                      if (qmapJumpRef.current) qmapJumpRef.current.value = "";
                    }}
                  >
                    Go
                  </button>
                </div>

                <div className="qmap-scroll">
                  <div className="qmap-grid" style={{ paddingBottom: 2 }}>
                  {questions.map((q, i) => {
                    const qid = progressQuestionId(q._id);
                    const ok  = corrSet.has(qid);
                    const bad = compSet.has(qid) && !ok;
                    const cur = i === currentIdx;
                    return (
                      <div key={q._id} className={`dot ${cur ? "dot-cur" : ok ? "dot-ok" : bad ? "dot-err" : ""}`}
                        onClick={() => goTo(i)}
                        title={`Q${i + 1}${cur ? " · Current" : ok ? " · Correct" : bad ? " · Wrong" : " · Pending"}`}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                  </div>
                </div>

                <div className="qmap-foot">
                  <div className="qmap-legend" aria-hidden="true">
                    <span className="qmap-legend-item"><span className="qmap-legend-swatch cur" />Current</span>
                    <span className="qmap-legend-item"><span className="qmap-legend-swatch ok" />Correct</span>
                    <span className="qmap-legend-item"><span className="qmap-legend-swatch err" />Wrong</span>
                    <span className="qmap-legend-item"><span className="qmap-legend-swatch" />Pending</span>
                  </div>
                  <span style={{ fontSize: ".66rem", fontWeight: 800, color: "var(--ink3)", fontVariantNumeric: "tabular-nums" }}>
                    {currentIdx + 1}/{questions.length}
                  </span>
                </div>
              </div>
            )}

            {/* Keyboard hint */}
            <p style={{ fontSize: ".65rem", color: "var(--ink4)", textAlign: "center", padding: "0 4px" }}>
              Use{" "}
              <kbd style={{ padding: "1px 5px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "monospace", fontSize: ".65rem" }}>←</kbd>
              {" "}
              <kbd style={{ padding: "1px 5px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, fontFamily: "monospace", fontSize: ".65rem" }}>→</kbd>
              {" "}to navigate
            </p>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <div style={{ minWidth: 0 }}>

            {/* Mobile: progress + save + stats moved into bottom "Question Map" sheet for more question space */}

            {/* ── Question area ── */}
            {loadingQ && questions.length === 0 ? (
              <div className="card-main" style={{ minHeight: 320 }}><QuestionSkeleton /></div>
            ) : questions.length === 0 ? (
              <div className="card" style={{ padding: "52px 24px", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <AlertCircle size={22} style={{ color: "var(--ink4)" }} />
                </div>
                <h3 style={{ fontFamily: "var(--display)", fontStyle: "italic", fontSize: "1.3rem", color: "var(--ink1)", marginBottom: 8 }}>No questions available</h3>
                <p style={{ fontSize: ".85rem", color: "var(--ink2)" }}>No {activeDifficulty} questions found for this chapter.</p>
              </div>
            ) : curQ ? (
              <div key={animKey} className="card-main q-enter sm:mt-12 mt-20" style={{ overflow: "hidden" }}>

                {/* Card header */}
                <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", background: "var(--surface2)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                    {/* <span className={`btn btn-sm diff-${activeDifficulty}`}
                      style={{ pointerEvents: "none", gap: 4, padding: "3px 9px", fontSize: ".68rem", fontWeight: 700, boxShadow: "none" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: diffColor, flexShrink: 0 }} />
                      <span style={{ textTransform: "capitalize" }}>{activeDifficulty}</span>
                    </span> */}
                    {curQ.topic && (
                      <span className="topic-chip">
                        <BookOpen size={9} />
                        {String(curQ.topic).replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    )}
                    {/* <StatusBadge completed={curDone} correct={curCorr} /> */}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: ".7rem", color: "var(--ink3)", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {currentIdx + 1} <span style={{ color: "var(--ink4)" }}>/ {nVisible}{hasMore ? "+" : ""}</span>
                    </span>
                    {isAdmin && (
                      <button type="button" onClick={() => rewriteQuestion(curQ)} disabled={rewritingId === curQ._id}
                        className="btn btn-ghost btn-sm">
                        {rewritingId === curQ._id ? "…" : "Rewrite"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Question body */}
                <div style={{ padding: "2px 1px" }}>
                  <MathJaxContext config={mathJaxConfig}>
                    <MathJax>
                      <QuestionCard
                        category={category}
                        question={curQ}
                        index={currentIdx}
                        onAnswer={(ok) => handleAnswer(curQ._id, ok, curQ.topic)}
                        isCompleted={compSet.has(progressQuestionId(curQ._id))}
                        isCorrect={corrSet.has(progressQuestionId(curQ._id))}
                        isAdmin={isAdmin}
                      />
                    </MathJax>
                  </MathJaxContext>
                </div>

                {/* Desktop nav footer */}
                <div className="desk-nav" style={{
                  padding: "12px 18px", borderTop: "1px solid var(--border)",
                  alignItems: "center", justifyContent: "space-between", gap: 12,
                  background: "var(--surface2)",
                }}>
                  <button onClick={goPrev} disabled={currentIdx === 0} className="btn" style={{ gap: 5 }}>
                    <ChevronLeft size={14} /> Previous
                  </button>

                  {/* Dot strip */}
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {questions.slice(Math.max(0, currentIdx - 3), currentIdx + 4).map((_, ii) => {
                      const ri = Math.max(0, currentIdx - 3) + ii, cur = ri === currentIdx;
                      return <div key={ri} style={{ width: cur ? 20 : 6, height: 6, borderRadius: 99, background: cur ? "var(--accent)" : "var(--border2)", transition: "all .2s" }} />;
                    })}
                  </div>

                  <button onClick={goNext} disabled={currentIdx === questions.length - 1 && !hasMore}
                    className="btn btn-ink" style={{ gap: 5 }}>
                    {loadingQ && currentIdx >= questions.length - 3 ? "Loading…" : "Next"} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </div>

        {/* ── MOBILE BOTTOM BAR ── */}
        <div className="mob-bar">
          <div className="mob-bar-inner">
            <button onClick={goPrev} disabled={currentIdx === 0} className="mob-icon-btn">
              <ChevronLeft size={18} style={{ color: currentIdx === 0 ? "var(--ink4)" : "var(--ink1)" }} />
            </button>

            <button onClick={() => setSheetOpen(true)} className="mob-center-btn">
              <div style={{ display: "flex", gap: 3, alignItems: "center", flex: 1, overflow: "hidden" }}>
                {questions.slice(0, 10).map((q, i) => {
                  const qid = progressQuestionId(q._id), cur = i === currentIdx;
                  const ok  = corrSet.has(qid), bad = compSet.has(qid) && !ok;
                  return <div key={q._id} style={{
                    width: cur ? 18 : 6, height: 6, borderRadius: 99, flexShrink: 0,
                    background: cur ? "var(--accent)" : ok ? "var(--easy)" : bad ? "var(--hard)" : "var(--border2)",
                    transition: "all .2s",
                  }} />;
                })}
                {questions.length > 10 && (
                  <span style={{ fontSize: ".58rem", color: "var(--ink4)", fontWeight: 700, marginLeft: 2, flexShrink: 0 }}>+{questions.length - 10}</span>
                )}
              </div>
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <p style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--ink1)", lineHeight: 1 }}>{currentIdx + 1}/{nVisible}</p>
                <p style={{ fontSize: ".58rem", color: "var(--ink3)", lineHeight: 1.4 }}>All Qs</p>
              </div>
              <ChevronUp size={13} style={{ color: "var(--ink4)", flexShrink: 0 }} />
            </button>

            <button
              onClick={goNext}
              disabled={currentIdx === questions.length - 1 && !hasMore}
              className="mob-icon-btn"
              style={{
                background: currentIdx === questions.length - 1 && !hasMore ? "var(--surface2)" : "var(--accent)",
                borderColor: currentIdx === questions.length - 1 && !hasMore ? "var(--border)" : "var(--accent)",
              }}
            >
              <ChevronRight size={18} style={{ color: currentIdx === questions.length - 1 && !hasMore ? "var(--ink4)" : "#fff" }} />
            </button>
          </div>
        </div>

        <Toaster
          position="bottom-center"
          toastOptions={{
            style: { fontFamily: "var(--font)", fontSize: ".85rem", borderRadius: 9, marginBottom: 76 },
            success: { style: { background: "#ECFDF5", color: "#059669", border: "1px solid #059669" } },
            error:   { style: { background: "#FEF2F2", color: "#DC2626", border: "1px solid #DC2626" } },
          }}
        />
      </div>
    </>
  );
});

ChapterPracticePage.displayName = "ChapterPracticePage";
export default ChapterPracticePage;