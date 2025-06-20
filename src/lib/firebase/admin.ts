// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';

// Use a global variable to store the app instance
declare global {
  // eslint-disable-next-line no-var
  var adminApp: admin.app.App | undefined;
}

export function getAdminApp() {
  if (global.adminApp == null) {
    console.log('Initializing Firebase Admin SDK...');
    console.log('FIREBASE_PROJECT_ID in admin.ts:', process.env.FIREBASE_PROJECT_ID);
    console.log('FIREBASE_CLIENT_EMAIL in admin.ts:', process.env.FIREBASE_CLIENT_EMAIL);
    console.log('FIREBASE_PRIVATE_KEY in admin.ts:', process.env.FIREBASE_PRIVATE_KEY ? '***** (present)' : 'undefined (missing)');

    try {
      // Try to get an existing app first
      global.adminApp = admin.app();
      console.log('Firebase Admin SDK already initialized (retrieved existing).');
    } catch (e) {
      // If getting an app fails, initialize a new one
      console.log('No existing Firebase Admin SDK app found, initializing a new one.');
      global.adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  } else {
    console.log('Firebase Admin SDK already initialized (using global variable).');
  }
  return global.adminApp;
}

// You can still export auth and firestore, but they will be derived from the
// app instance obtained through getAdminApp()
const adminAppInstance = getAdminApp();
const auth = adminAppInstance.auth();
const firestore = adminAppInstance.firestore();

export { auth, firestore };
