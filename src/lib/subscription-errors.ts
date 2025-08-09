import { toast } from '@/hooks/use-toast';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' | null;

export interface SubscriptionError {
  status: SubscriptionStatus;
  title: string;
  message: string;
  action: string;
  variant: 'default' | 'destructive';
  redirectTo?: string;
}

export function getSubscriptionError(status: SubscriptionStatus): SubscriptionError {
  switch (status) {
    case 'past_due':
      return {
        status,
        title: 'Payment Past Due',
        message: 'Your payment is overdue. Please update your payment method to continue using OptiLeadAI.',
        action: 'Update Payment Method',
        variant: 'destructive',
        redirectTo: '/billing-required?status=past_due'
      };
    case 'canceled':
      return {
        status,
        title: 'Subscription Canceled',
        message: 'Your subscription has been canceled. Reactivate your plan to continue using OptiLeadAI.',
        action: 'Reactivate Subscription',
        variant: 'destructive',
        redirectTo: '/billing-required?status=canceled'
      };
    case 'unpaid':
      return {
        status,
        title: 'Payment Failed',
        message: 'Your subscription payment failed. Please update your payment method to restore access.',
        action: 'Update Payment Method',
        variant: 'destructive',
        redirectTo: '/billing-required?status=unpaid'
      };
    case 'incomplete':
      return {
        status,
        title: 'Setup Incomplete',
        message: 'Your subscription setup is incomplete. Please complete the payment process.',
        action: 'Complete Setup',
        variant: 'default',
        redirectTo: '/billing-required?status=incomplete'
      };
    default:
      return {
        status,
        title: 'Subscription Required',
        message: 'You need an active subscription to access OptiLeadAI features.',
        action: 'Choose a Plan',
        variant: 'default',
        redirectTo: '/#pricing'
      };
  }
}

export function showSubscriptionError(status: SubscriptionStatus) {
  const error = getSubscriptionError(status);
  
  toast({
    title: error.title,
    description: error.message,
    variant: error.variant,
    duration: 8000, // Show for 8 seconds for subscription errors
  });
}

export function handleApiSubscriptionError(error: any) {
  if (error.status === 402) {
    // Payment required error from API
    const subscriptionStatus = error.subscriptionStatus || null;
    showSubscriptionError(subscriptionStatus);
    
    // Redirect to appropriate page
    const subscriptionError = getSubscriptionError(subscriptionStatus);
    if (subscriptionError.redirectTo) {
      window.location.href = subscriptionError.redirectTo;
    }
  } else {
    // Generic error handling
    toast({
      title: 'Error',
      description: error.message || 'An unexpected error occurred. Please try again.',
      variant: 'destructive',
    });
  }
}

// Cache invalidation for subscription status changes
export function clearSubscriptionCache() {
  // Clear any cached subscription data
  localStorage.removeItem('subscription_cache');
  localStorage.removeItem('leads_cache');
  localStorage.removeItem('campaigns_cache');
  
  // Clear any other sensitive cached data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('optilead_') || key.includes('subscription') || key.includes('billing'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
