'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, X, ChevronRight, Grid3x3 } from 'lucide-react';
import { useArticleCategories } from '@/lib/hooks/useArticleCategories';

const MobileBottomMenu = () => {
  const [showCategories, setShowCategories] = useState(false);
  const pathname = usePathname();
  
  // Check if we're on an auth page to prevent unnecessary API calls
  const isAuthPage = pathname === '/sign-up' || pathname === '/sign-in';
  
  // Only fetch categories when drawer is opened AND not on auth pages
  const { categories } = useArticleCategories({ 
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 shadow-lg">
        <div className="flex items-center justify-around h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/') ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          
          <button
            onClick={() => setShowCategories(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              showCategories ? 'text-neutral-900' : 'text-neutral-500'
            }`}
          >
            <Grid3x3 className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Categories</span>
          </button>
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
                <h2 className="text-xl font-semibold text-neutral-900">Categories</h2>
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
                {categories && Array.isArray(categories) && categories.length > 0 ? (
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
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Grid3x3 className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="text-neutral-600">No categories available</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomMenu;
