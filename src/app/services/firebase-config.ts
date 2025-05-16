// src/app/firebase-config.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBordW3FDRtiqFD4VlJXqdl2XrUZzV-j2o",
  authDomain: "loginshein-e7033.firebaseapp.com",
  projectId: "loginshein-e7033",
  storageBucket: "loginshein-e7033.appspot.com",
  messagingSenderId: "435758152351",
  appId: "1:435758152351:web:c13ece8239dc1bf62fc0aa",
  measurementId: "G-20LVKBMFHK"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
