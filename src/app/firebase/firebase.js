// firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

// Your Firebase configuration object (get this from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyCyHHobmWFRWb_ZnKhs3JXSCKdbTQaNHW8",
  authDomain: "examtracker-6731e.firebaseapp.com",
  projectId: "examtracker-6731e",
  storageBucket: "examtracker-6731e.firebasestorage.app",
  messagingSenderId: "492165379080",
  appId: "1:492165379080:web:6c71aa16d2447f81348dbd",
  measurementId: "G-Z5B4SRV9H7",
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);

// Initialize Firebase Cloud Messaging
let messaging = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}

// Function to get FCM token
export const getFCMToken = async () => {
  try {
    // Check if we're in browser
    if (typeof window === 'undefined') {
      console.error('getFCMToken called on server side');
      throw new Error('getFCMToken can only be called in the browser');
    }

    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.error('Browser does not support notifications');
      throw new Error('Browser does not support notifications');
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      console.error('Notification permission not granted. Current permission:', Notification.permission);
      throw new Error(`Notification permission not granted. Current: ${Notification.permission}`);
    }

    // Check if service worker is registered
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      throw new Error('Service Worker not supported in this browser');
    }

    // Wait for service worker to be ready
    let registration;
    try {
      registration = await navigator.serviceWorker.ready;
      console.log('Service Worker is ready:', registration);
    } catch (swError) {
      console.error('Service Worker not ready:', swError);
      throw new Error('Service Worker is not ready. Please ensure it is registered.');
    }

    // Initialize messaging if not already done
    if (!messaging) {
      const supported = await isSupported();
      if (!supported) {
        console.error('FCM is not supported in this browser');
        throw new Error('FCM is not supported in this browser');
      }
      messaging = getMessaging(app);
      console.log('Firebase Messaging initialized');
    }

    // Check VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not set. Please set NEXT_PUBLIC_FCM_VAPID_KEY in your .env.local file');
      throw new Error('VAPID key is not set. Please set NEXT_PUBLIC_FCM_VAPID_KEY in your .env.local file');
    }

    if (vapidKey.length < 80) {
      console.warn('VAPID key seems too short. Expected length: ~87 characters. Got:', vapidKey.length);
    }

    console.log('Requesting FCM token with VAPID key (first 20 chars):', vapidKey.substring(0, 20) + '...');

    // Request token
    const token = await getToken(messaging, { 
      vapidKey,
      serviceWorkerRegistration: registration 
    });

    if (token) {
      console.log('✅ FCM Token obtained successfully:', token.substring(0, 50) + '...');
      return token;
    } else {
      console.error('No registration token available. This usually means:');
      console.error('1. Service worker is not properly registered');
      console.error('2. VAPID key is incorrect');
      console.error('3. Firebase project configuration mismatch');
      throw new Error('No registration token available. Check service worker registration and VAPID key.');
    }
  } catch (err) {
    console.error('❌ Error getting FCM token:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    // Provide helpful error messages
    if (err.message?.includes('VAPID')) {
      throw new Error('VAPID key error: ' + err.message + '. Please check NEXT_PUBLIC_FCM_VAPID_KEY in .env.local');
    } else if (err.message?.includes('service worker') || err.message?.includes('Service Worker')) {
      throw new Error('Service Worker error: ' + err.message + '. Make sure firebase-messaging-sw.js is accessible.');
    } else if (err.message?.includes('permission')) {
      throw new Error('Permission error: ' + err.message);
    } else {
      throw new Error('Failed to get FCM token: ' + (err.message || 'Unknown error'));
    }
  }
};

// Function to handle foreground messages
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      isSupported().then((supported) => {
        if (supported) {
          messaging = getMessaging(app);
          onMessage(messaging, (payload) => {
            resolve(payload);
          });
        }
      });
    } else {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });
};

export { messaging };
