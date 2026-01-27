// lib/fcm.js
// Firebase Cloud Messaging utility functions

import { getFCMToken, onMessageListener } from '@/app/firebase/firebase';
import { useEffect, useState } from 'react';

// Local storage key to avoid saving the same FCM token too often
const FCM_TOKEN_STORAGE_KEY = 'fcm_last_saved_token_v1';

/**
 * Hook to request notification permission and get FCM token
 */
export const useFCMToken = () => {
  const [token, setToken] = useState(null);
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      setPermission('unsupported');
      setLoading(false);
      return;
    }

    // Check current permission status
    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    if (currentPermission === 'granted') {
      // Get FCM token
      getFCMToken()
        .then((fcmToken) => {
          setToken(fcmToken);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error getting FCM token:', error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined') {
      console.error('requestPermission called on server side');
      return false;
    }

    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      alert('Your browser does not support notifications');
      return false;
    }

    try {
      console.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      setPermission(permission);

      if (permission === 'granted') {
        console.log('Permission granted! Setting up FCM...');
        
        // Register service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered successfully:', registration);
          } catch (error) {
            console.error('Service Worker registration failed:', error);
            alert('Failed to register service worker. Please check console for details.');
            return false;
          }
        } else {
          console.warn('Service Worker not supported');
        }

        // Wait a bit for service worker to fully activate
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get FCM token
        try {
          console.log('Attempting to get FCM token...');
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            console.log('✅ FCM Token obtained successfully');
            setToken(fcmToken);
            return true;
          } else {
            console.error('❌ Failed to get FCM token - token is null');
            const errorMsg = 'Permission granted but failed to get notification token.\n\n' +
              'Possible causes:\n' +
              '1. VAPID key not set or incorrect (check NEXT_PUBLIC_FCM_VAPID_KEY in .env.local)\n' +
              '2. Service worker not properly registered\n' +
              '3. Firebase project configuration mismatch\n\n' +
              'Check browser console for detailed error messages.';
            alert(errorMsg);
            return false;
          }
        } catch (tokenError) {
          console.error('❌ Error getting FCM token:', tokenError);
          console.error('Full error:', tokenError);
          
          // Show detailed error message
          const errorMsg = 'Permission granted but failed to get notification token.\n\n' +
            'Error: ' + tokenError.message + '\n\n' +
            'Common fixes:\n' +
            '1. Check NEXT_PUBLIC_FCM_VAPID_KEY in .env.local\n' +
            '2. Restart dev server after adding env variable\n' +
            '3. Verify firebase-messaging-sw.js is accessible\n' +
            '4. Check browser console for more details';
          alert(errorMsg);
          return false;
        }
      } else if (permission === 'denied') {
        console.log('Notification permission denied by user');
        alert('Notification permission was denied. You can enable it in your browser settings.');
        return false;
      } else {
        console.log('Notification permission dismissed by user');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('An error occurred while requesting permission: ' + error.message);
      return false;
    }
  };

  return { token, permission, loading, requestPermission };
};

/**
 * Hook to listen for foreground messages
 */
export const useFCMForegroundMessage = () => {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = async () => {
      try {
        const payload = await onMessageListener();
        setMessage(payload);
        
        // Show notification if permission is granted
        if (Notification.permission === 'granted') {
          const notificationTitle = payload.notification?.title || 'New Notification';
          const notificationOptions = {
            body: payload.notification?.body || '',
            icon: payload.notification?.icon || '/10tracker.png',
            badge: '/10tracker.png',
            image: payload.notification?.image,
            data: payload.data,
            tag: payload.data?.tag || 'default',
          };

          new Notification(notificationTitle, notificationOptions);
        }
      } catch (error) {
        console.error('Error in onMessageListener:', error);
      }
    };

    handleMessage();
  }, []);

  return message;
};

/**
 * Save FCM token to backend with enrollment tracking
 * - Only hits the API when the token (or userId) is new or hasn't been saved recently
 */
export const saveFCMTokenToBackend = async (token, userId = null) => {
  try {
    // In the browser, check if we already saved this token recently
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          const sameToken = parsed.token === token;
          const sameUser = (parsed.userId || null) === (userId || null);

          const lastSavedAt = parsed.savedAt ? new Date(parsed.savedAt).getTime() : null;
          const now = Date.now();
          const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours

          // If same token+user and last save was within the last day, skip network call
          if (sameToken && sameUser && lastSavedAt && now - lastSavedAt < ONE_DAY_MS) {
            console.log('FCM token already saved recently, skipping backend call');
            return { success: true, skipped: true, reason: 'token_already_saved_recently' };
          }
        }
      } catch (e) {
        console.warn('Failed to read cached FCM token from localStorage:', e);
      }
    }

    // Get current page URL for enrollment tracking
    const enrollmentSource = typeof window !== 'undefined' 
      ? window.location.pathname 
      : '/';
    
    // Get device information
    const deviceInfo = typeof window !== 'undefined' ? {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen?.width,
      screenHeight: window.screen?.height,
    } : null;

    const response = await fetch('/api/fcm/save-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        userId,
        enrollmentSource,
        deviceInfo,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save FCM token');
    }

    const data = await response.json();

    // Cache the fact that we successfully saved this token
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          FCM_TOKEN_STORAGE_KEY,
          JSON.stringify({
            token,
            userId: userId || null,
            savedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.warn('Failed to cache FCM token save in localStorage:', e);
      }
    }

    return data;
  } catch (error) {
    console.error('Error saving FCM token to backend:', error);
    throw error;
  }
};

/**
 * Delete FCM token from backend
 */
export const deleteFCMTokenFromBackend = async (token) => {
  try {
    const response = await fetch('/api/fcm/delete-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete FCM token');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting FCM token from backend:', error);
    throw error;
  }
};

