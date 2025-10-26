'use client'

import React from 'react';
import { SignedIn, SignedOut, SignInButton, UserProfile } from '@clerk/nextjs';
import { useAuth } from '@/app/context/AuthContext';
import { X } from 'lucide-react';

export default function ProfileModal() {
  const { showProfileModal, setShowProfileModal } = useAuth();
  
  if (!showProfileModal) return null;

  return (
    <>
      {/* Global styles for Clerk UserProfile */}
      <style jsx global>{`
        /* Remove all max-width constraints from Clerk components */
        .cl-modal {
          max-width: none !important;
        }
        
        .cl-modalContent {
          max-width: none !important;
          width: 100% !important;
        }
        
        .cl-card {
          width: 100% !important;
          max-width: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        
        .cl-userProfile-root {
          width: 100% !important;
          max-width: none !important;
        }
        
        /* Remove internal constraints */
        .cl-profileSection,
        .cl-profilePage,
        .cl-profileSection__profile,
        .cl-profileSection__security,
        .cl-profileSection__emailAddresses,
        .cl-profileSection__phoneNumbers,
        .cl-profileSection__connectedAccounts,
        .cl-profileSection__activeDevices {
          width: 100% !important;
          max-width: none !important;
        }
        
        /* Navbar styling */
        .cl-navbar {
          background-color: #f8fafc !important;
        }
        
        .cl-navbarButton {
          color: #475569 !important;
        }
        
        .cl-navbarButtonActive {
          color: #f59e0b !important;
          border-bottom-color: #f59e0b !important;
        }
        
        /* Primary button styling */
        .cl-formButtonPrimary {
          background-color: #f59e0b !important;
        }
        
        .cl-formButtonPrimary:hover {
          background-color: #d97706 !important;
        }
      `}</style>

      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto"
        onClick={() => setShowProfileModal(false)}
      >
        {/* Modal Container - Full width on mobile, constrained on desktop */}
        <div 
          className="w-full min-h-screen md:min-h-0 md:my-8 md:max-w-[95vw] lg:max-w-[1000px] xl:max-w-[1000px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Content */}
          <div className="bg-white md:rounded-2xl shadow-2xl overflow-hidden h-full md:h-auto">
            {/* Header with Close Button */}
            <div className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900">Your Profile</h3>
              <button 
                onClick={() => setShowProfileModal(false)} 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Close modal"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 lg:p-8">
              <SignedIn>
                <div className="w-full">
                  <UserProfile 
                  />
                </div>
              </SignedIn>
              
              <SignedOut>
                <div className="text-center py-12 sm:py-16 lg:py-20">
                  <div className="mb-6">
                    <svg 
                      className="mx-auto h-16 w-16 text-slate-400" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900 mb-2">Sign in Required</h4>
                  <p className="mb-6 text-slate-600 max-w-md mx-auto">
                    Please sign in to view and manage your profile settings.
                  </p>
                  <SignInButton mode="modal">
                    <button className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
                      Sign In to Continue
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}