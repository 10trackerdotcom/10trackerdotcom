"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";
import debounce from "lodash/debounce";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/context/AuthContext";

// Lazy-loaded components
const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });
const Alert = dynamic(() => import("@/components/Alert"), { ssr: false });
const MetaDataJobs = dynamic(() => import("@/components/Seo"), { ssr: false });
const BuyNow = dynamic(() => import("@/components/BuyNowYearWise"), { ssr: false });

// Supabase configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { fetch: (...args) => fetch(...args) }
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
            <svg className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Something went wrong</h1>
            <p className="text-gray-600 mb-4">Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200">
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
  const { user, setShowAuthModal, signInWithGoogle } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [orderChecking, setOrderChecking] = useState(false);
  const [selectedPracticeUrl, setSelectedPracticeUrl] = useState(null);
  const searchInputRef = useRef(null);
  const { category } = useParams();

  const categoryTitle = useMemo(() => 
    category?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) || 'Practice',
  [category]);
  
  const apiEndpoint = `/api/year-wise?category=${category?.toUpperCase() || ''}`;
  const token = "eyJhbGciOiJIUzIVoltageIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8";

  // Fetch year data with optimized cache handling
  const fetchData = useCallback(
    debounce(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(apiEndpoint, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error("Failed to fetch data");
        const responseData = await response.json();
        const yearData = responseData.yearData || [];
        setData(yearData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [apiEndpoint, token, category]
  );

  // Fetch order status from Supabase with cache
  const fetchOrderStatus = useCallback(async (email) => {
    if (!email) return false;
    
    try {
      // const { data, error } = await supabase
      //   .from('orders')
      //   .select('status')
      //   .eq('user_email', email)
      //   .eq('plan', category)
      //   .order('created_at', { ascending: false })
      //   .limit(1);
  
      // if (error) throw new Error(error.message || 'Failed to fetch order status');
      
      // const hasAccess = data[0]?.status === "completed";
      
      return true;
    } catch (err) {
      console.error('Order fetch error:', err.message);
      return false;
    }
  }, [category]);

  // Handle practice button click with optimistic UI
  const handlePracticeClick = useCallback(async (url) => {
    if (!user) {
      setShowAuthModal(true);
      setSelectedPracticeUrl(url);
      return;
    }

    // Show optimistic indication
    const toastId = toast.loading("Checking access...");
    setOrderChecking(true);
    
    try {
      const hasAccess = await fetchOrderStatus(user.email);
      toast.dismiss(toastId);
      
      if (hasAccess) {
        toast.success("Access granted! Redirecting...");
        setTimeout(() => {
          window.location.href = url;
        }, 500);
      } else {
        setShowBuyModal(true);
        setSelectedPracticeUrl(url);
      }
    } catch (err) {
      toast.error("Failed to verify access");
      toast.dismiss(toastId);
    } finally {
      setOrderChecking(false);
    }
  }, [user, fetchOrderStatus, setShowAuthModal]);

  // Handle successful purchase with smoother UX
  const handlePurchaseSuccess = useCallback(() => {
    setShowBuyModal(false);
    if (selectedPracticeUrl) {
      toast.success("Purchase successful! Redirecting to practice...");
      // Small delay for better UX
      setTimeout(() => {
        window.location.href = selectedPracticeUrl;
      }, 1000);
    }
  }, [selectedPracticeUrl]);

  // Streamlined closing of modals
  const handleCloseModal = useCallback(() => {
    setShowBuyModal(false);
    setSelectedPracticeUrl(null);
  }, []);

  // Memoized calculations
  const totalQuestions = useMemo(() => 
    data.reduce((acc, year) => acc + (year.count || 0), 0), 
    [data]
  );
  
  const allYears = useMemo(() => 
    data.map((year) => ({
      ...year,
      uniqueId: year.year
    })), 
    [data]
  );
  
  const filteredAndSortedYears = useMemo(() => {
    let years = allYears;
  
    if (searchTerm) {
      years = years.filter((y) => 
        y.year.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    return years; // No sorting
  }, [allYears, searchTerm]);
  

  // Effect to fetch data when component mounts
  useEffect(() => {
    fetchData();
    
    // Prefetch order status if user is logged in
    if (user?.email) {
      fetchOrderStatus(user.email);
    }
  }, [fetchData, user, fetchOrderStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        if (searchTerm) {
          setSearchTerm("");
        } else if (showBuyModal) {
          handleCloseModal();
        } else if (showMobileOptions) {
          setShowMobileOptions(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm, showBuyModal, showMobileOptions, handleCloseModal]);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Suspense fallback={<div>Loading metadata...</div>}>
          <MetaDataJobs
            seoTitle={`${categoryTitle} Practice Tracker`}
            seoDescription={`Practice ${categoryTitle} PYQs Year-Wise with detailed solutions.`}
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

  // Empty state
  if (allYears.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <Suspense fallback={<div>Loading navbar...</div>}>
          <Navbar/>
        </Suspense>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center h-[80vh]">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md w-full">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No practice materials found</h3>
            <p className="text-gray-500 mb-4">We couldn&apos;t find any practice materials for {categoryTitle}.</p>
            <button onClick={() => window.location.href="/"} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading metadata...</div>}>
        <MetaDataJobs
          seoTitle={`${categoryTitle} Practice Tracker`}
          seoDescription={`Practice ${categoryTitle} PYQs Year-Wise with detailed solutions.`}
        />
      </Suspense>
      <Suspense fallback={<div>Loading navbar...</div>}>
        <Navbar/>
      </Suspense>
      <div className="min-h-screen bg-gray-50 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 bg-white rounded-2xl shadow-sm p-6 mt-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{categoryTitle} Practice Tracker</h1>
                <p className="text-gray-600 mt-2">Explore {allYears.length} years with {totalQuestions} practice questions</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {!user && (
                  <button 
                    onClick={() => setShowAuthModal(true)} 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
                  >
                    Sign In
                  </button>
                )}
                <div className="relative w-full sm:max-w-xs">
                  <svg className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search years (Ctrl + /)"
                    className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    ref={searchInputRef}
                    aria-label="Search years"
                  />
                  {searchTerm && (
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2" 
                      onClick={() => setSearchTerm("")}
                      aria-label="Clear search"
                    >
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <Suspense fallback={<div>Loading alert...</div>}>
            <Alert 
              type="info" 
              message="We update our question bank daily. Found an issue? Report it — we'll fix it within 48 hrs!" 
              linkText="Learn More" 
              linkHref="https://examtracker.in/about-us" 
              dismissible={true} 
            />
          </Suspense>

          {/* Sort options for desktop */}
          <div className="hidden md:flex justify-end mb-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex">
              {["default", "progress", "remaining"].map((option) => (
                <button 
                  key={option} 
                  className={`text-sm px-4 py-2 rounded-lg transition ${
                    sortBy === option ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`} 
                  onClick={() => setSortBy(option)}
                  aria-label={`Sort by ${option}`}
                  aria-pressed={sortBy === option}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Years grid with auto-fill for better responsiveness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
            {filteredAndSortedYears.map((year) => {
              const yearProgress = userProgress[year.year] || { completedQuestions: [], correctAnswers: [], points: 0 };
              const completedCount = yearProgress.completedQuestions?.length || 0;
              const correctCount = yearProgress.correctAnswers?.length || 0;
              const progressPercentage = year.count ? Math.round((completedCount / year.count) * 100) : 0;
              const isCompleted = completedCount === year.count && year.count > 0;
              const accuracyPercentage = completedCount > 0 ? Math.round((correctCount / completedCount) * 100) : 0;
              const practiceUrl = `/${category}/practice/year-wise/${year.year.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

              return (
                <motion.div
                  key={year.uniqueId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className=" p-6">
                    <div className="relative flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{year.year.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h3>
                      {isCompleted && (
                        <span className="bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full">
                          Completed
                        </span>
                      )}
                      <span className="text-xs font-semibold text-gray-900 absolute top-0 right-0">{year.count}+ Questions</span>
                    </div>
                    
                    {user && completedCount > 0 && (
                      <>
                        <div className="h-2 w-full bg-gray-200 rounded-full mb-3">
                          <div 
                            className={`h-2 rounded-full ${
                              progressPercentage > 75 ? 'bg-green-500' : progressPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} 
                            style={{width: `${progressPercentage}%`}}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500 mb-4">
                          <span>Accuracy: {accuracyPercentage}%</span>
                          <span>{completedCount}/{year.count}</span>
                        </div>
                      </>
                    )}
                    
                    <button
                      onClick={() => handlePracticeClick(practiceUrl)}
                      disabled={orderChecking}
                      className={`block w-full text-center py-2 rounded-lg font-medium ${
                        isCompleted 
                          ? "bg-green-100 text-green-800 hover:bg-green-200" 
                          : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
                      } transition duration-200 ${orderChecking ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {orderChecking ? "Checking..." : completedCount > 0 ? "Continue" : "Start"} Practice
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredAndSortedYears.length === 0 && searchTerm && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-6">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No years found</h3>
              <p className="text-gray-500">No years match &apos;{searchTerm}&apos;</p>
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Mobile sort button */}
        <div className="md:hidden fixed bottom-6 right-6 z-30">
          <motion.button 
            onClick={() => setShowMobileOptions(true)} 
            className="h-12 w-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-colors" 
            aria-label="Show sort options"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </motion.button>
        </div>
        
        {/* Mobile sort modal */}
        <AnimatePresence>
          {showMobileOptions && (
            <motion.div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden flex items-end justify-center px-4" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileOptions(false)}
            >
              <motion.div 
                className="bg-white rounded-t-xl p-6 w-full max-w-md"
                initial={{ y: "100%" }} 
                animate={{ y: 0 }} 
                exit={{ y: "100%" }} 
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Sort Options</h3>
                  <button 
                    onClick={() => setShowMobileOptions(false)} 
                    className="text-gray-500"
                    aria-label="Close options"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {["default", "progress", "remaining"].map((option) => (
                    <button 
                      key={option} 
                      className={`text-center py-3 px-4 rounded-lg transition ${
                        sortBy === option 
                          ? "bg-indigo-600 text-white" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`} 
                      onClick={() => { 
                        setSortBy(option); 
                        setShowMobileOptions(false); 
                      }}
                      aria-label={`Sort by ${option}`}
                      aria-pressed={sortBy === option}
                    >
                      {option === "default" ? "Alphabetically" : 
                       option === "progress" ? "By Completion" : 
                       "By Remaining Questions"}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buy Now Modal */}
        <AnimatePresence>
          {showBuyModal && (
            <motion.div 
              className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            >
              <motion.div 
                className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full overflow-y-auto max-h-[90vh]"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Unlock Premium Access</h3>
                  <button 
                    onClick={handleCloseModal}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close subscription modal"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 mb-6">Get unlimited access to all {categoryTitle} practice questions, detailed solutions, and performance tracking.</p>
                <Suspense fallback={
                  <div className="py-8 flex justify-center">
                    <div className="h-8 w-8 rounded-full border-4 border-t-indigo-600 border-indigo-100 animate-spin"></div>
                  </div>
                }>
                  <BuyNow category={category} onSuccess={handlePurchaseSuccess} />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Auth Modal */}
        {!user && (
          <Suspense fallback={<div>Loading login modal...</div>}>
            <AuthModal
              isOpen={true}
              onClose={() => {
                setShowAuthModal(false);
                setSelectedPracticeUrl(null);
              }}
              onGoogleSignIn={async () => {
                await signInWithGoogle();
                if (selectedPracticeUrl && user) {
                  handlePracticeClick(selectedPracticeUrl);
                }
              }}
            />
          </Suspense>
        )}
       
        <Toaster 
          position="bottom-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: 'white',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: 'white',
              },
            },
          }} 
        />
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(Examtracker);