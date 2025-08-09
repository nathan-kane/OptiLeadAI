"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function SubscriptionStatus({ showDetails = false, className = "" }: SubscriptionStatusProps) {
  const { subscriptionStatus, planType, hasActiveSubscription, subscriptionLoading, subscriptionError } = useAuth();

  if (subscriptionLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <Badge variant="destructive" className={className}>
        Error loading status
      </Badge>
    );
  }

  const getStatusDisplay = () => {
    switch (subscriptionStatus) {
      case 'active':
        return {
          badge: <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>,
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'past_due':
        return {
          badge: <Badge variant="destructive"><Clock className="w-3 h-3 mr-1" />Past Due</Badge>,
          icon: Clock,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'canceled':
        return {
          badge: <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Canceled</Badge>,
          icon: XCircle,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
      case 'unpaid':
        return {
          badge: <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Unpaid</Badge>,
          icon: AlertTriangle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'incomplete':
        return {
          badge: <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Incomplete</Badge>,
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          badge: <Badge variant="outline">No Subscription</Badge>,
          icon: CreditCard,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  if (!showDetails) {
    return <div className={className}>{statusDisplay.badge}</div>;
  }

  return (
    <Card className={`${className} ${statusDisplay.borderColor}`}>
      <CardHeader className={`${statusDisplay.bgColor} rounded-t-lg`}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
          Subscription Status
        </CardTitle>
        <CardDescription>
          {planType ? `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan` : 'No active plan'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            {statusDisplay.badge}
          </div>
          
          {planType && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plan:</span>
              <Badge variant="outline">
                {planType.charAt(0).toUpperCase() + planType.slice(1)}
              </Badge>
            </div>
          )}

          {!hasActiveSubscription && (
            <Alert variant={subscriptionStatus === 'past_due' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {subscriptionStatus === 'past_due' 
                  ? 'Your payment is overdue. Please update your payment method.'
                  : subscriptionStatus === 'canceled'
                  ? 'Your subscription has been canceled.'
                  : subscriptionStatus === 'unpaid'
                  ? 'Payment failed. Please update your payment method.'
                  : 'You need an active subscription to access all features.'
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            {!hasActiveSubscription && !planType && (
              <Button asChild size="sm" className="flex-1">
                <Link href="/#pricing">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Choose Plan
                </Link>
              </Button>
            )}
            
            {(subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid' || planType) && (
              <Button asChild size="sm" variant="outline" className="flex-1">
                <Link href="/billing-required">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
