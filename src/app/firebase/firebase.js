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
    if (!messaging) {
      const supported = await isSupported();
      if (!supported) {
        console.log('FCM is not supported in this browser');
        return null;
      }
      messaging = getMessaging(app);
    }

    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not set. Please set NEXT_PUBLIC_FCM_VAPID_KEY in your .env file');
      return null;
    }

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
    return null;
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
