import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase/client';

/**
 * Fetches the user's profile document from Firestore using their UID.
 * Returns the profile data object if found, otherwise null.
 */
export async function getUserProfile(uid: string): Promise<any | null> {
  try {
    console.log('[getUserProfile] Fetching Firestore profile document for UID:', uid);
    const profileRef = doc(db, 'users', uid);
    const profileSnap = await getDoc(profileRef);
    console.log('[getUserProfile] profileSnap.exists():', profileSnap.exists());
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      console.log('[getUserProfile] Profile data found:', data);
 return data;
    } else {
      console.log('[getUserProfile] No profile document found for UID:', uid);
    }
    return null;
  } catch (err) {
    console.error('[getProfileName] Error fetching profile:', err);
    return null;
  }
}
