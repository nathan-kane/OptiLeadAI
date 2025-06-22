"use client";

//import { useEffect, useState, Suspense } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { applyActionCode } from 'firebase/auth';
// import { auth } from "@/lib/firebase/client";
// import { Button } from "@/components/ui/button";


"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode } from 'firebase/auth';
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

const VerifyEmailContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Verifying your email...');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');

    if (!oobCode) {
      setError('Verification code not found. Please ensure you are using the correct link from your email.');
      setMessage('');
      return;
    }

    const handleVerification = async () => {
      try {
        await applyActionCode(auth, oobCode);
        // Backend email is now verified.
        // Check current user state on client.
        if (auth.currentUser) {
          await auth.currentUser.reload(); // Refresh client-side user state

          // Double check if email is now marked as verified on the client
          if (auth.currentUser.emailVerified) {
            setMessage('Email successfully verified! Redirecting to login...');
            setTimeout(() => {
              router.push('/login'); // Always redirect to login
            }, 2500);
          } else {
            // This state can happen if client-side propagation is delayed.
            // The user is verified on backend. Guide to login to refresh session.
            setMessage('Email verification processed. Your email is verified. Redirecting to login...');
            setError('Please log in to continue.');
            setTimeout(() => {
              router.push('/login');
            }, 3000);
          }
      } else {
          // No current user on this client, but email is verified on backend.
          // User needs to log in.
          setMessage('Email successfully verified! Please log in to continue.');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
      }
      } catch (err: any) {
        console.error("Error verifying email:", err);
          let friendlyMessage = `Error verifying email.`;
          if (err.code === 'auth/invalid-action-code') {
            friendlyMessage = 'This verification link is invalid or has expired. It may have already been used. Please try logging in, or sign up again if needed.';
      } else if (err.code === 'auth/user-disabled') {
            friendlyMessage = 'Your account has been disabled. Please contact support.';
        } else if (err.code === 'auth/user-not-found') {
            friendlyMessage = 'No account found for this verification link. Please sign up or ensure you used the correct link.';
        } else {
            friendlyMessage = `An unexpected error occurred: ${err.message}`;
          }
        setError(friendlyMessage);
        setMessage('');
        }
      };

    handleVerification();

  }, [searchParams, router]);


  return (
      <div className="text-center max-w-md p-6 bg-card text-card-foreground rounded-lg shadow-md">
        <h1 className="text-xl font-semibold mb-4">Email Verification</h1>
        {message && <p className="text-sm text-muted-foreground mb-2">{message}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!message && !error && <p className="text-sm text-muted-foreground">Processing...</p>}
         {(message || error) && (
          <Button onClick={() => router.push('/login')} className="mt-4" disabled={message === 'Verifying your email...'}>
            Go to Login
          </Button>
        )}
      </div>
  );
};


const VerifyEmailPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
};
export default VerifyEmailPage;
