import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
    let customerId = userData.stripeCustomerId;

    // If no customer ID but we have a session ID, try to get customer from session
    if (!customerId && userData.subscription?.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(userData.subscription.stripeSessionId);
        customerId = session.customer as string;
        
        // Update user document with customer ID for future use
        if (customerId) {
          await updateDoc(userDocRef, {
            stripeCustomerId: customerId
          });
        }
      } catch (error) {
        console.error('Error retrieving session:', error);
      }
    }

    // If still no customer ID, create a new Stripe customer
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: userData.email || undefined,
          metadata: {
            userId: userId,
            firebaseUid: userId
          },
          name: userData.name || undefined,
        });
        
        customerId = customer.id;
        
        // Save the new customer ID to Firestore
        await updateDoc(userDocRef, {
          stripeCustomerId: customerId
        });
        
        console.log(`Created new Stripe customer ${customerId} for user ${userId}`);
      } catch (error) {
        console.error('Error creating Stripe customer:', error);
        return NextResponse.json(
          { error: 'Unable to create billing account. Please try again or contact support.' },
          { status: 500 }
        );
      }
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
