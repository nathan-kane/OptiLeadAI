"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresActiveSubscription?: boolean;
  allowedPlans?: ('basic' | 'gold')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiresActiveSubscription = true,
  allowedPlans,
  redirectTo = '/billing-required'
}: ProtectedRouteProps) {
  const { 
    user, 
    userId, 
    loading, 
    subscriptionStatus, 
    planType, 
    hasActiveSubscription,
    subscriptionLoading 
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth and subscription loading to complete
    if (loading || subscriptionLoading) return;

    // Check if user is authenticated
    if (!user || !userId) {
      router.push('/login');
      return;
    }

    // Check subscription requirements
    if (requiresActiveSubscription) {
      if (!hasActiveSubscription) {
        // Handle different subscription statuses
        switch (subscriptionStatus) {
          case 'past_due':
            router.push('/billing-required?status=past_due');
            break;
          case 'canceled':
            router.push('/billing-required?status=canceled');
            break;
          case 'unpaid':
            router.push('/billing-required?status=unpaid');
            break;
          case 'incomplete':
            router.push('/billing-required?status=incomplete');
            break;
          default:
            router.push('/billing-required');
            break;
        }
        return;
      }

      // Check plan-specific access
      if (allowedPlans && planType && !allowedPlans.includes(planType)) {
        router.push('/upgrade-required');
        return;
      }
    }
  }, [
    user, 
    userId, 
    loading, 
    subscriptionStatus, 
    planType, 
    hasActiveSubscription, 
    subscriptionLoading,
    requiresActiveSubscription,
    allowedPlans,
    router
  ]);

  // Show loading spinner while checking auth/subscription
  if (loading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user is not authenticated or doesn't have required subscription
  if (!user || !userId) return null;
  
  if (requiresActiveSubscription && !hasActiveSubscription) return null;
  
  if (allowedPlans && planType && !allowedPlans.includes(planType)) return null;

  return <>{children}</>;
}
