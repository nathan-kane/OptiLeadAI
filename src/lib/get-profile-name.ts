import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { auth } from './utils';

/**
 * Fetches the user's profile name from Firestore using their UID.
 * Returns the name string if found, otherwise null.
 */
export async function getProfileName(uid: string): Promise<string | null> {
  try {
    console.log('[getProfileName] Fetching Firestore profile for UID:', uid);
    const db = getFirestore();
    const profileRef = doc(db, 'users', uid);
    const profileSnap = await getDoc(profileRef);
    console.log('[getProfileName] profileSnap.exists():', profileSnap.exists());
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      console.log('[getProfileName] profile data:', data);
      if (typeof data.name === 'string' && data.name.trim() !== '') {
        console.log('[getProfileName] Found name:', data.name);
        return data.name;
      } else {
        console.log('[getProfileName] Name field missing or empty.');
      }
    } else {
      console.log('[getProfileName] No profile document found for UID:', uid);
    }
    return null;
  } catch (err) {
    console.error('[getProfileName] Error fetching profile:', err);
    return null;
  }
}

