import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    console.log('Creating Stripe checkout session...');
    const { planType, userId } = await request.json();

    if (!planType || !userId) {
      console.error('Missing required fields:', { planType, userId });
      return NextResponse.json(
        { error: 'Missing required fields: planType and userId' },
        { status: 400 }
      );
    }

    // Check if Stripe secret key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Stripe configuration error' },
        { status: 500 }
      );
    }

    // Define plan configurations
    const planConfigs = {
      basic: {
        priceId: process.env.STRIPE_BASIC_PRICE_ID,
        amount: 99900, // $999.00 in cents
        name: 'OptiLeadAI Basic Plan',
        description: 'AI cold-calling, lead scoring, lead data tracking, Email campaigns with AI suggested content'
      },
      gold: {
        priceId: process.env.STRIPE_GOLD_PRICE_ID,
        amount: 199900, // $1999.00 in cents
        name: 'OptiLeadAI Gold Plan',
        description: 'Everything in Basic plus AI agent script enhancements, RAG knowledge base, and followup call recording/analysis'
      }
    };

    const planConfig = planConfigs[planType as keyof typeof planConfigs];
    if (!planConfig) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Get the origin for redirect URLs - production ready
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const origin = headersList.get('origin') || `${protocol}://${host}` || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    console.log('Creating checkout session with config:', {
      planType,
      userId,
      planConfig: planConfig.name,
      origin
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: undefined, // Will be filled by Stripe if user is logged in
      client_reference_id: userId,
      metadata: {
        userId: userId,
        planType: planType,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/profile?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/#pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      subscription_data: {
        metadata: {
          userId: userId,
          planType: planType,
        },
      },
    });

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url,
      success_url: session.success_url,
      cancel_url: session.cancel_url
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
