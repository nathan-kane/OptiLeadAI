import { NextRequest } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export interface SubscriptionCheckResult {
  success: boolean;
  userId?: string;
  subscriptionStatus?: string;
  planType?: string;
  error?: string;
  statusCode?: number;
}

export async function verifySubscription(request: NextRequest): Promise<SubscriptionCheckResult> {
  try {
    // Get user ID from headers (set by auth middleware or client)
    const userId = request.headers.get('X-User-ID') || request.headers.get('x-user-id');

    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
        statusCode: 401
      };
    }

    // Check user's subscription status in Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return {
        success: false,
        error: 'User not found',
        statusCode: 404
      };
    }

    const userData = userDoc.data();
    const subscription = userData.subscription;

    // Check if user has active subscription
    if (!subscription || subscription.status !== 'active') {
      const statusMessage = getSubscriptionErrorMessage(subscription?.status);
      
      return {
        success: false,
        userId,
        subscriptionStatus: subscription?.status || null,
        planType: subscription?.planType || null,
        error: statusMessage,
        statusCode: 402 // Payment Required
      };
    }

    // User has active subscription
    return {
      success: true,
      userId,
      subscriptionStatus: subscription.status,
      planType: subscription.planType
    };

  } catch (error) {
    console.error('Subscription verification error:', error);
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500
    };
  }
}

export function createSubscriptionErrorResponse(result: SubscriptionCheckResult) {
  return new Response(
    JSON.stringify({
      error: 'Subscription required',
      message: result.error,
      subscriptionStatus: result.subscriptionStatus || null,
      redirectTo: '/billing-required'
    }),
    {
      status: result.statusCode || 402,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

function getSubscriptionErrorMessage(status: string | null): string {
  switch (status) {
    case 'past_due':
      return 'Your payment is past due. Please update your payment method to continue using OptiLeadAI features.';
    case 'canceled':
      return 'Your subscription has been canceled. Please reactivate your plan to access OptiLeadAI features.';
    case 'unpaid':
      return 'Your subscription payment failed. Please update your payment method to restore access.';
    case 'incomplete':
      return 'Your subscription setup is incomplete. Please complete the payment process.';
    default:
      return 'You need an active subscription to access OptiLeadAI features. Please choose a plan to continue.';
  }
}

// Helper function to check if a plan has access to specific features
export function hasFeatureAccess(planType: string | null, feature: string): boolean {
  if (!planType || planType === 'none') return false;
  
  const basicFeatures = [
    'ai_cold_calling',
    'lead_scoring',
    'lead_data_tracking',
    'email_campaigns'
  ];
  
  const goldFeatures = [
    ...basicFeatures,
    'ai_agent_script_enhancements',
    'rag_knowledge_base',
    'followup_call_recording',
    'call_transcript_analysis'
  ];
  
  if (planType === 'basic') {
    return basicFeatures.includes(feature);
  }
  
  if (planType === 'gold') {
    return goldFeatures.includes(feature);
  }
  
  return false;
}
