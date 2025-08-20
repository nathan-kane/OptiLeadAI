import { db } from '@/lib/firebase/client';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

/**
 * Utility function to migrate client data from one user to another
 * This helps when client data exists under a different user ID than the current authenticated user
 */
export async function migrateClientData(fromUserId: string, toUserId: string) {
  try {
    console.log(`Starting migration from ${fromUserId} to ${toUserId}`);
    
    // Get all clients from the source user
    const sourceClientsRef = collection(db, "users", fromUserId, "clients");
    const sourceSnapshot = await getDocs(sourceClientsRef);
    
    if (sourceSnapshot.empty) {
      console.log(`No clients found for user ${fromUserId}`);
      return { success: true, migratedCount: 0 };
    }
    
    let migratedCount = 0;
    
    // Copy each client to the target user
    for (const clientDoc of sourceSnapshot.docs) {
      const clientData = clientDoc.data();
      const clientId = clientDoc.id;
      
      // Create the client under the new user
      const targetClientRef = doc(db, "users", toUserId, "clients", clientId);
      await setDoc(targetClientRef, clientData);
      
      console.log(`Migrated client ${clientId}: ${clientData.name}`);
      migratedCount++;
    }
    
    console.log(`Migration completed. ${migratedCount} clients migrated.`);
    
    return { 
      success: true, 
      migratedCount,
      message: `Successfully migrated ${migratedCount} clients from ${fromUserId} to ${toUserId}`
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      migratedCount: 0
    };
  }
}

/**
 * Function to check if a user has client data
 */
export async function checkUserHasClients(userId: string): Promise<{ hasClients: boolean; clientCount: number }> {
  try {
    const clientsRef = collection(db, "users", userId, "clients");
    const snapshot = await getDocs(clientsRef);
    
    return {
      hasClients: !snapshot.empty,
      clientCount: snapshot.size
    };
  } catch (error) {
    console.error('Error checking user clients:', error);
    return { hasClients: false, clientCount: 0 };
  }
}
