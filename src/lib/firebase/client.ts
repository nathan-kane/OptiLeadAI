// src/lib/firebase/client.ts
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let firebaseConfig: any = {};

// Use environment variables for development and production builds
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
  firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
} else {
  // Fallback for local development or other environments if needed
  // You might want to put a development-specific config here
  firebaseConfig = {};
}

console.log('[FIREBASE CONFIG]', firebaseConfig);


// We will export these, but they will be assigned conditionally.
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Check if all required config values are present.
const isConfigValid = Object.values(firebaseConfig).every(Boolean);

try {
    if (isConfigValid) {
        if (!getApps().length) {
          app = initializeApp(firebaseConfig);
          console.log("[client.ts] Firebase app initialized.");
        } else {
          app = getApp();
          console.log("[client.ts] Existing Firebase app retrieved.");
        }
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        // This error will be thrown during server-side rendering if env vars are missing.
        // The try/catch below will handle it gracefully, preventing a server crash.
        throw new Error("Firebase client config is missing or invalid after check. Check your environment variables.");
    }
} catch (error) {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("!!! FIREBASE CLIENT INITIALIZATION FAILED                  !!!");
    if (error instanceof Error) {
        console.error(`!!! Error: ${error.message}`);
    }
    console.error("!!! Firebase features will not work.                       !!!");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    
    // Assign dummy objects to prevent the application from crashing on import.
    // The app will be broken, but at least the server will start.
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
}


// Export client-side Firebase instances you need
export { app, auth, db };
