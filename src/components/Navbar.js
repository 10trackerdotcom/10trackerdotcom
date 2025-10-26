"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, setShowAuthModal, isAdmin, setShowProfileModal } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);


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
    { name: "About Us", path: "https://10tracker.com/about/", icon: <Info size={18} /> },
    { name: "Contact Us", path: "https://10tracker.com/contact/", icon: <Mail size={18} /> },
    { name: "Privacy Policy", path: "https://10tracker.com/privacy/", icon: <Shield size={18} /> },
    { name: "Terms of Service", path: "https://10tracker.com/terms/", icon: <FileText size={18} /> },
    // { name: "Exams", path: "/exams", icon: <BookOpen size={18} /> },
    // { name: "Dashboard", path: "/dashboard", icon: <BarChart2 size={18} /> },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-28">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center"
              >
                <span className="text-2xl font-bold text-gray-800">
                  10Tracker.com
                </span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {mainNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-500 transition-colors duration-200"
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.name}
                {/* Defer animation to client-side only */}
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
            <div className="flex items-center space-x-3">
              {typeof window !== "undefined" && user ? (
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold text-white">
                      {(user?.fullName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || '').toUpperCase()}
                    </div>
                    <button
                      onClick={toggleUserMenu}
                      className="text-sm bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded-full text-white transition-colors"
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
                      <button
                        onClick={() => setShowProfileModal(true)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center">
                          <User size={16} className="mr-2" />
                          Open Profile Modal
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
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-white text-gray-600 px-4 py-2 rounded-full font-medium hover:bg-gray-100 border border-gray-300 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-amber-500 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white shadow-lg rounded-b-lg"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-amber-500 hover:bg-gray-50"
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            {/* Mobile user profile or authentication */}
            {typeof window !== "undefined" && user ? (
              <>
                <div className="flex items-center px-3 py-2 gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold text-white">
                    {(user?.fullName?.[0] || user?.primaryEmailAddress?.emailAddress?.[0] || '').toUpperCase()}
                  </div>
                  <span className="text-base font-medium text-gray-700">
                    {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Profile"}
                  </span>
                </div>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <User size={16} className="mr-2" />
                    Open Profile Modal
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
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50"
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="px-3 py-3 space-y-2">
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-white font-medium text-sm shadow-md"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 rounded-full bg-gray-900 text-amber-300 font-medium text-sm border border-amber-400"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Footer navigation items */}
            <div className="pt-4 pb-2 border-t border-gray-200">
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                More Information
              </p>
              {/* {footerNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-amber-500 hover:bg-gray-50"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))} */}
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer navigation for desktop */}
      <div className="hidden md:block bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center space-x-8 py-2">
            {/* {footerNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-500 hover:text-amber-500"
              >
                <span className="mr-1">{item.icon}</span>
                {item.name}
              </Link>
            ))} */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;