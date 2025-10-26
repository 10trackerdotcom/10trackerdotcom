'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { 
  BookOpen, Search, Clock, Target, Zap, 
  Grid3X3, List, Play, X, ChevronDown
} from 'lucide-react';
import MetaDataJobs from '@/components/Seo';
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, { fetch: (...args) => fetch(...args) })
  : null;

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

// Clean Topic Card Component
const TopicCard = ({ topic, category, index }) => (
  <motion.div
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    whileHover="hover"
    className="group bg-white rounded-lg shadow-sm border border-neutral-200 hover:border-neutral-300 transition-all duration-200"
  >
    <div className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 text-base leading-tight mb-2">
            {topic?.title?.replace(/-/g, ' ') || 'Unknown Topic'}
          </h3>
          <div className="flex items-center text-sm text-neutral-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>{Math.ceil((topic?.count || 0) * 0.8)} min</span>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0">
          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg text-neutral-700">{topic?.count || 0}</span>
          </div>
        </div>
      </div>

      {/* Action */}
      <a
        href={`/${category}/practice/${topic?.title?.replace(/\s+/g, '-')?.toLowerCase() || 'default'}`}
        className="inline-flex items-center w-full justify-center px-4 py-2.5 border border-neutral-300 text-neutral-800 font-medium rounded-lg hover:bg-neutral-50 transition-colors duration-150"
      >
        <Play className="w-4 h-4 mr-2" />
        Start practice
      </a>
    </div>
  </motion.div>
);

// Clean Subject Card Component
const SubjectCard = ({ subject, category, index }) => {
  const [expanded, setExpanded] = useState(false);
  const subjectSlug = subject?.subject?.replace(/\s+/g, '-')?.toLowerCase() || 'default';
  const totalQuestions = subject?.subtopics?.reduce((sum, t) => sum + (t?.count || 0), 0) || 0;
  const topicsCount = subject?.subtopics?.length || 0;

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-white rounded-lg shadow-sm border border-neutral-200 hover:border-neutral-300 transition-all duration-200"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-neutral-900 text-xl leading-tight mb-3">
              {subject?.subject?.replace(/-/g, ' ') || 'Unknown Subject'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm text-neutral-600">
                <BookOpen className="w-4 h-4 mr-2 text-neutral-600" />
                <span className="font-medium">{topicsCount}</span>
                <span className="ml-1">Topics</span>
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <Target className="w-4 h-4 mr-2 text-neutral-600" />
                <span className="font-medium">{totalQuestions}</span>
                <span className="ml-1">Questions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-4">
          <a
            href={`/${category}/${subjectSlug}`}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-neutral-300 text-neutral-800 font-medium rounded-lg hover:bg-neutral-50 transition-colors duration-150"
          >
            Explore Subject
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2.5 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 transition-colors duration-150 flex items-center"
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
              className="border-t border-neutral-200 pt-4 overflow-hidden"
            >
              <div className="space-y-2">
                {subject.subtopics.map((subtopic, subIndex) => (
                  <a
                    key={subtopic?.title || subIndex}
                    href={`/${category}/practice/${subtopic?.title || ''}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors duration-150"
                  >
                    <span className="font-medium text-neutral-800 text-sm">
                      {subtopic?.title?.replace(/-/g, ' ') || 'Unknown Topic'}
                    </span>
                    <span className="bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md text-xs font-bold min-w-[2rem] text-center">
                      {subtopic?.count || 0}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Clean Stats Component
const QuickStats = ({ data }) => {
  const totalTopics = data.reduce((sum, subject) => sum + (subject?.subtopics?.length || 0), 0);
  const totalQuestions = data.reduce((sum, subject) => 
    sum + (subject?.subtopics?.reduce((subSum, topic) => subSum + (topic?.count || 0), 0) || 0), 0
  );

  const stats = [
    { label: 'Subjects', value: data?.length || 0, icon: BookOpen, color: 'blue' },
    { label: 'Topics', value: totalTopics, icon: Target, color: 'green' },
    { label: 'Questions', value: totalQuestions, icon: Zap, color: 'purple' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="grid grid-cols-3 gap-4 mb-8"
    >
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div key={stat.label} className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
                <div className="text-sm font-medium text-neutral-600">{stat.label}</div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <IconComponent className="w-5 h-5 text-neutral-600" />
              </div>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

// Clean Search Component
const SearchBar = ({ searchTerm, setSearchTerm, viewMode, setViewMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.2 }}
    className="mb-8 space-y-4"
  >
    {/* Search Input */}
    <div className="relative">
      <Search className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
      <input
        type="text"
        placeholder="Search subjects or topics..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full pl-12 pr-12 py-4 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-neutral-800 transition-all duration-200"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute right-4 top-4 w-5 h-5 text-neutral-400 hover:text-neutral-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>

    {/* View Toggle */}
    <div className="flex items-center justify-center">
      <div className="inline-flex bg-neutral-100 p-1 rounded-lg">
        <button
          className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
            viewMode === 'subjects' 
              ? 'bg-white text-neutral-900 shadow-sm' 
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
          onClick={() => setViewMode('subjects')}
        >
          <Grid3X3 className="w-4 h-4 mr-2 inline" />
          Subjects
        </button>
        <button
          className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
            viewMode === 'topics' 
              ? 'bg-white text-neutral-900 shadow-sm' 
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
          onClick={() => setViewMode('topics')}
        >
          <List className="w-4 h-4 mr-2 inline" />
          Topics
        </button>
      </div>
    </div>
  </motion.div>
);

// No Results Component
const NoResults = ({ searchTerm, setSearchTerm, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-lg shadow-sm p-12 text-center border border-neutral-200"
  >
    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="w-8 h-8 text-neutral-400" />
    </div>
    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
      No {type} found
    </h3>
    <p className="text-neutral-600 mb-6">
      We couldn&apos;t find any {type} matching &apos;{searchTerm}&apos;
    </p>
    <button 
      onClick={() => setSearchTerm('')} 
      className="px-6 py-2.5 border border-neutral-300 text-neutral-800 font-medium rounded-lg hover:bg-neutral-50 transition-colors duration-150"
    >
      Clear Search
    </button>
  </motion.div>
);

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-neutral-50">
    <div className="flex justify-center items-center min-h-[60vh] pt-24">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-neutral-200 flex items-center space-x-4">
        <div className="w-8 h-8 border-4 border-neutral-800 border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h3 className="font-semibold text-neutral-900">Loading subjects...</h3>
          <p className="text-sm text-neutral-600">Please wait a moment</p>
        </div>
      </div>
    </div>
  </div>
);

// Main Component
const ExamTracker = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('subjects');
  const { category } = useParams();

  const safeCategory = category || 'default';
  const apiEndpoint = `/api/allsubtopics?category=${safeCategory?.toUpperCase()}`;
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiZXhhbXBsZVVzZXIiLCJpYXQiOjE3MzYyMzM2NDZ9.YMTSQxYuzjd3nD3GlZXO6zjjt1kqfUmXw7qdy-C2RD8';

  const formattedCategory = safeCategory
    ? safeCategory.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
    : 'Default';

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const responseData = await response.json();
      setData(responseData.subjectsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([
        {
          subject: 'Compiler Design',
          subtopics: [
            { title: 'lexical-analysis', count: 19 },
            { title: 'parsing', count: 82 },
            { title: 'semantic-analysis', count: 45 },
          ],
        },
        {
          subject: 'Theory of Computation',
          subtopics: [
            { title: 'finite-automata', count: 73 },
            { title: 'turing-machine', count: 13 },
            { title: 'regular-expressions', count: 28 },
          ],
        },
        {
          subject: 'Data Structures',
          subtopics: [
            { title: 'arrays', count: 156 },
            { title: 'linked-lists', count: 89 },
            { title: 'trees', count: 134 },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data
  const allTopics = data.flatMap((subject) =>
    (subject?.subtopics || []).map((t) => ({
      ...t,
      parentSubject: subject.subject,
      uniqueId: `${subject.subject}-${t.title}`
    }))
  );

  const filteredSubjects = data.filter((subject) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const subjectMatch = subject?.subject?.toLowerCase()?.includes(term);
    const topicsMatch = (subject?.subtopics || []).some((t) => 
      t?.title?.toLowerCase()?.includes(term)
    );
    return subjectMatch || topicsMatch;
  });

  const filteredTopics = allTopics.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return t?.title?.toLowerCase()?.includes(term) || 
           t?.parentSubject?.toLowerCase()?.includes(term);
  });

  if (isLoading) return <LoadingSpinner />;

  if (!data.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MetaDataJobs
          seoTitle={`${formattedCategory} Practice Tracker`}
          seoDescription={`Practice ${formattedCategory} PYQs Topic-Wise with detailed solutions.`}
        />
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] pt-24 px-4">
          <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-100 max-w-md">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              No Subjects Available
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any subjects in this category.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
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
      
      <div className="pt-24">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-semibold text-neutral-900 mb-3 tracking-tight">
              {formattedCategory}
            </h1>
            <p className="text-base md:text-lg text-neutral-600 max-w-2xl mx-auto">
              Practice topic-wise with curated questions. Minimal distractions—just progress.
            </p>
          </motion.div>
          
          <QuickStats data={data} />
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <SearchBar 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

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
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        >
          <a
            href={viewMode === 'topics'
              ? `/${safeCategory}/practice/${filteredTopics?.[0]?.title || ''}`
              : `/${safeCategory}/${filteredSubjects?.[0]?.subject?.replace(/\s+/g, '-')?.toLowerCase() || ''}`}
            className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Zap className="w-6 h-6" />
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default ExamTracker;