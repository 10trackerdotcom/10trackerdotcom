'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  X, 
  ChevronRight, 
  Grid3x3, 
  GraduationCap, 
  Newspaper, 
  BarChart2, 
  User,
  BookOpen,
  Info,
  Mail
} from 'lucide-react';
import { useArticleCategories } from '@/lib/hooks/useArticleCategories';
import { useAuth } from '@/app/context/AuthContext';

const MobileBottomMenu = () => {
  const [showCategories, setShowCategories] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  
  // Check if we're on an auth page to prevent unnecessary API calls
  const isAuthPage = pathname === '/sign-up' || pathname === '/sign-in';
  
  // Only fetch categories when drawer is opened AND not on auth pages
  const { categories, loading: categoriesLoading } = useArticleCategories({ 
    enabled: showCategories && !isAuthPage 
  });

  const getCategoryColor = (categorySlug) => {
    if (!categories || !Array.isArray(categories)) return '#3B82F6';
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.color || '#3B82F6';
  };

  const isActive = (path) => {
    return pathname === path;
  };

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 ${
              isActive('/') ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <Home className="w-5 h-5 mb-1 flex-shrink-0" />
            <span className="text-xs font-medium truncate w-full text-center">Home</span>
          </Link>
          
          <Link
            href="/exams"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 ${
              isActive('/exams') ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <GraduationCap className="w-5 h-5 mb-1 flex-shrink-0" />
            <span className="text-xs font-medium truncate w-full text-center">Exams</span>
          </Link>

          <Link
            href="/articles"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 ${
              isActive('/articles') ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <Newspaper className="w-5 h-5 mb-1 flex-shrink-0" />
            <span className="text-xs font-medium truncate w-full text-center">Articles</span>
          </Link>
          
          <button
            onClick={() => setShowCategories(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 ${
              showCategories ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <Grid3x3 className="w-5 h-5 mb-1 flex-shrink-0" />
            <span className="text-xs font-medium truncate w-full text-center">Categories</span>
          </button>

          {user ? (
            <Link
              href="/user-progress"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 ${
                isActive('/user-progress') ? 'text-neutral-900' : 'text-neutral-500'
              }`}
            >
              <BarChart2 className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-xs font-medium truncate w-full text-center">Progress</span>
            </Link>
          ) : (
            <Link
              href="https://accounts.10tracker.com/sign-in"
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors min-w-0 ${
                isActive('/sign-in') ? 'text-neutral-900' : 'text-neutral-500'
              }`}
            >
              <User className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-xs font-medium truncate w-full text-center">Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Drawer-style Category Modal */}
      <AnimatePresence>
        {showCategories && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategories(false)}
              className="md:hidden fixed inset-0 bg-black/50 z-[60]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white sticky top-0 z-10">
                <h2 className="text-xl font-semibold text-neutral-900">Menu</h2>
                <button
                  onClick={() => setShowCategories(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-6 h-6 text-neutral-600" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Quick Navigation */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Quick Links</h3>
                  <div className="space-y-2">
                    <Link
                      href="/exams"
                      onClick={() => setShowCategories(false)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 transition-all group"
                    >
                      <GraduationCap className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                      <span className="text-base font-medium text-neutral-900 group-hover:text-neutral-700 flex-1">
                        All Exams
                      </span>
                      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                    </Link>
                    <Link
                      href="/articles"
                      onClick={() => setShowCategories(false)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 transition-all group"
                    >
                      <Newspaper className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                      <span className="text-base font-medium text-neutral-900 group-hover:text-neutral-700 flex-1">
                        All Articles
                      </span>
                      <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                    </Link>
                    {user && (
                      <Link
                        href="/user-progress"
                        onClick={() => setShowCategories(false)}
                        className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 transition-all group"
                      >
                        <BarChart2 className="w-5 h-5 text-neutral-600 flex-shrink-0" />
                        <span className="text-base font-medium text-neutral-900 group-hover:text-neutral-700 flex-1">
                          My Progress
                        </span>
                        <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Article Categories */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">Article Categories</h3>
                  {categoriesLoading ? (
                    // Shimmer/Skeleton Loading UI
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-white overflow-hidden relative"
                        >
                          {/* Shimmer overlay effect */}
                          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
                          {/* Color dot shimmer */}
                          <div className="w-4 h-4 rounded-full bg-neutral-200 flex-shrink-0 animate-pulse"></div>
                          {/* Text shimmer */}
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-neutral-200 rounded w-3/4 animate-pulse"></div>
                            <div className="h-3 bg-neutral-100 rounded w-1/2 animate-pulse"></div>
                          </div>
                          {/* Arrow shimmer */}
                          <div className="w-5 h-5 bg-neutral-200 rounded animate-pulse"></div>
                        </motion.div>
                      ))}
                    </div>
                  ) : categories && Array.isArray(categories) && categories.length > 0 ? (
                    <div className="space-y-2">
                      {categories.map((category, index) => (
                        <motion.div
                          key={category.slug}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            href={`/article/${category.slug}`}
                            onClick={() => setShowCategories(false)}
                            className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 active:bg-neutral-100 transition-all group"
                          >
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                              style={{ backgroundColor: category.color || getCategoryColor(category.slug) }}
                            />
                            <span className="text-base font-medium text-neutral-900 group-hover:text-neutral-700 flex-1">
                              {category.name}
                            </span>
                            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Grid3x3 className="w-6 h-6 text-neutral-400" />
                      </div>
                      <p className="text-sm text-neutral-600">No categories available</p>
                    </div>
                  )}
                </div>

                {/* Footer Links */}
                <div className="pt-4 border-t border-neutral-200">
                  <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">More</h3>
                  <div className="space-y-2">
                    <Link
                      href="/about-us"
                      onClick={() => setShowCategories(false)}
                      className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-all"
                    >
                      <Info className="w-4 h-4 text-neutral-500" />
                      About Us
                    </Link>
                    <Link
                      href="/contact-us"
                      onClick={() => setShowCategories(false)}
                      className="flex items-center gap-3 p-3 rounded-lg text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-all"
                    >
                      <Mail className="w-4 h-4 text-neutral-500" />
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomMenu;
