'use client';

// FCMNotificationProvider.js
// Component to initialize FCM and handle notifications

import { useEffect } from 'react';
import { useFCMToken, useFCMForegroundMessage, saveFCMTokenToBackend } from '@/lib/fcm';

const FCMNotificationProvider = ({ children }) => {
  const { token, permission, requestPermission } = useFCMToken();
  const foregroundMessage = useFCMForegroundMessage();

  useEffect(() => {
    // Register service worker on mount
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  useEffect(() => {
    // Save token to backend when available
    if (token) {
      // You can get userId from your auth context here
      // For now, we'll save without userId
      saveFCMTokenToBackend(token)
        .then(() => {
          console.log('FCM token saved to backend');
        })
        .catch((error) => {
          console.error('Failed to save FCM token:', error);
        });
    }
  }, [token]);

  useEffect(() => {
    // Handle foreground messages
    if (foregroundMessage) {
      console.log('Foreground message received:', foregroundMessage);
      // You can add custom handling here, like showing a toast notification
    }
  }, [foregroundMessage]);

  return <>{children}</>;
};

export default FCMNotificationProvider;

