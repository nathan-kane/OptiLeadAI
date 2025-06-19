import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDpnkVVcG4a7vn0c4TwKiC55lby3bp_L4",
  authDomain: "optileadsai.firebaseapp.com",
  projectId: "optileadsai",
  storageBucket: "optileadsai.firebasestorage.app",
  messagingSenderId: "295347007268",
  appId: "1:295347007268:web:9f2c2e10f9326dbf454db1",
  measurementId: "G-6MVC6VHKC7",
  // Add other configuration options if needed
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Firestore database
export const db = getFirestore(app);