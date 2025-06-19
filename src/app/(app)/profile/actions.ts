
"use server";

import { db } from "@/lib/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

interface ProfileData {
  name: string;
  email: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
}

export async function saveProfile(userId: string, profileData: ProfileData) {
  console.log(`[Action: saveProfile] Received userId: ${userId}`);
  if (!userId) {
    console.error("[Action: saveProfile] Error: User ID is missing or undefined in action call.");
    throw new Error("User ID is required to save profile data.");
  }

  const userDocRef = doc(db, "users", userId);
  console.log(`[Action: saveProfile] Attempting to write to Firestore path: ${userDocRef.path}`);
  console.log(`[Action: saveProfile] Data to be saved: ${JSON.stringify(profileData)}`);


  try {
    await setDoc(userDocRef, profileData, { merge: true });
    console.log(`[Action: saveProfile] Profile data successfully saved for userId: ${userId} to path: ${userDocRef.path}`);
    return { success: true, message: "Profile saved successfully!" };
  } catch (error: any) {
    console.error("[Action: saveProfile] Firestore setDoc error raw:", error);
    console.error(`[Action: saveProfile] Firestore setDoc error message: ${error.message}`);
    console.error(`[Action: saveProfile] Firestore setDoc error code: ${error.code}`);

    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission"))) {
      console.error(
        "[Action: saveProfile] Firestore permission error: Please double-check your Firestore security rules in the Firebase Console. " +
        "Ensure that authenticated users have write access to their own document in the 'users' collection using their UID as the document ID (e.g., match /users/{userId} { allow write: if request.auth.uid == userId; }). " +
        `The current attempt was for path: users/${userId}. Verify project configuration and UID match.`
      );
    }
    // Re-throw the error so the client-side can handle it
    throw new Error(`Failed to save profile data: ${error.message}`);
  }
}

    