
// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';

// Use a global variable to store the app instance to avoid re-initializing in dev mode.
declare global {
  // eslint-disable-next-line no-var
  var adminApp: admin.app.App | undefined;
}

export function getAdminApp() {
  // If the app is already initialized, either in this session or in the global cache, return it.
  if (global.adminApp) {
    console.log('[admin.ts] Returning cached Firebase Admin App instance.');
    return global.adminApp;
  }
  if (admin.apps.length > 0) {
    console.log('[admin.ts] Returning existing Firebase Admin App instance.');
    global.adminApp = admin.app();
    return global.adminApp;
  }

  // Check for required environment variables.
  console.log('[admin.ts] Checking for Firebase Admin environment variables...');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    const errorMessage = 'Firebase Admin environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set. Server-side functionality will fail.';
    console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    console.error(`!!! ERROR: ${errorMessage}`);
    console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
    // Throw an error that will be caught by the server action.
    // This prevents the server from crashing on startup.
    throw new Error(errorMessage);
  }
  
  console.log('[admin.ts] Initializing a new Firebase Admin App instance...');
  try {
    global.adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[admin.ts] Firebase Admin SDK initialized successfully.');
    return global.adminApp;
  } catch (error: any) {
    console.error('[admin.ts] Firebase Admin SDK initialization failed:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}
