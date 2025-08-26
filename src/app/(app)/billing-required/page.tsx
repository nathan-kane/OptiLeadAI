"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertTriangle, Clock, XCircle, Info } from 'lucide-react';
import { SubscriptionStatus } from '@/components/subscription/SubscriptionStatus';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';

export default function BillingRequiredPage() {
  const { subscriptionStatus, planType, user, loading, subscriptionLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get('status') || subscriptionStatus;

  // Show loading while auth is initializing
  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string | null) => {
    switch (status) {
      case 'past_due':
        return {
          icon: Clock,
          title: 'Payment Past Due',
          description: 'Your payment is overdue. Please update your payment method to continue using OptiLeadAI.',
          variant: 'destructive' as const,
          action: 'Update Payment Method',
          urgent: true
        };
      case 'canceled':
        return {
          icon: XCircle,
          title: 'Subscription Canceled',
          description: 'Your subscription has been canceled. Reactivate your plan to continue using OptiLeadAI.',
          variant: 'destructive' as const,
          action: 'Reactivate Subscription',
          urgent: false
        };
      case 'unpaid':
        return {
          icon: AlertTriangle,
          title: 'Payment Required',
          description: 'Your subscription payment failed. Please update your payment method to restore access.',
          variant: 'destructive' as const,
          action: 'Update Payment Method',
          urgent: true
        };
      case 'incomplete':
        return {
          icon: Info,
          title: 'Setup Incomplete',
          description: 'Your subscription setup is incomplete. Please complete the payment process.',
          variant: 'default' as const,
          action: 'Complete Setup',
          urgent: true
        };
      default:
        return {
          icon: CreditCard,
          title: 'Subscription Required',
          description: 'You need an active subscription to access OptiLeadAI features.',
          variant: 'default' as const,
          action: 'Choose a Plan',
          urgent: false
        };
    }
  };

  const statusInfo = getStatusInfo(status);
  const StatusIcon = statusInfo.icon;

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.uid || '',
        },
        body: JSON.stringify({ userId: user?.uid }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const errorData = await response.json();
        console.error('Failed to create portal session:', errorData);
        // Show error message and fallback options
        alert('Unable to access billing portal. Please choose a new plan or contact support.');
        router.push('/#pricing');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      // Fallback to pricing page
      router.push('/#pricing');
    }
  };

  // If user has active subscription, show billing management page
  if (subscriptionStatus === 'active') {
    return (
      <>
        <PageHeader
          title="Billing & Subscription"
          description="Manage your subscription, billing details, and payment methods."
        />
        
        {/* Subscription Status Card */}
        <div className="mb-6">
          <SubscriptionStatus showDetails={true} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
              <CardDescription>
                Update your plan, payment methods, and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleManageBilling}
                className="w-full"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Billing
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Contact our support team for billing assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // If user doesn't have active subscription, show the billing required page
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <StatusIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {statusInfo.title}
          </h1>
          <p className="text-gray-600">
            {statusInfo.description}
          </p>
        </div>

        {statusInfo.urgent && (
          <Alert variant={statusInfo.variant}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Immediate action required to restore access to your account.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Status</CardTitle>
            <CardDescription>
              {planType ? `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan` : 'No active plan'}
              {status && ` • ${status.replace('_', ' ').toUpperCase()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show manage billing button for users with existing plans/subscriptions */}
            {(status === 'past_due' || status === 'unpaid' || planType) && (
              <>
                <Button 
                  onClick={handleManageBilling}
                  className="w-full mb-2"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {statusInfo.action}
                </Button>
                <Button asChild variant="outline" className="w-full" size="lg">
                  <Link href="/#pricing">
                    Choose New Plan
                  </Link>
                </Button>
              </>
            )}
            
            {/* Show choose plan button for users with no plan or subscription */}
            {(!planType && !status) || status === null && (
              <Button asChild className="w-full" size="lg">
                <Link href="/#pricing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {statusInfo.action}
                </Link>
              </Button>
            )}

            {/* Show choose plan button for users with incomplete status */}
            {status === 'incomplete' && (
              <>
                <Button asChild className="w-full mb-2" size="lg">
                  <Link href="/#pricing">
                    <CreditCard className="w-4 h-4 mr-2" />
                    {statusInfo.action}
                  </Link>
                </Button>
                <Button 
                  onClick={handleManageBilling}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Access Billing Portal
                </Button>
              </>
            )}

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Need help with your billing?
              </p>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard')}
            className="text-sm"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
