import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Get user's Stripe customer ID from Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const customerId = userData.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this user' },
        { status: 400 }
      );
    }

    // Get the origin for redirect URL - production ready
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const origin = headersList.get('origin') || `${protocol}://${host}` || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });

    return NextResponse.json({ 
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe customer portal session creation error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}
