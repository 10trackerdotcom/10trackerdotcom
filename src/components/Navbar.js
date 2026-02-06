"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  User,
  LogIn,
  LogOut,
  Menu,
  X,
  BarChart2,
  Shield,
  FileText,
  Info,
  Mail,
  Grid3x3,
  ChevronRight,
  GraduationCap,
  BookMarked,
  Newspaper,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useArticleCategories } from "@/lib/hooks/useArticleCategories";
import { NotificationButton } from "@/components/NotificationEnrollment";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const { user, signOut, setShowAuthModal, isAdmin, setShowProfileModal } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Check if we're on an auth page to prevent unnecessary API calls
  const isAuthPage = pathname === '/sign-up' || pathname === '/sign-in';
  
  // Only fetch categories when drawer is opened AND not on auth pages
  const { categories, loading: categoriesLoading } = useArticleCategories({ 
    enabled: showCategoryDrawer && !isAuthPage 
  });

  const getCategoryColor = (categorySlug) => {
    if (!categories || !Array.isArray(categories)) return '#3B82F6';
    const category = categories.find(cat => cat.slug === categorySlug);
    return category?.color || '#3B82F6';
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleSignOut = () => {
    signOut();
    setUserMenuOpen(false);
  };

  const mainNavItems = [
    { name: "Home", path: "/", icon: <Home size={18} /> },
    { name: "Exams", path: "/exams", icon: <GraduationCap size={18} /> },
    { name: "Articles", path: "/articles", icon: <Newspaper size={18} /> },
    { name: "About Us", path: "/about-us", icon: <Info size={18} /> },
    { name: "Contact Us", path: "/contact-us", icon: <Mail size={18} /> },
  ];

  const footerNavItems = [
    { name: "Privacy Policy", path: "/privacy-policy", icon: <Shield size={18} /> },
    { name: "Terms of Service", path: "/terms-and-services", icon: <FileText size={18} /> },
    { name: "Disclaimer", path: "/disclaimer", icon: <FileText size={18} /> },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-start"
                >
                  <div className="border-2 border-black px-3  md:px-4">
                    <span className="text-lg md:text-xl font-semibold text-black tracking-wide">
                      10tracker.com
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-gray-700 italic font-light">
                  {`Practice -> Track -> Achieve.`}
                  </p>
                </motion.div>
              </Link>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className="group inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.name}
                  {typeof window !== "undefined" && (
                    <motion.div
                      className="h-0.5 w-0 bg-gradient-to-r from-amber-400 to-amber-600 mt-0.5"
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </Link>
              ))}

              {/* Integrated Auth component */}
              <div className="flex items-center gap-3 pl-3 ml-3 border-l border-gray-200">
                <NotificationButton />
                {typeof window !== "undefined" && user ? (
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold text-white">
                        {(user?.fullName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || '').toUpperCase()}
                      </div>
                      <button
                        onClick={toggleUserMenu}
                        className="text-sm bg-gray-800 hover:bg-gray-900 px-3 py-1 rounded-full text-white transition-colors"
                      >
                        {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Profile"}
                      </button>
                    </div>

                    {/* User dropdown menu */}
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg z-50"
                      >
                        <Link
                          href="/user-progress"
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <BarChart2 size={16} className="mr-2" />
                            My Progress
                          </div>
                        </Link>
                        <button
                          onClick={() => setShowProfileModal(true)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <User size={16} className="mr-2" />
                            Profile Settings
                          </div>
                        </button>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <div className="flex items-center">
                              <Shield size={16} className="mr-2" />
                              Admin
                            </div>
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <LogOut size={16} className="mr-2" />
                            Sign Out
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="https://accounts.10tracker.com/sign-in"
                      className="px-4 py-2 rounded-lg font-medium bg-white border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="https://accounts.10tracker.com/sign-up"
                      className="px-4 py-2 rounded-lg font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center pr-1">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed top-20 left-0 right-0 bg-white shadow-xl border-t border-gray-100 z-50"
          >
            <div className="px-4 pt-4 pb-6 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto">
              {/* Main Navigation Items */}
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                >
                  <span className="mr-3 text-gray-600">{item.icon}</span>
                  {item.name}
                </Link>
              ))}

              {/* User Progress - Show for all users */}
              <Link
                href="/user-progress"
                onClick={() => setIsOpen(false)}
                className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
              >
                <BarChart2 size={18} className="mr-3 text-gray-600" />
                My Progress
              </Link>

              {/* Notification Button - Mobile */}
              <NotificationButton 
                showLabel={true}
                className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
              />

              {/* Article Categories Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCategoryDrawer(true);
                }}
                className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
              >
                <Grid3x3 size={18} className="mr-3 text-gray-600" />
                Article Categories
                <ChevronRight size={18} className="ml-auto text-gray-400" />
              </button>

              {/* Divider */}
              <div className="my-4 border-t border-gray-200"></div>

              {/* Mobile user profile or authentication */}
              {typeof window !== "undefined" && user ? (
                <>
                  <div className="flex items-center px-4 py-3 gap-3 bg-gray-50 rounded-lg mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-lg font-bold text-white shadow-sm">
                      {(user?.fullName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || '').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Profile"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.primaryEmailAddress?.emailAddress || ""}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                  >
                    <User size={18} className="mr-3 text-gray-600" />
                    Profile Settings
                  </button>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-gray-800 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                    >
                      <Shield size={18} className="mr-3 text-gray-600" />
                      Admin Panel
                    </Link>
                  )}
                  <div className="my-2 border-t border-gray-200"></div>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-all duration-200 active:bg-red-100"
                  >
                    <LogOut size={18} className="mr-3" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-3 pt-2">
                  <Link
                    href="https://accounts.10tracker.com/sign-in"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 rounded-lg bg-neutral-900 text-white font-semibold text-base hover:bg-neutral-800 transition-all duration-200 active:scale-[0.98] text-center"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="https://accounts.10tracker.com/sign-up"
                    onClick={() => setIsOpen(false)}
                    className="block w-full px-4 py-3 rounded-lg bg-white border border-neutral-300 text-neutral-900 font-semibold text-base hover:bg-neutral-50 transition-all duration-200 active:scale-[0.98] text-center"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Footer Navigation Items */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="space-y-1">
                  {footerNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 active:bg-gray-100"
                    >
                      <span className="mr-3 text-gray-500">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Drawer for Mobile */}
      <AnimatePresence>
        {showCategoryDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryDrawer(false)}
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
                  onClick={() => setShowCategoryDrawer(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                  aria-label="Close drawer"
                >
                  <X className="w-6 h-6 text-neutral-600" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {categoriesLoading ? (
                  // Enhanced Shimmer/Skeleton Loading UI
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
                          onClick={() => setShowCategoryDrawer(false)}
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

      {/* Footer navigation for desktop */}
      <div className="hidden md:block bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 py-2">
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
