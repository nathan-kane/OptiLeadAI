
"use client";

import React from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";;
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/icons/logo";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client"; // Assuming auth is exported from utils.ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { DEFAULT_PROMPT_CONFIG } from "@/config/default-prompt";
import { TERMS_CONFIG } from "@/config/terms-version";
import { PRIVACY_CONFIG } from "@/config/privacy-version";
import Link from "next/link";
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { sendEmailVerification } from "firebase/auth";
import { Badge } from "@/components/ui/badge";

function SignupContent() {
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get plan from URL parameters
  const selectedPlan = searchParams.get('plan');
  const redirectToCheckout = searchParams.get('redirect') === 'checkout';

  const planDetails = {
    basic: { name: 'Basic Plan', price: '$199/month', color: 'bg-blue-500' },
    gold: { name: 'Gold Plan', price: '$1,999/month', color: 'bg-yellow-500' }
  };

  const currentPlan = selectedPlan && planDetails[selectedPlan as keyof typeof planDetails];

  const handleSuccessfulSignup = async (userCredential: any) => {
    if (redirectToCheckout && selectedPlan) {
      // Immediately redirect to Stripe checkout after successful signup
      try {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userCredential.user.uid,
          },
          body: JSON.stringify({
            planType: selectedPlan,
            userId: userCredential.user.uid,
            userEmail: userCredential.user.email,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const { url } = await response.json();
        
        if (url) {
          // Redirect directly to Stripe Checkout
          window.location.href = url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (error) {
        console.error('Checkout error after signup:', error);
        setErrorMessage('Account created successfully, but failed to start checkout. Please try selecting a plan from the dashboard.');
        // Fallback: redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } else {
      // Regular signup flow - show success message
      setSuccessMessage('Registration successful! Please check your email for a verification link.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
           <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>
            {currentPlan ? (
              <div className="space-y-2">
                <div>Join OptiLead and start supercharging your lead generation.</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm">Selected plan:</span>
                  <Badge className={`${currentPlan.color} text-white`}>
                    {currentPlan.name} - {currentPlan.price}
                  </Badge>
                </div>
              </div>
            ) : (
              "Join OptiLead and start supercharging your lead generation."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={async (e) => {

            e.preventDefault();
            setSuccessMessage(null);
            setErrorMessage(null);

            const email = (document.getElementById('email') as HTMLInputElement).value;
            const password = (document.getElementById('password') as HTMLInputElement).value;
            const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement).value;

            if (password !== confirmPassword) {
              setErrorMessage("Passwords do not match.");
              return;
            }

            if (!acceptedTerms) {
              setErrorMessage("You must accept the Terms & Conditions and Privacy Policy to continue.");
              return;
            }

            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              
              // Create user document in Firestore with plan information
              await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: userCredential.user.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                subscription: {
                  status: null,
                  planType: null,
                  selectedPlan: selectedPlan || null // Store the plan they selected during signup
                },
                legal: {
                  termsAccepted: true,
                  termsAcceptedAt: serverTimestamp(),
                  termsVersion: TERMS_CONFIG.version,
                  privacyPolicyAccepted: true,
                  privacyPolicyAcceptedAt: serverTimestamp(),
                  privacyPolicyVersion: PRIVACY_CONFIG.version,
                  ipAddress: null, // Could be populated server-side for audit trail
                  userAgent: navigator.userAgent
                }
              });
              
              // Create default prompt document in Firestore
              await setDoc(doc(db, 'users', userCredential.user.uid, 'prompts', 'default'), {
                title: DEFAULT_PROMPT_CONFIG.title,
                content: DEFAULT_PROMPT_CONFIG.content,
                isDefault: DEFAULT_PROMPT_CONFIG.isDefault,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              
              // Send email verification with continue URL pointing to /verify-email
              // Ensure your domain here is correct for your environment
              const continueUrl = `${window.location.origin}/verify-email`;
              await sendEmailVerification(userCredential.user, { url: continueUrl, handleCodeInApp: false });
              
              // Handle successful signup with plan-aware logic
              await handleSuccessfulSignup(userCredential);
            } catch (error: any) {
              setErrorMessage("Error signing up: " + error.message);
              console.error("Signup error (check Firebase authorized domains):", error.message);
            }
          }}>
          <div className="space-y-2 mb-4">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" placeholder="John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
           <div className="space-y-2">
             <Label htmlFor="password">Password</Label>
             <Input id="password" type="password" required minLength={6}/>
           </div>
           <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" type="password" required minLength={6}/>
          </div>
          
          {/* Terms and Conditions Checkbox */}
          <div className="flex items-start space-x-3 pt-4">
            <Checkbox 
              id="terms" 
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <Label 
                htmlFor="terms"
                className="text-sm font-normal leading-relaxed cursor-pointer"
              >
                By checking this box, I confirm that I have read and agree to the{" "}
                <Link 
                  href="/terms" 
                  target="_blank" 
                  className="text-primary underline hover:no-underline"
                >
                  Terms & Conditions
                </Link>
                {" "}and{" "}
                <Link 
                  href="/privacy" 
                  target="_blank" 
                  className="text-primary underline hover:no-underline"
                >
                  Privacy Policy
                </Link>
                .
              </Label>
            </div>
          </div>
          {successMessage && (
            <div className="text-green-600 text-center mt-4 text-sm">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="text-red-600 text-center mt-4 text-sm">
              {errorMessage}
            </div>
          )}
          <CardFooter className="flex flex-col gap-4 pt-6">
             <Button type="submit" className="w-full" disabled={!acceptedTerms}>
              Sign Up
             </Button>
           </CardFooter>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-0">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline text-primary">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
