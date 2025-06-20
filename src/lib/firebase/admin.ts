// src/lib/firebase/admin.ts
import * as admin from 'firebase-admin';



// Initialize Firebase Admin SDK
console.log('FIREBASE_PROJECT_ID in admin.ts:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL in admin.ts:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY in admin.ts:', process.env.FIREBASE_PRIVATE_KEY ? '***** (present)' : 'undefined (missing)');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const auth = admin.auth();
const firestore = admin.firestore(); // Optional: Export Firestore if you need it

export { auth, firestore };
