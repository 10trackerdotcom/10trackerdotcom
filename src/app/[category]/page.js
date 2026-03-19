'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  BookOpen, Search, Clock, Target, Zap, 
  Grid3X3, List, Play, X, ChevronDown, AlertCircle,
  ClipboardCheck, ArrowRight
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

// Category hub: PYQs tracker, topic tests, mock tests, daily material
const PracticePathCards = React.memo(({ category, onOpenPracticeTopics }) => {
  const practiceSectionId = 'practice-content';
  const examCategory = category || 'gate-cse';
  const mockTestHref = `/mock-test/${examCategory}`;
  const topicTestsHref = `/mock-test/${examCategory}?tab=tests`;
  const dailyPracticeHref = `/${examCategory}/daily-practice`;

  const cards = [
    {
      id: 'pyq-tracker',
      href: `#${practiceSectionId}`,
      title: 'Practice PYQs with tracker',
      description: 'Solve past year questions with detailed solutions and smart tracking.',
      icon: BookOpen,
      badge: 'Recommended start',
      onClick: () => onOpenPracticeTopics && onOpenPracticeTopics(),
    },
    {
      id: 'topic-tests',
      href: topicTestsHref,
      title: 'Topic-wise tests',
      description: 'Timed mini-tests focused on individual topics to fix weak areas.',
      icon: Grid3X3,
      badge: 'Speed + accuracy',
    },
    {
      id: 'mock-tests',
      href: mockTestHref,
      title: 'Full mock tests',
      description: 'Simulate the real exam with curated full-length tests and analytics.',
      icon: ClipboardCheck,
      badge: 'Exam simulation',
    },
    {
      id: 'daily-practice',
      href: dailyPracticeHref,
      title: 'Daily practice material',
      description: 'Curated questions, notes and revision lists for your daily study slot.',
      icon: Target,
      badge: 'Consistency',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
    >
      {cards.map(({ id, href, title, description, icon: Icon, badge, onClick }) => (
        <Link
          key={id}
          href={href}
          className="group block bg-white rounded-xl shadow-sm border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all duration-200 p-4 sm:p-6 text-left"
          onClick={onClick}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-200 transition-colors">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="font-semibold text-neutral-900 text-base sm:text-lg line-clamp-2">
                  {title}
                </h3>
                {badge && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-neutral-100 text-neutral-700">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-600 mb-3 sm:mb-4 line-clamp-3">
                {description}
              </p>
              <span className="inline-flex items-center font-medium text-neutral-800 text-sm">
                Explore <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </motion.div>
  );
});
PracticePathCards.displayName = 'PracticePathCards';

// Memoized Search + View Toggle (compact, app-like)
const SearchBar = React.memo(({ searchTerm, setSearchTerm }) => (
  <div className="flex items-center gap-3">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
      <input
        type="text"
        placeholder="Search subjects…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-9 pr-9 py-2.5 bg-white border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 transition-colors text-sm"
        aria-label="Search subjects"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors flex items-center justify-center"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
));

SearchBar.displayName = 'SearchBar';

// Lightweight news & updates section (dummy content, per category)
const NewsSection = React.memo(({ category }) => {
  const normalized = (category || '').toUpperCase() || 'EXAM';
  const items = [
    {
      id: 1,
      title: `${normalized} strategy deep-dive coming soon`,
      summary: 'We are preparing an in-depth strategy guide tailored to this exam. Stay tuned.',
      tag: 'Guide',
    },
    {
      id: 2,
      title: 'Daily practice sets and revision lists',
      summary: 'You will soon see curated daily sets here – PYQs, mixed-level questions and quick revisions.',
      tag: 'Daily practice',
    },
    {
      id: 3,
      title: 'Exam notifications & important dates',
      summary: 'This space will show official notifications, important dates and last-minute checklists.',
      tag: 'Updates',
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 sm:p-6 lg:p-7"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">News & updates</h2>
            <p className="text-xs sm:text-sm text-neutral-500">
              Placeholder updates for now – you can plug your live news feed here later.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 sm:p-4 flex flex-col justify-between"
            >
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-neutral-900 text-white mb-2">
                  {item.tag}
                </span>
                <h3 className="text-sm sm:text-base font-semibold text-neutral-900 mb-1.5 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 line-clamp-3">
                  {item.summary}
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-[11px] sm:text-xs font-medium text-neutral-700">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
});

NewsSection.displayName = 'NewsSection';

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
    <div className="pt-24">
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
    <div className="flex justify-center items-center min-h-[60vh] pt-24 px-4">
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
  const [viewMode, setViewMode] = useState('subjects'); // kept for backward compatibility; UI is subjects-only
  const [practiceFocusMode, setPracticeFocusMode] = useState(false);
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
    if (filteredSubjects.length > 0) {
      const subjectSlug = filteredSubjects[0]?.subject?.replace(/\s+/g, '-')?.toLowerCase() || '';
      return `/${safeCategory}/${subjectSlug}`;
    }
    return '#';
  }, [filteredSubjects, safeCategory]);

  // Hub links (for premium hero quick actions)
  const hubLinks = useMemo(() => {
    const examCategory = safeCategory || 'gate-cse';
    return {
      practiceAnchor: '#practice-content',
      mockTests: `/mock-test/${examCategory}`,
      topicTests: `/mock-test/${examCategory}?tab=tests`,
      dailyPractice: `/${examCategory}/daily-practice`,
    };
  }, [safeCategory]);

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
        <div className="flex justify-center items-center min-h-[60vh] pt-24 px-4">
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
      
      <div className="pt-24 min-h-screen">
        {/* Hero + metrics + options + news */}
        {!practiceFocusMode && (
          <section className="relative border-b border-neutral-200 bg-white">
            {/* subtle premium background */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(0,0,0,0.06),transparent_55%),radial-gradient(circle_at_85%_30%,rgba(0,0,0,0.04),transparent_55%)]" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: title + quick actions */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className="lg:col-span-7"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200">
                    <Zap className="w-4 h-4 text-neutral-700" />
                    <span className="text-xs sm:text-sm font-medium text-neutral-700">
                      {formattedCategory} • practice hub
                    </span>
                  </div>

                  <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-tight">
                    {formattedCategory} dashboard
                  </h1>
                  <p className="mt-3 text-base sm:text-lg text-neutral-600 max-w-2xl leading-relaxed">
                    One clean place to practice PYQs, run topic tests, attempt mocks, and build consistency with daily practice.
                  </p>

                  {/* Quick action chips */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={hubLinks.practiceAnchor}
                      onClick={(e) => {
                        e.preventDefault();
                        setPracticeFocusMode(true);
                        setSearchTerm('');
                        setViewMode('subjects');
                        // Scroll after state update
                        setTimeout(() => {
                          const el = document.getElementById('practice-content');
                          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" />
                      Start PYQs
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={hubLinks.mockTests}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Mock tests
                    </Link>
                    <Link
                      href={hubLinks.topicTests}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Topic tests
                    </Link>
                    <Link
                      href={hubLinks.dailyPractice}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-300 bg-white text-neutral-800 text-sm font-semibold hover:bg-neutral-50 transition-colors"
                    >
                      <Target className="w-4 h-4" />
                      Daily practice
                    </Link>
                  </div>

                  <div className="mt-6">
                    <QuickStats data={data} />
                  </div>
                </motion.div>

                {/* Right: study plan / shortcuts */}
                <motion.aside
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  className="lg:col-span-5"
                >
                  <div className="rounded-3xl border border-neutral-200 bg-white/80 backdrop-blur p-5 sm:p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-neutral-900">Quick plan</p>
                      <span className="text-[11px] font-medium text-neutral-500">Simple workflow</span>
                    </div>

                    <ol className="mt-4 space-y-3 text-sm text-neutral-700">
                      <li className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800">
                          1
                        </span>
                        <span>Start PYQs topic-wise and mark your progress.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800">
                          2
                        </span>
                        <span>Take topic tests to fix weak areas quickly.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-800">
                          3
                        </span>
                        <span>Attempt mocks weekly for exam temperament.</span>
                      </li>
                    </ol>

                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                      <p className="text-xs text-neutral-600">
                        Tip: Use the search inside <span className="font-semibold text-neutral-900">Practice topic-wise</span> to jump directly to any topic.
                      </p>
                    </div>
                  </div>
                </motion.aside>
              </div>

              {/* Primary actions (cards) */}
              <div className="mt-8">
                <PracticePathCards
                  category={safeCategory}
                  onOpenPracticeTopics={() => {
                    setPracticeFocusMode(true);
                    setSearchTerm('');
                    setViewMode('subjects');
                    setTimeout(() => {
                      const el = document.getElementById('practice-content');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Practice content: subjects & topics (shown only in focus mode) */}
        {practiceFocusMode && (
          <section
            id="practice-content"
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 scroll-mt-24 pt-6 sm:pt-8"
          >
            {/* subtle workspace background */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_0%,rgba(0,0,0,0.04),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(0,0,0,0.03),transparent_55%)]" />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="min-w-0"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200">
                  <BookOpen className="w-4 h-4 text-neutral-700" />
                  <span className="text-[11px] sm:text-xs font-semibold text-neutral-700">
                    {formattedCategory} • practice workspace
                  </span>
                </div>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
                  Practice topic-wise
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-neutral-600">
                  Search and pick what to practice next.
                </p>
              </motion.div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPracticeFocusMode(false);
                    setSearchTerm('');
                    setViewMode('subjects');
                  }}
                  className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setViewMode('subjects');
                  }}
                  className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                  aria-label="Reset search and view"
                >
                  <X className="w-4 h-4 mr-1 text-neutral-500" />
                  Reset
                </button>
              </div>
            </div>

            {/* Sticky tools */}
            <div className="sticky top-20 z-10">
              <div className="bg-white/90 backdrop-blur rounded-3xl border border-neutral-200 shadow-sm p-4 sm:p-5">
                <SearchBar 
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                />

                {/* Result summary chips */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-neutral-500 font-medium">Showing</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-neutral-50 border border-neutral-200 px-3 py-1 font-semibold text-neutral-800">
                    {filteredSubjects.length} subjects
                  </span>
                  {searchTerm && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-neutral-50 border border-neutral-200 px-3 py-1 font-semibold text-neutral-700">
                      Search: “{searchTerm}”
                      <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        className="text-neutral-500 hover:text-neutral-900"
                        aria-label="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setViewMode('subjects');
                      }}
                      className="ml-auto inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-3 py-1 font-semibold hover:bg-neutral-800 transition-colors"
                      aria-label="Reset filters"
                    >
                      Reset
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
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
              {filteredSubjects.length > 0 ? (
                <motion.div 
                  key="subjects"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="mt-5"
                >
                  <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="max-h-[70vh] overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0 z-10">
                          <tr className="text-left text-neutral-600">
                            <th className="py-3 px-4 font-semibold">Subject</th>
                            <th className="py-3 px-4 font-semibold text-right w-[110px]">Topics</th>
                            <th className="py-3 px-4 font-semibold text-right w-[120px]">Questions</th>
                            <th className="py-3 px-4 font-semibold text-right w-[140px]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {filteredSubjects.map((subject, index) => {
                            const subjectName = subject?.subject || `Subject ${index + 1}`;
                            const topicsCount = subject?.subtopics?.length || 0;
                            const questionsCount =
                              subject?.subtopics?.reduce((sum, t) => sum + (t?.count || 0), 0) || 0;
                            const subjectSlug = subjectName.replace(/\s+/g, "-").toLowerCase();

                            return (
                              <tr
                                key={subjectName}
                                className="odd:bg-white even:bg-neutral-50/40 hover:bg-neutral-100/60 transition-colors"
                              >
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-neutral-900">{subjectName}</div>
                                  <div className="text-xs text-neutral-500 mt-0.5">
                                    Topic-wise PYQs with tracker
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-right tabular-nums text-neutral-700">
                                  <span className="inline-flex items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-1 font-semibold">
                                    {topicsCount}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right tabular-nums text-neutral-700">
                                  <span className="inline-flex items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-1 font-semibold">
                                    {questionsCount}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Link
                                    href={`/${safeCategory}/${subjectSlug}`}
                                    className="inline-flex items-center justify-center rounded-xl bg-neutral-900 text-white px-3 py-2 text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-sm hover:shadow"
                                  >
                                    Open
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <NoResults searchTerm={searchTerm} setSearchTerm={setSearchTerm} type="subjects" />
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Floating Action Button */}
        <motion.div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        >
          <a
            href={quickStartLink}
            className="bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl active:shadow-2xl transition-all duration-200 touch-manipulation"
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