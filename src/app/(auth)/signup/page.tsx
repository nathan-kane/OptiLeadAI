
"use client";

import React from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";;
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/icons/logo";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client"; // Assuming auth is exported from utils.ts
import Link from "next/link";
import { useRouter } from 'next/navigation';

import { sendEmailVerification } from "firebase/auth";

export default function SignupPage() {
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
           <div className="mx-auto mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join OptiLead and start supercharging your lead generation.</CardDescription>
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

            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              // Send email verification with continue URL pointing to /verify-email
              // Ensure your domain here is correct for your environment
              const continueUrl = `${window.location.origin}/verify-email`;
              await sendEmailVerification(userCredential.user, { url: continueUrl, handleCodeInApp: false });
              setSuccessMessage('Registration successful! Please check your email for a verification link.');
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
             <Button type="submit" className="w-full">
              Sign Up
             </Button>
           </CardFooter>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-0">
          <Button className="w-full" variant="outline" asChild>
            <Link href="/">Skip for now</Link>
          </Button>
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
