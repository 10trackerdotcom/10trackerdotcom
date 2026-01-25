'use client';

import { useState, useEffect } from 'react';
import { useFCMToken } from '@/lib/fcm';
import { Bell, BellOff, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationEnrollment = () => {
  const { token, permission, loading, requestPermission } = useFCMToken();
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  // Show banner if permission is not granted and not already dismissed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    
    // Debug logging
    console.log('Notification Enrollment State:', {
      permission,
      loading,
      dismissed,
      showBanner
    });
    
    // Show banner if:
    // - Permission is not granted
    // - Not loading
    // - Not already dismissed
    // - Browser supports notifications
    if (
      permission !== 'granted' && 
      !loading && 
      permission !== 'unsupported' &&
      !dismissed &&
      permission !== null
    ) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        console.log('Showing notification banner');
        setShowBanner(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [permission, loading]);

  // Update enabled state when token is available
  useEffect(() => {
    if (token && permission === 'granted') {
      setIsEnabled(true);
      setShowBanner(false);
    }
  }, [token, permission]);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      console.log('Requesting notification permission...');
      const success = await requestPermission();
      console.log('Permission request result:', success);
      
      if (success) {
        setIsEnabled(true);
        setShowBanner(false);
        // Clear dismissed state since user enabled it
        localStorage.removeItem('notification-banner-dismissed');
      } else {
        // Permission was denied - show feedback
        console.warn('Notification permission was denied or not granted');
        // Keep banner visible so user can try again
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      alert('Failed to enable notifications. Please check your browser settings and try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  // Don't show anything if:
  // - Permission is granted (notifications enabled)
  // - Browser doesn't support notifications
  // - Still loading
  if (permission === 'granted' || permission === 'unsupported' || loading || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50"
        >
          <div className="bg-white border-2 border-neutral-200 rounded-xl shadow-2xl p-5 relative">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>

            {/* Icon */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  Stay Updated
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Enable push notifications to get instant updates on new articles, job postings, and exam results.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleEnableNotifications}
                disabled={isRequesting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isRequesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enabling...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Enable Notifications</span>
                  </>
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
            
            {/* Debug info - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 pt-3 border-t border-neutral-200">
                <button
                  onClick={() => {
                    localStorage.removeItem('notification-banner-dismissed');
                    setShowBanner(true);
                    console.log('Reset notification banner for testing');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  [Dev] Reset Banner
                </button>
                <div className="text-xs text-neutral-500 mt-1">
                  Permission: {permission || 'checking...'} | 
                  Token: {token ? '✓' : '✗'} | 
                  Loading: {loading ? 'yes' : 'no'}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact notification button for Navbar/Header
export const NotificationButton = ({ className = '', showLabel = false }) => {
  const { token, permission, loading, requestPermission } = useFCMToken();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleClick = async () => {
    if (permission === 'granted') {
      // Already enabled - could show settings or status
      return;
    }
    
    setIsRequesting(true);
    try {
      await requestPermission();
    } catch (error) {
      console.error('Error requesting permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  if (loading || permission === 'unsupported') {
    return null;
  }

  // If showLabel is true, render as a menu item with icon and text
  if (showLabel) {
    return (
      <button
        onClick={handleClick}
        disabled={isRequesting}
        className={className}
        aria-label={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
      >
        {permission === 'granted' ? (
          <CheckCircle2 size={18} className="mr-3 text-gray-600" />
        ) : (
          <Bell size={18} className="mr-3 text-gray-600" />
        )}
        <span className="flex-1 text-left">
          {permission === 'granted' ? 'Notifications Enabled' : 'Enable Notifications'}
        </span>
        {isRequesting && (
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>
    );
  }

  // Default: icon-only button for desktop navbar
  return (
    <button
      onClick={handleClick}
      disabled={isRequesting}
      className={`relative p-2 rounded-lg transition-colors ${
        permission === 'granted'
          ? 'text-blue-600 hover:bg-blue-50'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      } ${className}`}
      aria-label={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
      title={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
    >
      {permission === 'granted' ? (
        <CheckCircle2 className="w-5 h-5" />
      ) : (
        <Bell className="w-5 h-5" />
      )}
      {isRequesting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
};

export default NotificationEnrollment;
