// context/AuthContext.js
'use client'

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

// Create the auth context that proxies Clerk while preserving modal visibility state
const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
  showAuthModal: false,
  setShowAuthModal: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, openSignIn } = useClerk();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const signInWithGoogle = async () => {
    // Open Clerk's SignIn modal; configured social providers in Clerk dashboard
    await openSignIn();
  };

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
  const isAdmin = !!(user && user.primaryEmailAddress && adminEmails.includes(user.primaryEmailAddress.emailAddress));

  const value = useMemo(() => ({
    user,
    loading: !isLoaded,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!isSignedIn,
    isAdmin,
    showAuthModal,
    setShowAuthModal,
    showProfileModal,
    setShowProfileModal
  }), [user, isLoaded, isSignedIn, isAdmin, signOut, showAuthModal, showProfileModal]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};