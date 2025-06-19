
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For form submission
  const [isAuthCheckLoading, setIsAuthCheckLoading] = useState(true); // For initial auth check

  useEffect(() => {
    console.log("LoginPage: Mount & Initial Auth Check Effect Running. Current isAuthCheckLoading:", isAuthCheckLoading);
    if (!auth) {
      console.error("LoginPage: Auth object is NOT AVAILABLE for onAuthStateChanged setup! Firebase might not have initialized correctly.");
      setErrorMessage("Authentication service failed to load. Check Firebase configuration and initialization.");
      setIsAuthCheckLoading(false); // Stop loading on critical auth init error
      console.log("LoginPage: Auth init error, setting isAuthCheckLoading to false.");
      return;
    }
    console.log("LoginPage: Auth object IS available for onAuthStateChanged setup.");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("LoginPage: onAuthStateChanged FIRED. User object:", user ? user.uid : null);
      if (user) {
        console.log("LoginPage: User IS authenticated (uid:", user.uid, "), attempting redirect to /.");
        router.replace('/');
        console.log("LoginPage: router.replace('/') CALLED. isAuthCheckLoading state will remain true as component might unmount.");
        // No need to set isAuthCheckLoading to false here, as we are navigating away.
      } else {
        console.log("LoginPage: User is NOT authenticated. Allowing login form.");
        setIsAuthCheckLoading(false);
        console.log("LoginPage: set isAuthCheckLoading to false.");
      }
    });

    return () => {
      console.log("LoginPage: Unmount & Initial Auth Check Effect Cleanup.");
      unsubscribe();
    };
  }, [router]); // router is stable, effect runs once on mount

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Crucial: Prevent default form submission
    console.log("LoginPage: handleLogin CALLED. Email:", email, "Password entered (length):", password.length);
    setErrorMessage(null);
    setIsLoading(true);
    console.log("LoginPage: setIsLoading to true.");

    console.log("LoginPage: NEXT_PUBLIC_FIREBASE_API_KEY present in handleLogin:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    console.log("LoginPage: Auth object in handleLogin:", auth);

    if (!auth) {
      console.error("LoginPage: Firebase auth object is not available in handleLogin. Initialization might have failed.");
      setErrorMessage("Login service is temporarily unavailable. Please try again later.");
      setIsLoading(false);
      console.log("LoginPage: Auth object missing in handleLogin, setIsLoading to false.");
      return;
    }

    try {
      console.log("LoginPage: Attempting Firebase signInWithEmailAndPassword...");
      await signInWithEmailAndPassword(auth, email, password);
      // If signInWithEmailAndPassword is successful, the onAuthStateChanged listener
      // in the useEffect hook will detect the new user state and trigger router.replace('/').
      // No direct navigation call here.
      console.log("LoginPage: Firebase signInWithEmailAndPassword call completed. Waiting for onAuthStateChanged to handle redirect.");
    } catch (error: any) {
      let friendlyMessage = "Failed to log in. Please check your credentials.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            friendlyMessage = "Invalid email or password. Please try again.";
            break;
          case 'auth/invalid-email':
            friendlyMessage = "The email address is not valid.";
            break;
          case 'auth/user-disabled':
            friendlyMessage = "This account has been disabled.";
            break;
          case 'auth/network-request-failed':
            friendlyMessage = "Network error. Please check your connection and try again.";
            break;
          default:
            friendlyMessage = `Login failed (Code: ${error.code}): ${error.message || 'An unexpected error occurred.'}`;
        }
      }
      console.error("LoginPage: Full login error object:", error);
      console.error("LoginPage: Login error code:", error.code, "Message:", error.message);
      setErrorMessage(friendlyMessage);
    } finally {
      setIsLoading(false);
      console.log("LoginPage: setIsLoading to false in finally block.");
      console.log("LoginPage: handleLogin finished.");
    }
  };

  if (isAuthCheckLoading && !errorMessage) {
    console.log("LoginPage: Rendering loading spinner because isAuthCheckLoading is true AND no errorMessage.");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }
  console.log("LoginPage: Rendering login form. isAuthCheckLoading:", isAuthCheckLoading, "errorMessage:", errorMessage);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your LeadSpring AI dashboard.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline text-muted-foreground">
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
            </div>
            {errorMessage && (
              <div className="text-red-600 text-center text-sm p-2 bg-red-100 border border-red-300 rounded-md" role="alert">
                {errorMessage}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || (isAuthCheckLoading && !errorMessage) }>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="underline text-primary">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
