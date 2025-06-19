import { db } from "@/lib/firebase/firebase"; // Assuming you have a firebase initialization file at this path
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
    console.log("Attempting to save profile data...");
    // Use email as document ID - ensure email is a valid document ID (no invalid characters)
    const userDocRef = doc(db, "users", profileData.email as string);
    console.log(`Attempting to save profile data to document: users/${profileData.email}`);
    await setDoc(userDocRef, profileData, { merge: true });
    console.log(`Profile data successfully saved for user with email: ${profileData.email}`);
  } catch (error) {
    console.error("Error saving profile data:", error);
    // Re-throw the error so the client-side can handle it (e.g., display an error toast)
    throw new Error(`Failed to save profile data: ${(error as Error).message}`);
  }
}