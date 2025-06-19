
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
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isLoading
  const [isAuthCheckLoading, setIsAuthCheckLoading] = useState(true); 

  useEffect(() => {
    console.log("LoginPage: Mount & Initial Auth Check Effect Running. Current isAuthCheckLoading:", isAuthCheckLoading);
    if (!auth) {
      console.error("LoginPage: Auth object is NOT AVAILABLE for onAuthStateChanged setup! Firebase might not have initialized correctly.");
      setErrorMessage("Authentication service failed to load. Check Firebase configuration and initialization.");
      setIsAuthCheckLoading(false); 
      console.log("LoginPage: Auth init error, setting isAuthCheckLoading to false.");
      return;
    }
    console.log("LoginPage: Auth object IS available for onAuthStateChanged setup.");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("LoginPage: onAuthStateChanged FIRED. User object:", user ? user.uid : null);
      if (user) {
        console.log("LoginPage: onAuthStateChanged detected USER (uid:", user.uid, "), attempting redirect to /.");
        router.replace('/');
        console.log("LoginPage: onAuthStateChanged - router.replace('/') CALLED.");
        // Component might unmount, so setting isAuthCheckLoading to false here might not always run or be relevant.
      } else {
        console.log("LoginPage: onAuthStateChanged detected NO USER. Allowing login form.");
        setIsAuthCheckLoading(false);
        console.log("LoginPage: onAuthStateChanged - set isAuthCheckLoading to false.");
      }
    });

    return () => {
      console.log("LoginPage: Unmount & Initial Auth Check Effect Cleanup.");
      unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    console.log("LoginPage: handleLogin CALLED. Email:", email, "Password entered (length):", password.length);
    setErrorMessage(null);
    setIsSubmitting(true);
    console.log("LoginPage: setIsSubmitting to true.");

    console.log("LoginPage: NEXT_PUBLIC_FIREBASE_API_KEY present in handleLogin:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    console.log("LoginPage: Auth object in handleLogin:", auth);

    if (!auth) {
      console.error("LoginPage: Firebase auth object is not available in handleLogin. Initialization might have failed.");
      setErrorMessage("Login service is temporarily unavailable. Please try again later.");
      setIsSubmitting(false);
      console.log("LoginPage: Auth object missing in handleLogin, setIsSubmitting to false.");
      return;
    }

    try {
      console.log("LoginPage: Attempting Firebase signInWithEmailAndPassword...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("LoginPage: Firebase signInWithEmailAndPassword successful. User:", userCredential.user.uid);
      // Explicitly redirect after successful sign-in
      console.log("LoginPage: handleLogin - Attempting explicit redirect to /");
      router.replace('/');
      console.log("LoginPage: handleLogin - router.replace('/') CALLED.");
      // setIsSubmitting will be set to false in finally, but navigation might occur before that.
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
            friendlyMessage = `Login failed. An unexpected error occurred.`;
        }
      }
      console.error("LoginPage: Full login error object:", error);
      console.error("LoginPage: Login error code:", error.code, "Message:", error.message);
      setErrorMessage(friendlyMessage);
    } finally {
      setIsSubmitting(false);
      console.log("LoginPage: setIsSubmitting to false in finally block.");
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
  console.log("LoginPage: Rendering login form. isAuthCheckLoading:", isAuthCheckLoading, "isSubmitting:", isSubmitting, "errorMessage:", errorMessage);
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
            <Button type="submit" className="w-full" disabled={isSubmitting || isAuthCheckLoading}>
              {isSubmitting ? 'Logging in...' : 'Login'}
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
