// lib/firebase.js
import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyCyHHobmWFRWb_ZnKhs3JXSCKdbTQaNHW8",
  authDomain: "examtracker-6731e.firebaseapp.com",
  projectId: "examtracker-6731e",
  storageBucket: "examtracker-6731e.firebasestorage.app",
  messagingSenderId: "492165379080",
  appId: "1:492165379080:web:6c71aa16d2447f81348dbd",
  measurementId: "G-Z5B4SRV9H7",
};

export const app = initializeApp(firebaseConfig);
