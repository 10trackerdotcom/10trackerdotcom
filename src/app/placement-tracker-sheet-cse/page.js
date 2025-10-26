"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from "@/app/context/AuthContext";
import { createClient } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import { Search, Filter, Calendar, Book, Clock, CheckCircle, XCircle, AlertCircle, Eye, Award, ArrowRight, Bookmark, Save, ExternalLink } from 'lucide-react';
import TechStack from './Techstack';
import MetaDataJobs from '@/components/Seo';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Subscription data (hardcoded for this example)
const SUBSCRIPTION_DATA = [
  {
    id: "8ec7d2df-8766-4db4-bf03-7c756eeab739",
    email: "jain10gunjan@gmail.com",
    subscription_status: "active"
  }
];

export default function PlacementTracker() {
  const { user, signOut, setShowAuthModal } = useAuth();
  
  const [trackerData, setTrackerData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [newNote, setNewNote] = useState({});
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // New state to prevent hydration issues

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!user) {
      setIsSubscribed(false);
      return;
    }

    try {
      const subscription = SUBSCRIPTION_DATA.find(sub => sub.email === user.email && sub.subscription_status === 'active');
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Subscription check error:', err);
      setIsSubscribed(false);
    }
  }, [user]);

  // Fetch data with optimized approach
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [{ data: tracker, error: trackerError }, { data: progress, error: progressError }] = await Promise.all([
        supabase
          .from('placement_tracker_cse')
          .select('*')
          .order('day_number', { ascending: true }),
        supabase
          .from('user_progress_placement_tracker')
          .select('task_id, status, user_notes')
          .eq('user_id', user.id)
      ]);

      if (trackerError) throw new Error(`Tracker error: ${trackerError.message}`);
      if (progressError) throw new Error(`Progress error: ${progressError.message}`);

      setTrackerData(tracker);
      setFilteredData(tracker);
      
      const progressMap = {};
      progress.forEach(item => {
        progressMap[item.task_id] = {
          status: item.status,
          user_notes: item.user_notes || ''
        };
      });
      setUserProgress(progressMap);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
    if (user) {
      checkSubscription();
      fetchData();
      setTimeout(() => setShowPopup(true), 3000);
    }
  }, [user, fetchData, checkSubscription]);

  // Calculate progress
  const calculateDayProgress = useCallback((day) => {
    if (!day || !day.focus_areas) return 0;
    
    let totalTasks = 0;
    let completedTasks = 0;

    day.focus_areas.forEach(focusArea => {
      totalTasks += focusArea.tasks.length;
      focusArea.tasks.forEach(task => {
        if (userProgress[task.task_id]?.status === 'completed') {
          completedTasks++;
        }
      });
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [userProgress]);

  const calculateFocusAreaProgress = useCallback((focusArea) => {
    if (!focusArea || !focusArea.tasks) return 0;
    
    let totalTasks = focusArea.tasks.length;
    let completedTasks = 0;

    focusArea.tasks.forEach(task => {
      if (userProgress[task.task_id]?.status === 'completed') {
        completedTasks++;
      }
    });

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }, [userProgress]);

  // Memoized filter implementation
  const applyFilters = useMemo(() => {
    if (!trackerData.length) return [];

    return trackerData.filter(item => {
      const progress = calculateDayProgress(item);

      if (statusFilter !== 'all') {
        if (statusFilter === 'not_started' && progress > 0) return false;
        if (statusFilter === 'in_progress' && (progress === 0 || progress === 100)) return false;
        if (statusFilter === 'completed' && progress !== 100) return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return `day ${item.day_number}`.toLowerCase().includes(query);
      }

      return true;
    });
  }, [statusFilter, searchQuery, trackerData, calculateDayProgress]);

  // Apply filters effect
  useEffect(() => {
    setFilteredData(applyFilters);
  }, [applyFilters]);

  // Show success message
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Update task status
  const updateTaskStatus = useCallback(async (taskId, status) => {
    if (!user) {
      setError('Please sign in to update task status');
      return;
    }
    if (!isSubscribed) {
      setError('Please subscribe to update task status');
      return;
    }

    try {
      setUserProgress(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], status }
      }));
      
      const { error } = await supabase
        .from('user_progress_placement_tracker')
        .upsert({
          user_id: user.id,
          user_mail: user.email,
          task_id: taskId,
          status,
          user_notes: userProgress[taskId]?.user_notes || ''
        }, {
          onConflict: ['user_id', 'task_id']
        });

      if (error) throw error;
      setError(null);
      showSuccess('Status updated successfully!');
    } catch (error) {
      setError('Failed to update status. Please try again.');
      setUserProgress(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], status: prev[taskId]?.status || 'not_completed' }
      }));
    }
  }, [user, userProgress, isSubscribed]);

  // Update user notes
  const updateUserNotes = useCallback(async (taskId) => {
    if (!user) {
      setError('Please sign in to save notes');
      return;
    }
    if (!isSubscribed) {
      setError('Please subscribe to save notes');
      return;
    }
    
    if (!newNote[taskId]?.trim()) {
      setError('Notes cannot be empty');
      return;
    }

    try {
      const noteContent = newNote[taskId].trim();
      setUserProgress(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], user_notes: noteContent }
      }));
      
      const { error } = await supabase
        .from('user_progress_placement_tracker')
        .upsert({
          user_id: user.id,
          task_id: taskId,
          status: userProgress[taskId]?.status || 'not_completed',
          user_notes: noteContent
        }, {
          onConflict: ['user_id', 'task_id']
        });

      if (error) throw error;
      setNewNote(prev => ({ ...prev, [taskId]: '' }));
      setError(null);
      showSuccess('Notes saved successfully!');
    } catch (error) {
      setError('Failed to save notes. Please try again.');
    }
  }, [user, userProgress, newNote, isSubscribed]);

  // Modal controls
  const openDayModal = useCallback((day) => {
    setSelectedDay(day);
    setIsDayModalOpen(true);
    setNewNote({});
    setError(null);
  }, []);

  const closeDayModal = useCallback(() => {
    setIsDayModalOpen(false);
    setSelectedDay(null);
    setNewNote({});
    setError(null);
  }, []);

  // UI helper functions
  const getStatusIcon = useCallback((progress) => {
    if (progress === 0) return <XCircle className="text-red-500" size={20} />;
    if (progress < 100) return <AlertCircle className="text-yellow-500" size={20} />;
    return <CheckCircle className="text-green-500" size={20} />;
  }, []);

  const getStatusText = useCallback((progress) => {
    if (progress === 0) return "Not Started";
    if (progress < 100) return "In Progress";
    return "Completed";
  }, []);

  const getFocusAreaColor = useCallback((index) => {
    const colors = [
      'bg-indigo-100 text-indigo-800',
      'bg-purple-100 text-purple-800',
      'bg-emerald-100 text-emerald-800',
      'bg-blue-100 text-blue-800',
      'bg-pink-100 text-pink-800',
      'bg-teal-100 text-teal-800',
    ];
    return colors[index % colors.length];
  }, []);

  // Sign-in prompt component
  const SignInPrompt = () => (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8 transform hover:scale-105 transition-all duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Sign In to Track Progress</h3>
        <p className="text-gray-600 mb-6">Access the full placement tracker.</p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="inline-flex items-center bg-white text-gray-700 px-6 py-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg"
        >
          Sign Up For Free.
        </button>
      </div>
    </div>
  );

  // Subscription prompt component
  const SubscriptionPrompt = () => (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8 transform hover:scale-105 transition-all duration-300">
      <div className="flex flex-col items-center text-center">
        <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Subscribe to Unlock Full Access</h3>
        <p className="text-gray-600 mb-6">Get full access to the placement tracker by subscribing.</p>
        <button
          onClick={() => window.location.href = '/subscribe'}
          className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
        >
          Subscribe Now
        </button>
      </div>
    </div>
  );

  // Feedback popup component
  const FeedbackPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 transform transition-all opacity-100 scale-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">We&apos;re Growing Fast!</h2>
          </div>
          <button 
            onClick={() => setShowPopup(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            We&apos;re constantly updating our platform with exciting new features to enhance your experience!
          </p>
          <div className="space-y-3 mb-4">
            <div className="flex items-start">
              <div className="h-5 w-5 text-green-500 mr-2 mt-0.5">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Daily streaks to track your progress</span>
            </div>
            <div className="flex items-start">
              <div className="h-5 w-5 text-green-500 mr-2 mt-0.5">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Achievement checkmarks to celebrate wins</span>
            </div>
            <div className="flex items-start">
              <div className="h-5 w-5 text-green-500 mr-2 mt-0.5">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700">Regular content updates</span>
            </div>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg mb-4">
            <p className="text-indigo-700 text-sm font-medium">
              Have a feature request? We&apos;re all ears! Let us know what you&apos;d like to see next.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <a
            href="http://instagram.com/placementtracker"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-2 px-4 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium transition-colors"
          >
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-2.56 9.6c-.18.68-.86.88-1.32.44l-3-2.2-1.44 1.4c-.16.16-.3.22-.48.22-.2 0-.4-.14-.48-.34l-.54-3.54 8.24-7.46c.36-.32.12-.88-.36-.56l-10.2 6.46-3.02-.64c-.68-.14-.94-.88-.44-1.32l12-7.2c.5-.3 1.14-.04 1.28.5z"/>
            </svg>
            Follow Us On Instagram
          </a>
          <button
            onClick={() => setShowPopup(false)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );

  if (!isMounted) return null; // Prevent hydration mismatch by rendering nothing on server

  return (
    <>
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in;
        }
        .hover-scale {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-scale:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .subtle-pattern {
          background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .7;
          }
        }
        .blur-content {
          filter: blur(4px);
          pointer-events: none;
        }
        .blur-overlay {
          position: relative;
        }
        .blur-overlay::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.5);
          z-index: 1;
          pointer-events: none;
        }
      `}</style>
      <MetaDataJobs
        seoTitle={`Placement Tracker Sheet CSE 2025`}
        seoDescription={`Boost your CSE 2025 placement prep with the Placement Tracker Sheet CSE 2025. Organize coding practice, aptitude tests, interviews, and deadlines.`}
      />
      <Navbar />
      <div className="p-6 bg-gradient-to-b from-indigo-50 via-blue-50 to-gray-50 min-h-screen mt-16 subtle-pattern">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 relative inline-block">
              <span className="relative z-10">Placement Tracker Sheet CSE 2025</span>
              <div className="absolute -bottom-2 left-0 w-full h-3 bg-indigo-200 opacity-60 rounded-full -z-10"></div>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl">A simple and powerful tracker for CSE students to organize placement prep—track applications, coding progress, aptitude practice, interviews, and deadlines all in one place.</p>
          </div>

          <TechStack />
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center justify-between shadow-md border border-red-100 animate-slide-up">
              <div className="flex items-center">
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 hover:bg-red-100 p-2 rounded-full transition-colors">
                <XCircle size={20} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center justify-between shadow-md border border-green-100 animate-slide-up">
              <div className="flex items-center">
                <CheckCircle size={20} className="mr-2 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 hover:bg-green-100 p-2 rounded-full transition-colors">
                <XCircle size={20} />
              </button>
            </div>
          )}

          {!user && <SignInPrompt />}

          {user && !isSubscribed && <SubscriptionPrompt />}

          {user && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  { icon: Award, title: 'Total Days', value: trackerData.length, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
                  { icon: CheckCircle, title: 'Days Completed', value: trackerData.filter(day => calculateDayProgress(day) === 100).length, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
                  { icon: Clock, title: 'Days In Progress', value: trackerData.filter(day => calculateDayProgress(day) > 0 && calculateDayProgress(day) < 100).length, color: 'text-amber-500', bgColor: 'bg-amber-100' },
                ].map((stat, index) => (
                  <div key={index} className="glass-effect p-6 rounded-2xl shadow-lg hover-scale">
                    <div className="flex items-center">
                      <div className={`${stat.bgColor} p-4 rounded-2xl mr-4`}>
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-effect p-6 rounded-2xl mb-8 shadow-md">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center w-full md:w-auto bg-white p-2 rounded-xl shadow-sm">
                    <Filter size={20} className="text-indigo-500 ml-2 mr-3" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full md:w-auto border-none rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      disabled={!isSubscribed}
                    >
                      <option value="all">All Tasks</option>
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className="relative flex-1 w-full">
                    <div className="bg-white rounded-xl shadow-sm flex items-center p-2">
                      <Search size={20} className="text-gray-400 mx-2" />
                      <input
                        type="text"
                        placeholder="Search by day (e.g., Day 1)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border-none rounded-xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                        disabled={!isSubscribed}
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="p-1 rounded-full hover:bg-gray-100"
                          disabled={!isSubscribed}
                        >
                          <XCircle size={18} className="text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-16">
                  <div className="relative h-16 w-16 mx-auto mb-6">
                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-indigo-200"></div>
                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                  </div>
                  <p className="mt-4 text-gray-600 text-lg">Loading your tracker...</p>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="md:hidden space-y-6">
                    {filteredData.length > 0 ? (
                      filteredData.map((item) => {
                        const dayProgress = calculateDayProgress(item);
                        return (
                          <div key={item.id} className="glass-effect rounded-2xl shadow-lg p-6 hover-scale transition-all animate-fade-in">
                            <div className="flex justify-between items-center mb-4">
                              <span className={`${!isSubscribed ? "blur-sm" : ""} bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium`}>
                                Day {item.day_number}
                              </span>
                              <button
                                onClick={() => openDayModal(item)}
                                className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                              >
                                <Eye size={16} className="mr-2" />
                                View
                              </button>
                            </div>
                            <div className={`${!isSubscribed ? "blur-sm" : ""} flex items-center mb-4`}>
                              <Clock size={16} className="text-indigo-500 mr-2" />
                              <span className="text-gray-700 text-sm">{item.time_required} hours</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {item.focus_areas?.map((fa, index) => (
                                <span
                                  key={index}
                                  className={`${!isSubscribed ? "blur-sm" : ""} text-xs px-3 py-1 rounded-full ${getFocusAreaColor(index)}`}
                                >
                                  {fa.focus_area}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-3 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${
                                    dayProgress === 100 ? 'bg-emerald-500' : 
                                    dayProgress > 50 ? 'bg-indigo-500' : 
                                    dayProgress > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                  }`}
                                  style={{ width: `${dayProgress}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-medium text-gray-700 ${!isSubscribed ? "blur-sm" : ""}`}>{dayProgress}%</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="glass-effect rounded-2xl shadow-lg p-6 text-center">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                          <Search size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg mb-2">No matching data found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters or search query</p>
                      </div>
                    )}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden md:block glass-effect rounded-2xl shadow-lg overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr className="text-gray-700">
                            <th className="px-6 py-4 text-left text-sm font-semibold">Day</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Estimated Time</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Focus Areas</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold">Progress</th>
                            <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredData.length > 0 ? (
                            filteredData.map((item) => {
                              const dayProgress = calculateDayProgress(item);
                              return (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <span className={`${!isSubscribed ? "blur-sm" : ""} bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium`}>
                                      Day {item.day_number}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-gray-700 text-sm">
                                    <div className={`${!isSubscribed ? "blur-sm" : ""} flex items-center`}>
                                      <Clock size={16} className="text-indigo-500 mr-2" />
                                      {item.time_required} hours
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                      {item.focus_areas?.map((fa, index) => (
                                        <span
                                          key={index}
                                          className={`${!isSubscribed ? "blur-sm" : ""} text-xs px-3 py-1 rounded-full ${getFocusAreaColor(index)}`}
                                        >
                                          {fa.focus_area}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center">
                                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3 overflow-hidden">
                                        <div
                                          className={`h-2 rounded-full ${
                                            dayProgress === 100 ? 'bg-emerald-500' : 
                                            dayProgress > 50 ? 'bg-indigo-500' : 
                                            dayProgress > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                          }`}
                                          style={{ width: `${dayProgress}%` }}
                                        ></div>
                                      </div>
                                      <span className={`text-sm font-medium text-gray-700 ${!isSubscribed ? "blur-sm" : ""}`}>{dayProgress}%</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() => openDayModal(item)}
                                      className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                                    >
                                      <Eye size={16} className="mr-2" />
                                      View Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center">
                                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                                    <Search size={24} className="text-gray-400" />
                                  </div>
                                  <p className="text-gray-500 text-lg mb-2">No matching data found</p>
                                  <p className="text-gray-400 text-sm">Try adjusting your filters or search query</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {isDayModalOpen && selectedDay && user && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50 px-4 overflow-auto backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-slide-up">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                    <div className="bg-indigo-100 p-2 md:p-3 rounded-xl mr-3">
                      <Calendar size={24} className="text-indigo-600" />
                    </div>
                    Day {selectedDay.day_number} - Study Plan
                  </h2>
                  <button
                    onClick={closeDayModal}
                    className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Award className="text-indigo-600 mr-3" size={24} />
                    Overall Progress
                  </h3>
                  <div className="w-full bg-white rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className={`h-4 rounded-full ${
                        calculateDayProgress(selectedDay) === 100 ? 'bg-emerald-500' : 
                        calculateDayProgress(selectedDay) > 50 ? 'bg-indigo-500' : 
                        calculateDayProgress(selectedDay) > 0 ? 'bg-amber-500' : 'bg-gray-300'
                      } transition-all duration-500`}
                      style={{ width: `${calculateDayProgress(selectedDay)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center">
                      {getStatusIcon(calculateDayProgress(selectedDay))}
                      <span className="ml-2 text-gray-700 font-medium text-lg">
                        {getStatusText(calculateDayProgress(selectedDay))}
                      </span>
                    </div>
                    <span className="font-bold text-xl text-indigo-700">
                      {calculateDayProgress(selectedDay)}% Complete
                    </span>
                  </div>
                </div>

                {/* Mobile Card Layout for Focus Areas */}
                <div className="md:hidden space-y-6">
                  {selectedDay.focus_areas.map((focusArea, focusIndex) => (
                    <div key={focusIndex} className="glass-effect rounded-2xl shadow-md p-6">
                      <div className={`flex items-center mb-4 ${getFocusAreaColor(focusIndex)} p-4 rounded-xl`}>
                        <div className="bg-white bg-opacity-50 rounded-lg p-2 mr-3">
                          <Book size={24} className="text-indigo-700" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">{focusArea.focus_area}</h3>
                      </div>
                      <div className="w-full bg-white bg-opacity-70 rounded-full h-3 overflow-hidden shadow-inner mb-4">
                        <div
                          className={`h-3 rounded-full ${
                            calculateFocusAreaProgress(focusArea) === 100 ? 'bg-emerald-500' : 
                            calculateFocusAreaProgress(focusArea) > 50 ? 'bg-indigo-500' : 
                            calculateFocusAreaProgress(focusArea) > 0 ? 'bg-amber-500' : 'bg-gray-300'
                          } transition-all duration-500`}
                          style={{ width: `${calculateFocusAreaProgress(focusArea)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm mb-4">
                        <span className="font-medium text-gray-700">Progress</span>
                        <span className="font-bold text-indigo-700">{calculateFocusAreaProgress(focusArea)}%</span>
                      </div>
                      {focusArea.tasks.map((taskItem, taskIndex) => (
                        <div key={taskItem.task_id} className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                          <div className="flex items-center mb-2">
                            <span className={`bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-gray-700 font-medium ${!isSubscribed ? "blur-sm" : ""}`}>
                              {taskIndex + 1}
                            </span>
                            <span className={`ml-3 text-sm font-medium ${!isSubscribed ? "blur-sm" : ""}`}>{taskItem.task}</span>
                          </div>
                          <div className="mb-2">
                            {taskItem.resources ? (
                              <a
                                href={taskItem.resources}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-500 hover:text-indigo-700 flex items-center px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors max-w-fit"
                              >
                                <ExternalLink size={14} className="mr-2" />
                                View Resource
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">No resource available</span>
                            )}
                          </div>
                          <select
                            value={userProgress[taskItem.task_id]?.status || 'not_completed'}
                            onChange={(e) => updateTaskStatus(taskItem.task_id, e.target.value)}
                            className={`w-full rounded-xl border border-gray-200 p-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm cursor-pointer mb-2 ${!isSubscribed ? "blur-sm" : ""}`}
                            disabled={!isSubscribed}
                          >
                            <option value="not_completed">Not Completed</option>
                            <option value="completed">Completed</option>
                          </select>
                          <textarea
                            value={newNote[taskItem.task_id] || userProgress[taskItem.task_id]?.user_notes || ''}
                            onChange={(e) => setNewNote(prev => ({
                              ...prev,
                              [taskItem.task_id]: e.target.value
                            }))}
                            rows={2}
                            className={`w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 shadow-sm transition-colors focus:bg-white ${!isSubscribed ? "blur-sm" : ""}`}
                            placeholder="Add your notes here..."
                            disabled={!isSubscribed}
                          />
                          <button
                            onClick={() => updateUserNotes(taskItem.task_id)}
                            className={`${!isSubscribed ? "blur-sm" : ""} mt-2 px-4 py-2 rounded-xl text-sm flex items-center shadow-sm transition-all w-full justify-center ${
                              !newNote[taskItem.task_id]?.trim() || !isSubscribed
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-md'
                            }`}
                            disabled={!newNote[taskItem.task_id]?.trim() || !isSubscribed}
                          >
                            <Save size={16} className="mr-2" />
                            Save Note
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout for Focus Areas */}
                <div className="hidden md:block space-y-6">
                  {selectedDay.focus_areas.map((focusArea, focusIndex) => (
                    <div key={focusIndex} className="mb-8 rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                      <div className={`p-6 ${getFocusAreaColor(focusIndex)}`}>
                        <div className="flex items-center mb-4">
                          <div className="bg-white bg-opacity-50 rounded-lg p-2 mr-3">
                            <Book size={24} className="text-indigo-700" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">{focusArea.focus_area}</h3>
                        </div>
                        <div className="w-full bg-white bg-opacity-70 rounded-full h-3 overflow-hidden shadow-inner">
                          <div
                            className={`h-3 rounded-full ${
                              calculateFocusAreaProgress(focusArea) === 100 ? 'bg-emerald-500' : 
                              calculateFocusAreaProgress(focusArea) > 50 ? 'bg-indigo-500' : 
                              calculateFocusAreaProgress(focusArea) > 0 ? 'bg-amber-500' : 'bg-gray-300'
                            } transition-all duration-500`}
                            style={{ width: `${calculateFocusAreaProgress(focusArea)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="font-medium text-gray-700">Progress</span>
                          <span className="font-bold text-indigo-700">{calculateFocusAreaProgress(focusArea)}%</span>
                        </div>
                      </div>
                      <div className="p-6 bg-white">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50">
                              <tr className="text-left text-gray-600">
                                <th className="p-4 text-sm font-semibold">#</th>
                                <th className="p-4 text-sm font-semibold">Task</th>
                                <th className="p-4 text-sm font-semibold">Resource</th>
                                <th className="p-4 text-sm font-semibold">Status</th>
                                <th className="p-4 text-sm font-semibold">Notes</th>
                                <th className="p-4 text-sm font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {focusArea.tasks.map((taskItem, taskIndex) => (
                                <tr key={taskItem.task_id} className="hover:bg-gray-50 transition-colors">
                                  <td className="p-4 text-sm">
                                    <span className={`bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-gray-700 font-medium ${!isSubscribed ? "blur-sm" : ""}`}>
                                      {taskIndex + 1}
                                    </span>
                                  </td>
                                  <td className={`${!isSubscribed ? "blur-sm" : ""} p-4 text-sm font-medium`}>{taskItem.task}</td>
                                  <td className="p-4 text-sm">
                                    {taskItem.resources ? (
                                      <a
                                        href={taskItem.resources}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-500 hover:text-indigo-700 flex items-center px-3 py-1 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors max-w-fit"
                                      >
                                        <ExternalLink size={14} className="mr-2" />
                                        View Resource
                                      </a>
                                    ) : (
                                      <span className="text-gray-400 italic">No resource available</span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <select
                                      value={userProgress[taskItem.task_id]?.status || 'not_completed'}
                                      onChange={(e) => updateTaskStatus(taskItem.task_id, e.target.value)}
                                      className={`w-full rounded-xl border border-gray-200 p-2 text-sm focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm cursor-pointer ${!isSubscribed ? "blur-sm" : ""}`}
                                      disabled={!isSubscribed}
                                    >
                                      <option value="not_completed">Not Completed</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                  </td>
                                  <td className="p-4">
                                    <textarea
                                      value={newNote[taskItem.task_id] || userProgress[taskItem.task_id]?.user_notes || ''}
                                      onChange={(e) => setNewNote(prev => ({
                                        ...prev,
                                        [taskItem.task_id]: e.target.value
                                      }))}
                                      rows={2}
                                      className={`w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-gray-50 shadow-sm transition-colors focus:bg-white ${!isSubscribed ? "blur-sm" : ""}`}
                                      placeholder="Add your notes here..."
                                      disabled={!isSubscribed}
                                    />
                                  </td>
                                  <td className="p-4">
                                    <button
                                      onClick={() => updateUserNotes(taskItem.task_id)}
                                      className={`${!isSubscribed ? "blur-sm" : ""} px-4 py-2 rounded-xl text-sm flex items-center shadow-sm transition-all ${
                                        !newNote[taskItem.task_id]?.trim() || !isSubscribed
                                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                          : 'bg-indigo-500 text-white hover:bg-indigo-600 hover:shadow-md'
                                      }`}
                                      disabled={!newNote[taskItem.task_id]?.trim() || !isSubscribed}
                                    >
                                      <Save size={16} className="mr-2" />
                                      Save Note
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 p-6 rounded-2xl">
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <div className="flex items-center text-gray-700 text-sm bg-white p-3 rounded-xl shadow-sm">
                      <Bookmark size={16} className="text-indigo-500 mr-3" />
                      <span className="font-medium mr-2">Total Tasks:</span>
                      <span className="font-bold">
                        {selectedDay?.focus_areas?.reduce((sum, area) => sum + area.tasks.length, 0) || 0}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-700 text-sm bg-white p-3 rounded-xl shadow-sm">
                      <Clock size={16} className="text-indigo-500 mr-3" />
                      <span className="font-medium mr-2">Estimated Time:</span>
                      <span className="font-bold">{selectedDay.time_required} hours</span>
                    </div>
                  </div>
                  <button
                    onClick={closeDayModal}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 flex items-center shadow-sm transition-colors w-full md:w-auto justify-center"
                  >
                    Close <ArrowRight size={16} className="ml-2" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {showPopup && user && isSubscribed && <FeedbackPopup />}
        </div>
      </div>
    </>
  );
}