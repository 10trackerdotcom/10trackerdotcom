// lib/fcm.js
// Firebase Cloud Messaging utility functions

import { getFCMToken, onMessageListener } from '@/app/firebase/firebase';
import { useEffect, useState } from 'react';

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
    if (typeof window === 'undefined') return false;

    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Register service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service Worker registered:', registration);
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }

        // Get FCM token
        const fcmToken = await getFCMToken();
        setToken(fcmToken);
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
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
 * Save FCM token to backend
 */
export const saveFCMTokenToBackend = async (token, userId = null) => {
  try {
    const response = await fetch('/api/fcm/save-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save FCM token');
    }

    const data = await response.json();
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

