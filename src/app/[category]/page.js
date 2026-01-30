'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { 
  BookOpen, Search, Clock, Target, Zap, 
  Grid3X3, List, Play, X, ChevronDown, AlertCircle
} from 'lucide-react';
import MetaDataJobs from '@/components/Seo';
import Navbar from '@/components/Navbar';

// Client-side cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'category_data_';

// Debounce utility function
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Cache utility functions
const getCachedData = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
};

const setCachedData = (key, data) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    // Storage quota exceeded or other error
    console.warn('Failed to cache data:', error);
  }
};

// Optimized animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  hover: { 
    y: -4,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

// Memoized Topic Card Component
const TopicCard = React.memo(({ topic, category, index }) => {
  // Memoize formatted strings
  const formattedTitle = useMemo(() => 
    topic?.title?.replace(/-/g, ' ') || 'Unknown Topic',
    [topic?.title]
  );
  
  const topicSlug = useMemo(() => 
    topic?.title?.replace(/\s+/g, '-')?.toLowerCase() || 'default',
    [topic?.title]
  );
  
  const readingTime = useMemo(() => 
    Math.ceil((topic?.count || 0) * 0.8),
    [topic?.count]
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group bg-white rounded-xl shadow-sm border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all duration-200"
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-neutral-900 text-sm sm:text-base leading-tight mb-1.5 sm:mb-2 line-clamp-2">
              {formattedTitle}
            </h3>
            <div className="flex items-center text-xs sm:text-sm text-neutral-500">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span>{readingTime} min</span>
            </div>
          </div>
          
          <div className="ml-2 sm:ml-4 flex-shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
              <span className="font-bold text-base sm:text-lg text-neutral-700">{topic?.count || 0}</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <a
          href={`/${category}/practice/${topicSlug}`}
          className="inline-flex items-center w-full justify-center px-3 sm:px-4 py-2 sm:py-2.5 border border-neutral-300 text-neutral-800 font-medium text-sm sm:text-base rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors duration-150 touch-manipulation"
        >
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          Start practice
        </a>
      </div>
    </motion.div>
  );
});

TopicCard.displayName = 'TopicCard';

// Memoized Subject Card Component
const SubjectCard = React.memo(({ subject, category, index }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Memoize computed values
  const subjectSlug = useMemo(() => 
    subject?.subject?.replace(/\s+/g, '-')?.toLowerCase() || 'default',
    [subject?.subject]
  );
  
  const formattedSubject = useMemo(() => 
    subject?.subject?.replace(/-/g, ' ') || 'Unknown Subject',
    [subject?.subject]
  );
  
  const totalQuestions = useMemo(() => 
    subject?.subtopics?.reduce((sum, t) => sum + (t?.count || 0), 0) || 0,
    [subject?.subtopics]
  );
  
  const topicsCount = useMemo(() => 
    subject?.subtopics?.length || 0,
    [subject?.subtopics]
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-white rounded-xl shadow-sm border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all duration-200"
    >
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-neutral-900 text-lg sm:text-xl leading-tight mb-2 sm:mb-3 line-clamp-2">
              {formattedSubject}
            </h3>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-neutral-600 flex-shrink-0" />
                <span className="font-medium">{topicsCount}</span>
                <span className="ml-1">Topics</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-neutral-600 flex-shrink-0" />
                <span className="font-medium">{totalQuestions}</span>
                <span className="ml-1">Questions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <a
            href={`/${category}/${subjectSlug}`}
            className="flex-1 inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 border border-neutral-300 text-neutral-800 font-medium text-sm sm:text-base rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors duration-150 touch-manipulation"
          >
            Explore Subject
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-neutral-100 text-neutral-700 font-medium text-sm sm:text-base rounded-lg hover:bg-neutral-200 active:bg-neutral-300 transition-colors duration-150 flex items-center justify-center touch-manipulation min-w-[44px] sm:min-w-[auto]"
            aria-label={expanded ? 'Collapse topics' : 'Expand topics'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable Topics */}
        <AnimatePresence initial={false}>
          {expanded && subject?.subtopics && subject.subtopics.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="border-t border-neutral-200 pt-3 sm:pt-4 overflow-hidden"
            >
              <div className="space-y-2">
                {subject.subtopics.map((subtopic, subIndex) => {
                  const formattedSubtopic = subtopic?.title?.replace(/-/g, ' ') || 'Unknown Topic';
                  return (
                    <a
                      key={subtopic?.title || subIndex}
                      href={`/${category}/practice/${subtopic?.title || ''}`}
                      className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 transition-colors duration-150 touch-manipulation"
                    >
                      <span className="font-medium text-neutral-800 text-xs sm:text-sm line-clamp-1 pr-2">
                        {formattedSubtopic}
                      </span>
                      <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md text-xs font-bold min-w-[2rem] text-center flex-shrink-0">
                        {subtopic?.count || 0}
                      </span>
                    </a>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

SubjectCard.displayName = 'SubjectCard';

// Memoized Stats Component
const QuickStats = React.memo(({ data }) => {
  // Memoize computed stats
  const totalTopics = useMemo(() => 
    data.reduce((sum, subject) => sum + (subject?.subtopics?.length || 0), 0),
    [data]
  );
  
  const totalQuestions = useMemo(() => 
    data.reduce((sum, subject) => 
      sum + (subject?.subtopics?.reduce((subSum, topic) => subSum + (topic?.count || 0), 0) || 0), 0
    ),
    [data]
  );

  const stats = useMemo(() => [
    { label: 'Subjects', value: data?.length || 0, icon: BookOpen, color: 'blue' },
    { label: 'Topics', value: totalTopics, icon: Target, color: 'green' },
    { label: 'Questions', value: totalQuestions, icon: Zap, color: 'purple' },
  ], [data?.length, totalTopics, totalQuestions]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8"
    >
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={stat.label} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xl sm:text-2xl font-bold text-neutral-900 mb-0.5 sm:mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm font-medium text-neutral-600">{stat.label}</div>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 ml-2">
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600" />
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
});

QuickStats.displayName = 'QuickStats';

// Memoized Search Component
const SearchBar = React.memo(({ searchTerm, setSearchTerm, viewMode, setViewMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.2 }}
    className="mb-6 sm:mb-8 space-y-3 sm:space-y-4"
  >
    {/* Search Input */}
    <div className="relative">
      <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
      <input
        type="text"
        placeholder="Search subjects or topics..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 transition-all duration-200 text-sm sm:text-base"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-neutral-400 hover:text-neutral-600 active:text-neutral-700 touch-manipulation flex items-center justify-center"
          aria-label="Clear search"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
    </div>

    {/* View Toggle */}
    <div className="flex items-center justify-center">
      <div className="inline-flex bg-neutral-100 p-1 rounded-lg w-full sm:w-auto">
        <button
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 rounded-md font-medium text-sm sm:text-base transition-all duration-200 touch-manipulation ${
            viewMode === 'subjects' 
              ? 'bg-white text-neutral-900 shadow-sm' 
              : 'text-neutral-600 hover:text-neutral-900 active:text-neutral-700'
          }`}
          onClick={() => setViewMode('subjects')}
        >
          <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
          Subjects
        </button>
        <button
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 rounded-md font-medium text-sm sm:text-base transition-all duration-200 touch-manipulation ${
            viewMode === 'topics' 
              ? 'bg-white text-neutral-900 shadow-sm' 
              : 'text-neutral-600 hover:text-neutral-900 active:text-neutral-700'
          }`}
          onClick={() => setViewMode('topics')}
        >
          <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 inline" />
          Topics
        </button>
      </div>
    </div>
  </motion.div>
));

SearchBar.displayName = 'SearchBar';

// Memoized No Results Component
const NoResults = React.memo(({ searchTerm, setSearchTerm, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center border border-neutral-200"
  >
    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
      <Search className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" />
    </div>
    <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">
      No {type} found
    </h3>
    <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 px-4">
      We couldn&apos;t find any {type} matching &apos;{searchTerm}&apos;
    </p>
    <button 
      onClick={() => setSearchTerm('')} 
      className="px-5 sm:px-6 py-2 sm:py-2.5 border border-neutral-300 text-neutral-800 font-medium text-sm sm:text-base rounded-lg hover:bg-neutral-50 active:bg-neutral-100 transition-colors duration-150 touch-manipulation"
    >
      Clear Search
    </button>
  </motion.div>
));

NoResults.displayName = 'NoResults';

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 sm:p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
      </div>
      <div className="w-12 h-12 bg-neutral-100 rounded-lg"></div>
    </div>
    <div className="h-10 bg-neutral-100 rounded-lg"></div>
  </div>
);

const SkeletonLoading = () => (
  <div className="min-h-screen bg-neutral-50">
    <Navbar />
    <div className="pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
        {/* Hero Skeleton */}
        <div className="text-center mb-8 space-y-3">
          <div className="h-10 bg-neutral-200 rounded w-1/3 mx-auto animate-pulse"></div>
          <div className="h-5 bg-neutral-100 rounded w-2/3 mx-auto animate-pulse"></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-6 space-y-4">
          <div className="h-12 bg-neutral-200 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-neutral-100 rounded-lg w-1/2 mx-auto animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Error Component
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="min-h-screen bg-neutral-50">
    <Navbar />
    <div className="flex justify-center items-center min-h-[60vh] pt-20 px-4">
      <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-sm border border-neutral-200 max-w-md w-full">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2 sm:mb-3">
          Failed to Load Data
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
          {error?.message || 'An error occurred while fetching data. Please try again.'}
        </p>
        <button
          onClick={onRetry}
          className="px-5 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-medium text-sm sm:text-base rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 touch-manipulation"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

// Main Component
const ExamTracker = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('subjects');
  const { category } = useParams();
  
  // AbortController for request cancellation
  const abortControllerRef = useRef(null);
  
  // Debounced search term (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const safeCategory = category || 'default';
  const cacheKey = `${CACHE_KEY_PREFIX}${safeCategory?.toUpperCase()}`;
  const apiEndpoint = `/api/allsubtopics?category=${safeCategory?.toUpperCase()}`;

  // Memoize formatted category
  const formattedCategory = useMemo(() => 
    safeCategory
      ? safeCategory.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
      : 'Default',
    [safeCategory]
  );

  const fetchData = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setIsLoading(false);
      setError(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        signal, // Add abort signal
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (signal.aborted) return; // Request was cancelled
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      const subjectsData = responseData.subjectsData || [];
      
      // Cache the data
      setCachedData(cacheKey, subjectsData);
      setData(subjectsData);
      setError(null);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Error fetching data:', error);
      setError(error);
      
      // Try to get cached data as fallback
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [apiEndpoint, cacheKey]);

  useEffect(() => {
    fetchData();
    
    // Cleanup: abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Memoize all topics
  const allTopics = useMemo(() => 
    data.flatMap((subject) =>
      (subject?.subtopics || []).map((t) => ({
        ...t,
        parentSubject: subject.subject,
        uniqueId: `${subject.subject}-${t.title}`
      }))
    ),
    [data]
  );

  // Memoize filtered subjects with debounced search
  const filteredSubjects = useMemo(() => {
    if (!debouncedSearchTerm) return data;
    const term = debouncedSearchTerm.toLowerCase();
    return data.filter((subject) => {
      const subjectMatch = subject?.subject?.toLowerCase()?.includes(term);
      const topicsMatch = (subject?.subtopics || []).some((t) => 
        t?.title?.toLowerCase()?.includes(term)
      );
      return subjectMatch || topicsMatch;
    });
  }, [data, debouncedSearchTerm]);

  // Memoize filtered topics with debounced search
  const filteredTopics = useMemo(() => {
    if (!debouncedSearchTerm) return allTopics;
    const term = debouncedSearchTerm.toLowerCase();
    return allTopics.filter((t) => 
      t?.title?.toLowerCase()?.includes(term) || 
      t?.parentSubject?.toLowerCase()?.includes(term)
    );
  }, [allTopics, debouncedSearchTerm]);

  // Memoize quick start link
  const quickStartLink = useMemo(() => {
    if (viewMode === 'topics' && filteredTopics.length > 0) {
      return `/${safeCategory}/practice/${filteredTopics[0]?.title || ''}`;
    } else if (filteredSubjects.length > 0) {
      const subjectSlug = filteredSubjects[0]?.subject?.replace(/\s+/g, '-')?.toLowerCase() || '';
      return `/${safeCategory}/${subjectSlug}`;
    }
    return '#';
  }, [viewMode, filteredTopics, filteredSubjects, safeCategory]);

  if (error && !data.length) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={fetchData}
      />
    );
  }

  if (isLoading) return <SkeletonLoading />;

  if (!data.length) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <MetaDataJobs
          seoTitle={`${formattedCategory} Practice Tracker`}
          seoDescription={`Practice ${formattedCategory} PYQs Topic-Wise with detailed solutions.`}
        />
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] pt-20 px-4">
          <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-sm border border-neutral-200 max-w-md w-full">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2 sm:mb-3">
              No Subjects Available
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
              We couldn&apos;t find any subjects in this category.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-blue-600 text-white font-medium text-sm sm:text-base rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 touch-manipulation"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <MetaDataJobs
        seoTitle={`${formattedCategory} Practice Tracker`}
        seoDescription={`Practice ${formattedCategory} PYQs Topic-Wise with detailed solutions.`}
      />
      <Navbar />
      
      <div className="pt-20">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6 sm:pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-900 mb-2 sm:mb-3 tracking-tight px-2">
              {formattedCategory}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto px-4">
              Practice topic-wise with curated questions. Minimal distractions—just progress.
            </p>
          </motion.div>
          
          <QuickStats data={data} />
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <SearchBar 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
          
          {/* Show error banner if error exists but data is available */}
          {error && data.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Showing cached data. Some information may be outdated.</span>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence mode="wait">
            {viewMode === 'subjects' ? (
              filteredSubjects.length > 0 ? (
                <motion.div 
                  key="subjects"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                >
                  {filteredSubjects.map((subject, index) => (
                    <SubjectCard
                      key={subject?.subject || index}
                      subject={subject}
                      category={safeCategory}
                      index={index}
                    />
                  ))}
                </motion.div>
              ) : (
                <NoResults searchTerm={searchTerm} setSearchTerm={setSearchTerm} type="subjects" />
              )
            ) : (
              filteredTopics.length > 0 ? (
                <motion.div 
                  key="topics"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                >
                  {filteredTopics.map((topic, index) => (
                    <TopicCard
                      key={topic.uniqueId}
                      topic={topic}
                      category={safeCategory}
                      index={index}
                    />
                  ))}
                </motion.div>
              ) : (
                <NoResults searchTerm={searchTerm} setSearchTerm={setSearchTerm} type="topics" />
              )
            )}
          </AnimatePresence>
        </div>

        {/* Floating Action Button */}
        <motion.div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        >
          <a
            href={quickStartLink}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:shadow-2xl transition-all duration-200 touch-manipulation"
            aria-label="Quick start"
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamTracker;