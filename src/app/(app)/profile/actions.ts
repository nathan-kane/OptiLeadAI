
"use server";

// We get the initialized admin app instance, which handles auth and firestore.
import { getAdminApp } from "@/lib/firebase/admin"; 

interface ProfileData {
  name: string;
  email: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
}


// Accept idToken instead of userId to securely verify the user on the server.
export async function saveProfile(idToken: string, profileData: ProfileData) {
  console.log('[Action: saveProfile] Received idToken to verify user.');

  // Get the initialized admin app. This will throw a clear error if env vars are missing.
  const adminApp = getAdminApp();
  const adminAuth = adminApp.auth();
  const firestore = adminApp.firestore();

  let decodedToken;
  try {
    // Verify the ID token using the Firebase Admin SDK.
    decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log(`[Action: saveProfile] ID token verified. UID: ${decodedToken.uid}`);
  } catch (error: any) {
    console.error("[Action: saveProfile] Error verifying ID token:", error);
    // Throw a specific error if token verification fails.
    throw new Error(`Authentication failed: Could not verify user identity. ${error.message}`);
  }

  const userId = decodedToken.uid; // Use the UID from the verified token.

  const userDocRef = firestore.collection("users").doc(userId);
  console.log(`[Action: saveProfile] Attempting to write to Firestore path: ${userDocRef.path}`);
  console.log(`[Action: saveProfile] Data to be saved: ${JSON.stringify(profileData)}`);


  try {
    await userDocRef.set(profileData, { merge: true });
    console.log(`[Action: saveProfile] Profile data successfully saved for userId: ${userId}`);
    return { success: true, message: "Profile saved successfully!" };
  } catch (error: any) { 
    console.error("[Action: saveProfile] Firestore set error raw:", error);
    console.error(`[Action: saveProfile] Firestore setDoc error message: ${error.message}`);
    console.error(`[Action: saveProfile] Firestore setDoc error code: ${error.code}`);

    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission"))) {
      console.error(
        "Firestore permission error: Please double-check your Firestore security rules and ensure the authenticated user has write access to their own document using their UID."
      );
    }
    // Re-throw the error so the client-side can handle it.
    throw new Error(`Failed to save profile data: ${error.message}`);
  }
}
