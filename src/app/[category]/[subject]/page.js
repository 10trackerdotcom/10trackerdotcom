"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import debounce from "lodash/debounce";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";
import Navbar from "@/components/Navbar";
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
  const [userProgress, setUserProgress] = useState({});
  const { user, signInWithGoogle, setShowAuthModal } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const searchInputRef = useRef(null);
  const { category, subject } = useParams();
  const [activeSubject, setActiveSubject] = useState(
    category === "gate-cse" && subject
      ? subject.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : subject || ""
  );
  

  const apiEndpoint = `/api/allsubtopics?category=${category?.toUpperCase()}`;
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";

// Updated fetchUserProgress function
const fetchUserProgress = useCallback(
  async (userId) => {
    if (!userId) return;
    
    try {
      const { data: progressData, error } = await supabase
        .from("user_progress")
        .select("topic, completedquestions, correctanswers, points")
        .eq("user_id", userId)
        .eq("area", category?.toLowerCase())
        .limit(100);

      // console.log(progressData, "Consoled Progress Data");
      if (error) throw error;

      // Convert to map with camelCase field names for UI consistency
      const progressMap = {};
      progressData?.forEach((item) => {
        progressMap[item.topic] = {
          completedQuestions: item.completedquestions || [], // Transform to camelCase
          correctAnswers: item.correctanswers || [],         // Transform to camelCase
          points: item.points || 0,
        };
      });
      setUserProgress(progressMap);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      setUserProgress({});
    }
  },
  [category]
);



  // Fetch subjects data with cache
  const fetchData = useCallback(
    debounce(async () => {
      setIsLoading(true);
      try {
        if (user?.id) {
          fetchUserProgress(user.id);
        }
   
        const response = await fetch(apiEndpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error("Failed to fetch data");
        const responseData = await response.json();
        const subjectsData = responseData.subjectsData || [];
        // console.log(subjectsData)
        setData(subjectsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setData([
          { subject: "Compiler Design", subtopics: [{ title: "lexical-analysis", count: 19 }, { title: "parsing", count: 82 }] },
          { subject: "Theory of Computation", subtopics: [{ title: "finite-automata", count: 73 }, { title: "turing-machine", count: 13 }] },
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [apiEndpoint, token, category, user, fetchUserProgress]
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
    let topics = activeSubject 
      ? (data.find((s) => s.subject === activeSubject)?.subtopics || [])
          .map((t) => ({ 
            ...t, 
            parentSubject: activeSubject, 
            uniqueId: `${activeSubject}-${t.title}` 
          })) 
      : allSubtopics;

    if (searchTerm) {
      topics = topics.filter((t) => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return topics.sort((a, b) => {
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
  }, [activeSubject, allSubtopics, searchTerm, sortBy, userProgress]);

// Updated progress calculation with correct field names
const progress = useMemo(() => {
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
}, [allSubtopics, userProgress, totalQuestions]);

  // Effect to fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Suspense fallback={<div>Loading metadata...</div>}>
          <MetaDataJobs
            seoTitle={`${category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} Practice Tracker`}
            seoDescription={`Practice ${category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())} PYQs Topic-Wise Chapter-Wise Date-Wise questions with detailed solutions.`}
          />
        </Suspense>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          transition={{ duration: 0.5 }} 
          className="bg-white p-8 rounded-xl shadow-lg flex items-center space-x-6 max-w-md"
        >
          <div className="h-12 w-12 rounded-full border-4 border-t-indigo-600 border-indigo-100 animate-spin"></div>
          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-1">Loading your dashboard</h3>
            <p className="text-gray-500 text-sm">Please wait a moment...</p>
          </div>
        </motion.div>
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
      <div className="min-h-screen bg-neutral-50 pt-20 pb-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900">{category?.toUpperCase()} Practice Tracker</h1>
              <p className="text-neutral-600 mt-1">Track your progress across {allSubtopics.length} topics and {totalQuestions} questions</p>
            </div>
            <button 
              onClick={() => setShowMobileOptions(true)} 
              className="mt-4 sm:mt-0 md:hidden px-4 py-2 bg-white border border-neutral-300 text-neutral-800 rounded-lg flex items-center justify-center"
              aria-label="Show options and progress"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Options & Progress
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:space-x-8">
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                <h3 className="text-lg font-medium text-neutral-900 mb-4">{category?.toUpperCase()} Tracker</h3>
                {user ? (
                  <div className="mb-6 bg-neutral-100 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3">Your Progress</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Topics</span>
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
                        <div>Topics: {progress.completedCount}/{allSubtopics.length}</div>
                        <div>Questions: {progress.totalCompletedQuestions}/{totalQuestions}</div>
                        <div>Correct: {progress.totalCorrectAnswers}</div>
                        <div>Accuracy: {progress.accuracy}%</div>
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
                              <span>Topics</span>
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
                            <div>Topics: {progress.completedCount}/{allSubtopics.length}</div>
                            <div>Questions: {progress.totalCompletedQuestions}/{totalQuestions}</div>
                            <div>Correct: {progress.totalCorrectAnswers}</div>
                            <div>Accuracy: {progress.accuracy}%</div>
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
              <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h2 className="text-xl font-semibold text-neutral-900">{activeSubject || "All Subjects"}</h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      {activeSubject 
                        ? `${data.find((s) => s.subject === activeSubject)?.subtopics?.length || 0} topics` 
                        : `${allSubtopics.length} topics across ${data.length} subjects`}
                    </p>
                  </div>
                  <div className="relative sm:max-w-xs w-full">
                    <svg className="h-5 w-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search topics (Ctrl + /)"
                      className="pl-10 pr-4 py-2 w-full border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{topic.title.replace(/-/g, " ")}</h3>
                            <div className="text-sm text-gray-500">{topic.parentSubject}</div>
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

              {filteredAndSortedTopics.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-neutral-200">
                  <svg className="h-12 w-12 text-neutral-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No topics found</h3>
                  <p className="text-neutral-500">{searchTerm ? `No topics match "${searchTerm}"` : "No topics available"}</p>
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