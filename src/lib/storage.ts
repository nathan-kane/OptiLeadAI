/**
 * Utility functions for managing localStorage operations
 */

const STORAGE_KEYS = {
  USER_ID: 'optilead_userId',
  USER_EMAIL: 'optilead_userEmail',
} as const;

export const storage = {
  // User ID operations
  setUserId: (userId: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Failed to store userId:', error);
    }
  },

  getUserId: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Failed to retrieve userId:', error);
      return null;
    }
  },

  removeUserId: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Failed to remove userId:', error);
    }
  },

  // User email operations (optional, for additional user info)
  setUserEmail: (email: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
    } catch (error) {
      console.error('Failed to store user email:', error);
    }
  },

  getUserEmail: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    } catch (error) {
      console.error('Failed to retrieve user email:', error);
      return null;
    }
  },

  removeUserEmail: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    } catch (error) {
      console.error('Failed to remove user email:', error);
    }
  },

  // Clear all user data
  clearUserData: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  },

  // Check if user data exists
  hasUserData: (): boolean => {
    try {
      return !!localStorage.getItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Failed to check user data:', error);
      return false;
    }
  },
};
