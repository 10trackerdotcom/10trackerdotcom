"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, FileText } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "@/components/Navbar";
import { getCachedData, invalidateCache } from "@/lib/utils/apiCache";
// Lazy-loaded components
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"), { ssr: false });

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex justify-center items-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-neutral-200 max-w-md">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-3">Something went wrong</h1>
            <p className="text-neutral-600 mb-4">Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 transition duration-150">
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Examtracker = () => {
  const [data, setData] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [chapterTopics, setChapterTopics] = useState({}); // Store topics for each chapter for progress calculation
  const [userProgress, setUserProgress] = useState({});
  const { user, signInWithGoogle, setShowAuthModal } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const searchInputRef = useRef(null);
  const { category, subject } = useParams();
  
  // Check if category is a GATE exam
  const isGateExam = useMemo(() => {
    const cat = category?.toLowerCase();
    return cat === 'gate-cse' || cat === 'gate-me' || cat === 'gate-ex' || cat === 'upsc-prelims' || cat === 'gate-ec' || cat === 'gate-ee' || cat === 'gate-da' || cat === 'gate-me' || cat === 'quant-aptitude' || cat === 'verbal-reasoning' || cat === 'non-verbal-reasoning' || cat === 'verbal-ability';
  }, [category]);
  
  // Properly decode and format subject from URL
  const decodedSubject = subject ? decodeURIComponent(subject) : null;
  const formattedSubject = decodedSubject 
    ? decodedSubject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;
  
  const [activeSubject, setActiveSubject] = useState(formattedSubject || "");

  // Properly encode category to handle hyphens and special characters
  const encodedCategory = category ? encodeURIComponent(category.toUpperCase()) : '';
  const apiEndpoint = `/api/allsubtopics?category=${encodedCategory}`;
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";
  
  // Cache refresh interval (every 5 minutes - reduced frequency)
  const cacheRefreshInterval = useRef(null);
  
  // Client-side cache key
  const cacheKey = useMemo(() => `subjects-${category}`, [category]);
  const chaptersCacheKey = useMemo(() => `chapters-${category}-${subject}`, [category, subject]);

  // Update activeSubject when URL parameter changes
  useEffect(() => {
    const newSubject = formattedSubject || "";
    setActiveSubject(newSubject);
  }, [subject, formattedSubject, decodedSubject]);

// Updated fetchUserProgress function with caching
const fetchUserProgress = useCallback(
  async (userId) => {
    if (!userId || !category) {
      return;
    }
    
    const progressCacheKey = `user-progress-${userId}-${category}`;
    
    try {
      // Use cached data if available (2 minute TTL for user progress)
      const cachedProgress = await getCachedData(
        progressCacheKey,
        async () => {
          const { data: progressData, error } = await supabase
            .from("user_progress")
            .select("topic, completedquestions, correctanswers, points")
            .eq("user_id", userId)
            .eq("area", category?.toLowerCase())
            .limit(100);

          if (error) throw error;

          // Convert to map with camelCase field names for UI consistency
          const progressMap = {};
          progressData?.forEach((item) => {
            progressMap[item.topic] = {
              completedQuestions: item.completedquestions || [],
              correctAnswers: item.correctanswers || [],
              points: item.points || 0,
            };
          });
          return progressMap;
        },
        2 * 60 * 1000 // 2 minutes TTL
      );
      
      setUserProgress(cachedProgress || {});
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching user progress:", error);
      }
      setUserProgress({});
    }
  },
  [category]
);



  // Fetch chapters for non-GATE exams
  const fetchChapters = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      
      try {
        if (forceRefresh) {
          invalidateCache(chaptersCacheKey);
        }

        const encodedCategory = encodeURIComponent(category?.toUpperCase() || '');
        const encodedSubject = subject ? encodeURIComponent(subject) : '';
        const apiUrl = `/api/chapters/by-subject?category=${encodedCategory}&subject=${encodedSubject}`;
        
        const chaptersData = await getCachedData(
          chaptersCacheKey,
          async () => {
            const response = await fetch(apiUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch chapters: ${response.status}`);
            }
            const result = await response.json();
            return result.success ? (result.data?.chapters || []) : [];
          },
          5 * 60 * 1000 // 5 minutes TTL
        );
        
        setChapters(chaptersData || []);
        
        // Fetch topics for each chapter to calculate progress (async, non-blocking)
        if (chaptersData && chaptersData.length > 0) {
          const topicsMap = {};
          // Fetch topics for all chapters in parallel
          const topicPromises = chaptersData.map(async (chapter) => {
            try {
              const chapterSlug = chapter.slug || chapter.title.toLowerCase().replace(/\s+/g, "-");
              const topicsUrl = `/api/topics/by-chapter?category=${encodedCategory}&subject=${encodedSubject}&chapter=${encodeURIComponent(chapterSlug)}`;
              const topicsResponse = await fetch(topicsUrl);
              if (topicsResponse.ok) {
                const topicsResult = await topicsResponse.json();
                if (topicsResult.success) {
                  return { chapterKey: chapter.slug || chapter.title, topics: topicsResult.data?.topics || [] };
                }
              }
            } catch (err) {
              // Silently fail for individual chapters
            }
            return { chapterKey: chapter.slug || chapter.title, topics: [] };
          });
          
          const topicsResults = await Promise.all(topicPromises);
          topicsResults.forEach(({ chapterKey, topics }) => {
            topicsMap[chapterKey] = topics;
          });
          setChapterTopics(topicsMap);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching chapters:", error);
        }
        setChapters([]);
      } finally {
        setIsLoading(false);
      }
    },
    [category, subject, chaptersCacheKey]
  );

  // Fetch subjects/topics data for GATE exams (old version)
  const fetchData = useCallback(
    async (forceRefresh = false) => {
      setIsLoading(true);
      
      try {
        // Invalidate cache if force refresh
        if (forceRefresh) {
          invalidateCache(cacheKey);
        }
        
        // Use cached data or fetch fresh
        const subjectsData = await getCachedData(
          cacheKey,
          async () => {
            const response = await fetch(apiEndpoint, {
              method: "GET",
              headers: { 
                Authorization: `Bearer ${token}`,
                'Cache-Control': 'max-age=300' // 5 minutes browser cache
              },
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to fetch data: ${response.status} ${errorText}`);
            }
            
            const responseData = await response.json();
            return responseData.subjectsData || [];
          },
          5 * 60 * 1000 // 5 minutes TTL
        );
        
        setData(subjectsData || []);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching data:", error);
        }
        // Set fallback data only in development
        if (process.env.NODE_ENV === 'development') {
          const fallbackData = [
            { subject: "Compiler Design", subtopics: [{ title: "lexical-analysis", count: 19 }, { title: "parsing", count: 82 }] },
            { subject: "Theory of Computation", subtopics: [{ title: "finite-automata", count: 73 }, { title: "turing-machine", count: 13 }] },
          ];
          setData(fallbackData);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, token, cacheKey]
  );

  // Google Sign-In with Supabase
  // const handleGoogleSignIn = useCallback(async () => {
  //   try {
  //     const { data, error } = await supabase.auth.signInWithOAuth({
  //       provider: "google",
  //       options: { redirectTo: window.location.origin },
  //     });
  //     if (error) throw error;
  //     setShowAuthModal(false);
  //     toast.success("Successfully signed in!");
  //   } catch (error) {
  //     toast.error("Authentication failed");
  //     console.error(error);
  //   }
  // }, []);

  // Memoized calculations
  const totalQuestions = useMemo(() => 
    data.reduce((acc, subject) => 
      acc + (subject.subtopics || []).reduce((sum, topic) => 
        sum + (topic.count || 0), 0), 0), 
    [data]
  );
  
  const allSubtopics = useMemo(() => 
    data.flatMap((subject) => 
      (subject.subtopics || []).map((topic) => ({ 
        ...topic, 
        parentSubject: subject.subject, 
        uniqueId: `${subject.subject}-${topic.title}` 
      }))), 
    [data]
  );
  
  const filteredAndSortedTopics = useMemo(() => {
    let topics = [];
    
    if (activeSubject) {
      // Try exact match first
      let foundSubject = data.find((s) => s.subject === activeSubject);
      
      // If not found, try case-insensitive match
      if (!foundSubject) {
        foundSubject = data.find((s) => 
          s.subject.toLowerCase() === activeSubject.toLowerCase()
        );
      }
      
      // If still not found, try matching with normalized formatting (handle hyphens, spaces, etc.)
      if (!foundSubject) {
        const normalize = (str) => str.toLowerCase().replace(/[-\s]/g, '');
        foundSubject = data.find((s) => 
          normalize(s.subject) === normalize(activeSubject)
        );
      }
      
      if (foundSubject && foundSubject.subtopics) {
        topics = foundSubject.subtopics.map((t) => ({ 
          ...t, 
          parentSubject: foundSubject.subject, 
          uniqueId: `${foundSubject.subject}-${t.title}` 
        }));
      } else {
        // Fallback to all topics if subject not found
        topics = allSubtopics;
      }
    } else {
      topics = allSubtopics;
    }

    if (searchTerm) {
      topics = topics.filter((t) => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sorted = topics.sort((a, b) => {
      const aCompleted = userProgress[a.title]?.completedQuestions?.length || 0;
      const bCompleted = userProgress[b.title]?.completedQuestions?.length || 0;
      const aTotal = a.count || 1;
      const bTotal = b.count || 1;
      
      switch (sortBy) {
        case "progress": 
          return (bCompleted / bTotal) - (aCompleted / aTotal);
        case "remaining": 
          return (bTotal - bCompleted) - (aTotal - aCompleted);
        default: 
          return activeSubject 
            ? a.title.localeCompare(b.title) 
            : a.parentSubject.localeCompare(b.parentSubject) || a.title.localeCompare(b.title);
      }
    });
    
    return sorted;
  }, [activeSubject, allSubtopics, searchTerm, sortBy, userProgress, data]);

// Calculate chapter progress for non-GATE exams
const chapterProgress = useMemo(() => {
  if (isGateExam) return {};
  
  const progressMap = {};
  chapters.forEach(chapter => {
    const chapterKey = chapter.slug || chapter.title;
    const topics = chapterTopics[chapterKey] || [];
    
    // Calculate progress from topics in this chapter
    const totalQuestions = topics.reduce((sum, topic) => sum + (topic.count || 0), 0);
    const completedQuestions = topics.reduce((sum, topic) => {
      const topicProgress = userProgress[topic.title];
      return sum + (topicProgress?.completedQuestions?.length || 0);
    }, 0);
    const correctAnswers = topics.reduce((sum, topic) => {
      const topicProgress = userProgress[topic.title];
      return sum + (topicProgress?.correctAnswers?.length || 0);
    }, 0);
    
    const completedTopics = topics.filter(topic => {
      const topicProgress = userProgress[topic.title];
      return topicProgress && (topicProgress.completedQuestions?.length || 0) > 0;
    }).length;
    
    progressMap[chapterKey] = {
      totalQuestions: totalQuestions || chapter.count || 0,
      completedQuestions,
      correctAnswers,
      completedTopics,
      totalTopics: topics.length,
      progressPercentage: (totalQuestions || chapter.count || 0) ? Math.round((completedQuestions / (totalQuestions || chapter.count || 0)) * 100) : 0,
      accuracy: completedQuestions > 0 ? Math.round((correctAnswers / completedQuestions) * 100) : 0,
      isCompleted: topics.length > 0 && completedTopics === topics.length && topics.length > 0
    };
  });
  
  return progressMap;
}, [chapters, chapterTopics, userProgress, isGateExam]);

// Updated progress calculation with correct field names
const progress = useMemo(() => {
  if (isGateExam) {
    // GATE exam progress (topics-based)
  const totalTopics = allSubtopics.length;
  const completedTopics = Object.keys(userProgress).filter(
    (t) => (userProgress[t].completedQuestions?.length || 0) > 0
  );
  
  const totalCompletedQuestions = Object.values(userProgress).reduce(
    (acc, t) => acc + (t.completedQuestions?.length || 0), 0
  );
  
  const totalCorrectAnswers = Object.values(userProgress).reduce(
    (acc, t) => acc + (t.correctAnswers?.length || 0), 0
  );

  return {
    completedCount: completedTopics.length,
    completionPercentage: totalTopics ? Math.round((completedTopics.length / totalTopics) * 100) : 0,
    totalCompletedQuestions,
    totalCorrectAnswers,
    questionCompletionPercentage: totalQuestions ? Math.round((totalCompletedQuestions / totalQuestions) * 100) : 0,
    accuracy: totalCompletedQuestions > 0 ? Math.round((totalCorrectAnswers / totalCompletedQuestions) * 100) : 0
  };
  } else {
    // Non-GATE exam progress (chapters-based)
    const totalChapters = chapters.length;
    const completedChapters = chapters.filter(chapter => {
      const chapterKey = chapter.slug || chapter.title;
      const progress = chapterProgress[chapterKey];
      return progress && progress.isCompleted;
    }).length;
    
    const totalQuestions = chapters.reduce((sum, chapter) => {
      const chapterKey = chapter.slug || chapter.title;
      const progress = chapterProgress[chapterKey];
      return sum + (progress?.totalQuestions || chapter.count || 0);
    }, 0);
    
    const totalCompletedQuestions = chapters.reduce((sum, chapter) => {
      const chapterKey = chapter.slug || chapter.title;
      const progress = chapterProgress[chapterKey];
      return sum + (progress?.completedQuestions || 0);
    }, 0);
    
    const totalCorrectAnswers = chapters.reduce((sum, chapter) => {
      const chapterKey = chapter.slug || chapter.title;
      const progress = chapterProgress[chapterKey];
      return sum + (progress?.correctAnswers || 0);
    }, 0);

    return {
      completedCount: completedChapters,
      completionPercentage: totalChapters ? Math.round((completedChapters / totalChapters) * 100) : 0,
      totalCompletedQuestions,
      totalCorrectAnswers,
      questionCompletionPercentage: totalQuestions ? Math.round((totalCompletedQuestions / totalQuestions) * 100) : 0,
      accuracy: totalCompletedQuestions > 0 ? Math.round((totalCorrectAnswers / totalCompletedQuestions) * 100) : 0
    };
  }
}, [allSubtopics, userProgress, totalQuestions, isGateExam, chapters, chapterProgress]);

  // Filtered chapters for non-GATE exams
  const filteredAndSortedChapters = useMemo(() => {
    if (isGateExam) return [];
    
    let filtered = chapters;
    
    if (searchTerm) {
      filtered = filtered.filter((chapter) =>
        chapter.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    const sorted = filtered.sort((a, b) => {
      const aProgress = chapterProgress[a.slug || a.title] || {};
      const bProgress = chapterProgress[b.slug || b.title] || {};
      
      switch (sortBy) {
        case "progress": 
          return (bProgress.progressPercentage || 0) - (aProgress.progressPercentage || 0);
        case "remaining": 
          return ((aProgress.totalQuestions || 0) - (aProgress.completedQuestions || 0)) - ((bProgress.totalQuestions || 0) - (bProgress.completedQuestions || 0));
        default: 
          return a.title.localeCompare(b.title);
      }
    });
    
    return sorted;
  }, [chapters, searchTerm, sortBy, chapterProgress, isGateExam]);

  // Effect to fetch data when component mounts or category/subject changes
  useEffect(() => {
    if (isGateExam) {
      // For GATE exams, fetch topics (old behavior)
    fetchData(false);
    cacheRefreshInterval.current = setInterval(() => {
      fetchData(true);
      }, 5 * 60 * 1000);
    } else {
      // For non-GATE exams, fetch chapters
      fetchChapters(false);
      cacheRefreshInterval.current = setInterval(() => {
        fetchChapters(true);
      }, 5 * 60 * 1000);
    }
    
    // Cleanup interval on unmount
    return () => {
      if (cacheRefreshInterval.current) {
        clearInterval(cacheRefreshInterval.current);
      }
    };
  }, [fetchData, fetchChapters, isGateExam]);

  // Effect to fetch user progress when user changes
  useEffect(() => {
    if (user?.id) {
  // {console.log(user)}

      fetchUserProgress(user.id);
    } else {
      // Clear progress when user logs out
      setUserProgress({});
    }
  }, [user, fetchUserProgress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && searchTerm) setSearchTerm("");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm]);


  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <Suspense fallback={<div>Loading metadata...</div>}>
          <MetaDataJobs
            seoTitle={`${category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} Practice Tracker`}
            seoDescription={`Practice ${category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} PYQs Topic-Wise Chapter-Wise Date-Wise questions with detailed solutions.`}
          />
        </Suspense>
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] pt-20 px-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5 }} 
            className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-3 sm:space-x-6 max-w-md w-full"
          >
            <div className="w-6 h-6 sm:w-12 sm:h-12 rounded-full border-4 border-t-indigo-600 border-indigo-100 animate-spin flex-shrink-0"></div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-medium text-neutral-900 mb-1">Loading your dashboard</h3>
              <p className="text-xs sm:text-sm text-neutral-600">Please wait a moment...</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading metadata...</div>}>
        <MetaDataJobs
          seoTitle={`${category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} Practice Tracker`}
          seoDescription={`Practice ${category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} PYQs Topic-Wise Chapter-Wise Date-Wise questions with detailed solutions.`}
        />
      </Suspense>
      <Suspense fallback={<div>Loading navbar...</div>}>
        <Navbar/>
      </Suspense>
      <div className="min-h-screen bg-neutral-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-16">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-neutral-900">{category?.toUpperCase()} Practice Tracker</h1>
              <p className="text-sm sm:text-base text-neutral-600 mt-1">
                {isGateExam 
                  ? `Track your progress across ${allSubtopics.length} topics and ${totalQuestions} questions`
                  : `Browse ${chapters.length} chapters for ${formattedSubject || 'this subject'}`
                }
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center gap-2">
              <button 
                onClick={() => isGateExam ? fetchData(true) : fetchChapters(true)}
                disabled={isLoading}
                className="px-3 py-2 bg-white border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 disabled:opacity-50 text-sm flex items-center gap-2 transition-colors"
                aria-label="Refresh data"
                title="Refresh data (clears cache)"
              >
                <svg className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button 
                onClick={() => setShowMobileOptions(true)} 
                className="md:hidden px-4 py-2 bg-white border border-neutral-300 text-neutral-800 rounded-lg flex items-center justify-center"
                aria-label="Show options and progress"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Options & Progress
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-20 bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">{category?.toUpperCase()} Tracker</h3>
                {user ? (
                  <div className="mb-6 bg-neutral-100 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3">Your Progress</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{isGateExam ? "Topics" : "Chapters"}</span>
                          <span>{progress.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2.5">
                          <div 
                            className="bg-neutral-800 h-2.5 rounded-full" 
                            style={{ width: `${progress.completionPercentage}%` }} 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {isGateExam ? (
                          <>
                        <div>Topics: {progress.completedCount}/{allSubtopics.length}</div>
                        <div>Questions: {progress.totalCompletedQuestions}/{totalQuestions}</div>
                        <div>Correct: {progress.totalCorrectAnswers}</div>
                        <div>Accuracy: {progress.accuracy}%</div>
                          </>
                        ) : (
                          <>
                            <div>Chapters: {progress.completedCount}/{chapters.length}</div>
                            <div>Questions: {progress.totalCompletedQuestions}/{chapters.reduce((sum, c) => {
                              const chapterKey = c.slug || c.title;
                              const chapterProg = chapterProgress[chapterKey];
                              return sum + (chapterProg?.totalQuestions || c.count || 0);
                            }, 0)}</div>
                            <div>Correct: {progress.totalCorrectAnswers}</div>
                            <div>Accuracy: {progress.accuracy}%</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 bg-neutral-100 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-neutral-800 mb-2">Track Your Progress</h4>
                    <button 
                      onClick={() => setShowAuthModal(true)} 
                      className="w-full py-2 border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 transition duration-150"
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
                        className={`w-full text-left px-3 py-2 rounded-lg transition ${
                          sortBy === option ? "bg-neutral-100 text-neutral-900" : "text-neutral-700 hover:bg-neutral-100"
                        }`} 
                        onClick={() => setSortBy(option)}
                        aria-label={`Sort by ${option}`}
                        aria-pressed={sortBy === option}
                      >
                        Sort by {option.charAt(0).toUpperCase() + option.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showMobileOptions && (
                <motion.div 
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                >
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4 pb-8 border-t border-neutral-200" 
                    initial={{ y: "100%" }} 
                    animate={{ y: 0 }} 
                    exit={{ y: "100%" }} 
                    transition={{ type: "spring", damping: 25 }}
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
                    {user ? (
                      <div className="mb-6 bg-neutral-100 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-neutral-800 mb-3">Your Progress</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{isGateExam ? "Topics" : "Chapters"}</span>
                              <span>{progress.completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2.5">
                              <div 
                                className="bg-neutral-800 h-2.5 rounded-full" 
                                style={{ width: `${progress.completionPercentage}%` }} 
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {isGateExam ? (
                              <>
                            <div>Topics: {progress.completedCount}/{allSubtopics.length}</div>
                            <div>Questions: {progress.totalCompletedQuestions}/{totalQuestions}</div>
                            <div>Correct: {progress.totalCorrectAnswers}</div>
                            <div>Accuracy: {progress.accuracy}%</div>
                              </>
                            ) : (
                              <>
                                <div>Chapters: {progress.completedCount}/{chapters.length}</div>
                                <div>Questions: {progress.totalCompletedQuestions}/{chapters.reduce((sum, c) => {
                                  const chapterKey = c.slug || c.title;
                                  const chapterProg = chapterProgress[chapterKey];
                                  return sum + (chapterProg?.totalQuestions || c.count || 0);
                                }, 0)}</div>
                                <div>Correct: {progress.totalCorrectAnswers}</div>
                                <div>Accuracy: {progress.accuracy}%</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6 bg-neutral-100 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-neutral-800 mb-2">Track Your Progress</h4>
                        <button 
                          onClick={() => { 
                            setShowAuthModal(true); 
                            setShowMobileOptions(false); 
                          }} 
                          className="w-full py-2 border border-neutral-300 text-neutral-800 rounded-lg hover:bg-neutral-50 transition duration-150"
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
                            className={`w-full text-left px-3 py-2 rounded-lg transition ${
                              sortBy === option ? "bg-neutral-100 text-neutral-900" : "text-neutral-700 hover:bg-neutral-100"
                            }`} 
                            onClick={() => { 
                              setSortBy(option); 
                              setShowMobileOptions(false); 
                            }}
                            aria-label={`Sort by ${option}`}
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

            <div className="md:flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">{activeSubject || "All Subjects"}</h2>
                    {/* <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                      {activeSubject 
                        ? `${data.find((s) => s.subject === activeSubject)?.subtopics?.length || 0} topics` 
                        : `${allSubtopics.length} topics across ${data.length} subjects`}
                    </p> */}
                  </div>
                  <div className="relative sm:max-w-xs w-full">
                    <svg className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search topics (Ctrl + /)"
                      className="pl-10 pr-10 sm:pr-4 py-2.5 sm:py-2 w-full border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 text-sm sm:text-base"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      ref={searchInputRef}
                      aria-label="Search topics"
                    />
                    {searchTerm && (
                      <button 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2" 
                        onClick={() => setSearchTerm("")}
                        aria-label="Clear search"
                      >
                        <svg className="h-5 w-5 text-neutral-400 hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <Suspense fallback={<div>Loading alert...</div>}>
                <Alert 
                  type="info" 
                  message="We update our question bank daily. Found an issue? Report it — we'll fix it within 48 hrs!" 
                  linkText="Learn More" 
                  linkHref="https://examtracker.in/about-us" 
                  dismissible={true} 
                />
              </Suspense>

              {/* Render chapters for non-GATE exams, topics for GATE exams */}
              {!isGateExam ? (
                // Chapters view for non-GATE exams - matching topic card style
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredAndSortedChapters.map((chapter) => {
                    const chapterSlug = chapter.slug || chapter.title.toLowerCase().replace(/\s+/g, "-");
                    const chapterKey = chapter.slug || chapter.title;
                    const progress = chapterProgress[chapterKey] || {
                      totalQuestions: chapter.count || 0,
                      completedQuestions: 0,
                      correctAnswers: 0,
                      completedTopics: 0,
                      totalTopics: 0,
                      progressPercentage: 0,
                      accuracy: 0,
                      isCompleted: false
                    };
                    
                    const completedCount = progress.completedQuestions || 0;
                    const totalQuestions = progress.totalQuestions || chapter.count || 0;
                    const progressPercentage = totalQuestions ? Math.round((completedCount / totalQuestions) * 100) : 0;
                    const isCompleted = progress.isCompleted;
                    const accuracyPercentage = progress.accuracy || 0;
                    
                    return (
                      <motion.div
                        key={chapter.slug || chapter.title}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`bg-white rounded-xl shadow-sm border ${
                          isCompleted ? "border-green-200" : completedCount > 0 ? "border-neutral-300" : "border-neutral-200"
                        } hover:shadow-md transition-shadow duration-200`}
                      >
                        <div className="p-4 sm:p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-base sm:text-lg font-medium text-neutral-900 line-clamp-2">
                                {chapter.title}
                              </h3>
                              <div className="text-xs sm:text-sm text-neutral-500">{chapter.subject || formattedSubject}</div>
                            </div>
                            {isCompleted && (
                              <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                                Completed
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>{completedCount} of {totalQuestions} questions</span>
                              <span>{progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  isCompleted ? "bg-green-500" : completedCount > 0 ? "bg-neutral-800" : "bg-neutral-300"
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            {completedCount > 0 && (
                              <div className="flex justify-between text-xs text-neutral-500">
                                <span>Accuracy: {accuracyPercentage}%</span>
                                <span>Topics: {progress.completedTopics}/{progress.totalTopics}</span>
                              </div>
                            )}
                            <Link
                              href={`/${category}/${subject}/${chapterSlug}`}
                              className={`block text-center py-2 rounded-lg border ${
                                isCompleted 
                                  ? "border-green-300 text-green-800 hover:bg-green-50" 
                                  : "border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                              } transition-colors duration-150`}
                            >
                              View Topics
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                // Topics view for GATE exams (existing code)
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* // Updated topic card rendering with correct field names */}
{filteredAndSortedTopics.map((topic) => {
  const topicProgress = userProgress[topic.title] || { 
    completedQuestions: [], 
    correctAnswers: [], 
    points: 0 
  };
  const completedCount = topicProgress.completedQuestions?.length || 0;
  const correctCount = topicProgress.correctAnswers?.length || 0;
  const progressPercentage = topic.count ? Math.round((completedCount / topic.count) * 100) : 0;
  const isCompleted = completedCount === topic.count && topic.count > 0;
  const accuracyPercentage = completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0;

                  return (
                    <motion.div
                      key={topic.uniqueId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`bg-white rounded-xl shadow-sm border ${
                        isCompleted ? "border-green-200" : completedCount > 0 ? "border-neutral-300" : "border-neutral-200"
                      } hover:shadow-md transition-shadow duration-200`}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                        <h3 className="text-base sm:text-lg font-medium text-neutral-900 line-clamp-2">{topic.title.replace(/-/g, " ")}</h3>
                        <div className="text-xs sm:text-sm text-neutral-500">{topic.parentSubject}</div>
                          </div>
                          {isCompleted && (
                            <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>{completedCount} of {topic.count} questions</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                isCompleted ? "bg-green-500" : completedCount > 0 ? "bg-neutral-800" : "bg-neutral-300"
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          {completedCount > 0 && (
                            <div className="flex justify-between text-xs text-neutral-500">
                              <span>Accuracy: {accuracyPercentage}%</span>
                              <span>Points: {topicProgress.points}</span>
                            </div>
                          )}
                          <a
                            href={`/${category}/practice/${topic.title}`}
                            className={`block text-center py-2 rounded-lg border ${
                              isCompleted 
                                ? "border-green-300 text-green-800 hover:bg-green-50" 
                                : "border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                            } transition-colors duration-150`}
                          >
                            {completedCount > 0 ? "Continue" : "Start"} Practice
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              )}

              {((isGateExam && filteredAndSortedTopics.length === 0) || (!isGateExam && filteredAndSortedChapters.length === 0)) && (
                <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center border border-neutral-200">
                  <svg className="h-10 w-10 sm:h-12 sm:w-12 text-neutral-400 mx-auto mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">
                    {isGateExam ? "No topics found" : "No chapters found"}
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-500 mb-4">
                    {searchTerm 
                      ? `No ${isGateExam ? 'topics' : 'chapters'} match "${searchTerm}"` 
                      : activeSubject 
                        ? `No ${isGateExam ? 'topics' : 'chapters'} found for "${activeSubject}"` 
                        : `No ${isGateExam ? 'topics' : 'chapters'} available`}
                  </p>
                  {/* Debug info in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-4 bg-neutral-50 rounded-lg text-left text-xs">
                      <p className="font-semibold mb-2">Debug Info:</p>
                      <p>Data length: {data.length}</p>
                      <p>All subtopics: {allSubtopics.length}</p>
                      <p>Active subject: {activeSubject || "None"}</p>
                      <p>Available subjects: {data.map(s => s.subject).join(", ") || "None"}</p>
                      <p>Is loading: {isLoading ? "Yes" : "No"}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden fixed bottom-6 right-6 z-30">
          <button 
            onClick={() => setShowMobileOptions(true)} 
            className="h-14 w-14 rounded-full bg-white text-neutral-800 border border-neutral-300 shadow-sm flex items-center justify-center hover:bg-neutral-50" 
            aria-label="Show options"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

        {/* Auth modal will only be shown when explicitly triggered elsewhere */}
        
        <Toaster position="bottom-right" />
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(Examtracker);