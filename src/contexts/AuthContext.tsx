"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  loading: boolean;
  setUserId: (userId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load userId from localStorage on mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('optilead_userId');
    if (storedUserId) {
      setUserIdState(storedUserId);
    }
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // User is signed in, store the userId
        const uid = firebaseUser.uid;
        setUserIdState(uid);
        localStorage.setItem('optilead_userId', uid);
        console.log('AuthContext: User signed in, userId stored:', uid);
      } else {
        // User is signed out, clear the userId
        setUserIdState(null);
        localStorage.removeItem('optilead_userId');
        console.log('AuthContext: User signed out, userId cleared');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Function to manually set userId (useful for immediate updates)
  const setUserId = (newUserId: string | null) => {
    setUserIdState(newUserId);
    if (newUserId) {
      localStorage.setItem('optilead_userId', newUserId);
    } else {
      localStorage.removeItem('optilead_userId');
    }
  };

  const value: AuthContextType = {
    user,
    userId,
    loading,
    setUserId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
