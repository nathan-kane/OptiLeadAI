
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

export async function saveProfile(profileData: ProfileData) {
  try {
    console.log("Attempting to save profile data for email:", profileData.email);
    // Use email as document ID
    const userDocRef = doc(db, "users", profileData.email as string);
    console.log(`Attempting to save profile data to Firestore document: users/${profileData.email}`);
    await setDoc(userDocRef, profileData, { merge: true });
    console.log(`Profile data successfully saved for user with email: ${profileData.email}`);
  } catch (error: any) {
    console.error("Error saving profile data:", error);
    if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes("permission"))) {
      console.error(
        "Firestore permission error: Please check your Firestore security rules in the Firebase Console. " +
        "Ensure that authenticated users have write access to their own document in the 'users' collection."
      );
    }
    // Re-throw the error so the client-side can handle it (e.g., display an error toast)
    throw new Error(`Failed to save profile data: ${error.message}`);
  }
}
