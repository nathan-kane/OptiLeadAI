"use client";

import { useEffect, useRef, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useRouter } from 'next/navigation';

interface UseInactivityTimerOptions {
  timeout?: number; // in milliseconds
  onTimeout?: () => void;
  enabled?: boolean;
}

export const useInactivityTimer = ({
  timeout = 2 * 60 * 60 * 1000, // 2 hours default
  onTimeout,
  enabled = true
}: UseInactivityTimerOptions = {}) => {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      // Clear local storage
      localStorage.removeItem('optilead_userId');
      localStorage.removeItem('optilead_userEmail');
      
      // Call custom timeout handler if provided
      if (onTimeout) {
        onTimeout();
      }
      
      // Redirect to login page
      router.replace('/login');
      console.log('User logged out due to inactivity');
    } catch (error) {
      console.error('Error during automatic logout:', error);
    }
  }, [onTimeout, router]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity time
    lastActivityRef.current = Date.now();

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  }, [enabled, timeout, handleLogout]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled) {
      // Clear timer if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, handleActivity, resetTimer]);

  // Return function to manually reset timer (useful for API calls, etc.)
  return {
    resetTimer,
    getLastActivity: () => lastActivityRef.current,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeout - elapsed);
    }
  };
};
