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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("LoginPage: onAuthStateChanged - User is signed in, redirecting to /");
        router.replace('/'); // Use replace to avoid login page in history if already logged in
      } else {
        console.log("LoginPage: onAuthStateChanged - User is not signed in.");
        setIsAuthCheckLoading(false); // Allow rendering login form
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Login attempt initiated for:", email);
    setErrorMessage(null);
    setIsLoading(true);

    if (!auth) {
      console.error("Firebase auth object is not available. Initialization might have failed.");
      setErrorMessage("Login service is temporarily unavailable. Please try again later.");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting Firebase sign-in...");
      // signInWithEmailAndPassword will trigger onAuthStateChanged if successful
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase sign-in attempt successful (onAuthStateChanged will handle redirect).");
      // No direct router.push here, onAuthStateChanged will handle it.
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
            friendlyMessage = `Login failed: ${error.message || 'An unexpected error occurred.'}`;
        }
      }
      console.error("Login error code:", error.code, "Message:", error.message);
      setErrorMessage(friendlyMessage);
    } finally {
      setIsLoading(false);
      console.log("Login attempt finished.");
    }
  };

  if (isAuthCheckLoading) {
     return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
            <Logo />
            <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }

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
            <Button type="submit" className="w-full" disabled={isLoading || isAuthCheckLoading}>
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
