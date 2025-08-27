"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';

type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | null;
type PlanType = 'basic' | 'gold' | null;

interface AuthContextType {
  user: User | null;
  userId: string | null;
  loading: boolean;
  setUserId: (userId: string | null) => void;
  // Subscription fields
  subscriptionStatus: SubscriptionStatus;
  planType: PlanType;
  hasActiveSubscription: boolean;
  subscriptionLoading: boolean;
  subscriptionError: string | null;
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
  
  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(null);
  const [planType, setPlanType] = useState<PlanType>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  
  // Computed subscription status
  const hasActiveSubscription = subscriptionStatus === 'active';

  // Initialize inactivity timer - only active when user is logged in
  useInactivityTimer({
    timeout: 2 * 60 * 60 * 1000, // 2 hours
    enabled: !!userId, // Only enable when user is logged in
    onTimeout: () => {
      console.log('User session expired due to inactivity');
    }
  });

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

  // Listen to subscription status changes
  useEffect(() => {
    if (!userId) {
      // Clear subscription data when no user
      setSubscriptionStatus(null);
      setPlanType(null);
      setSubscriptionError(null);
      return;
    }

    setSubscriptionLoading(true);
    setSubscriptionError(null);

    // Listen to user's subscription document
    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const subscription = userData.subscription;
          
          if (subscription) {
            setSubscriptionStatus(subscription.status || null);
            setPlanType(subscription.planType || null);
          } else {
            setSubscriptionStatus(null);
            setPlanType(null);
          }
        } else {
          setSubscriptionStatus(null);
          setPlanType(null);
        }
        setSubscriptionLoading(false);
      },
      (error) => {
        console.error('Error listening to subscription status:', error);
        setSubscriptionError('Failed to load subscription status');
        setSubscriptionLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Function to manually set userId (useful for immediate updates)
  const setUserId = (newUserId: string | null) => {
    setUserIdState(newUserId);
    if (newUserId) {
      localStorage.setItem('optilead_userId', newUserId);
    } else {
      localStorage.removeItem('optilead_userId');
      // Clear subscription data when userId is cleared
      setSubscriptionStatus(null);
      setPlanType(null);
      setSubscriptionError(null);
    }
  };

  const value: AuthContextType = {
    user,
    userId,
    loading,
    setUserId,
    // Subscription fields
    subscriptionStatus,
    planType,
    hasActiveSubscription,
    subscriptionLoading,
    subscriptionError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
