
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/utils';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { MainHeader } from '@/components/layout/main-header';
import { Logo } from '@/components/icons/logo';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true); // Start true to show loader until auth is checked

  useEffect(() => {
    console.log("AppLayout: Mount & Auth Check Effect Running. Current isLoading:", isLoading);
    if (!auth) {
      console.error("AppLayout: Auth object is NOT AVAILABLE for onAuthStateChanged setup! Firebase might not have initialized correctly.");
      // This is a critical failure.
      // We should stop loading and potentially show an error or redirect to a general error page.
      // For now, to prevent loops, let's just stop loading. Content might be an error or blank.
      setIsLoading(false);
      console.log("AppLayout: Auth init error, setting isLoading to false.");
      return;
    }
    console.log("AppLayout: Auth object IS available for onAuthStateChanged setup.");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AppLayout: onAuthStateChanged FIRED. User object:", user ? user.uid : null);
      if (user) {
        console.log("AppLayout: User IS authenticated (uid:", user.uid, "). Allowing app content.");
        setIsLoading(false); // User is authenticated, stop loading, show app content
        console.log("AppLayout: User found, setting isLoading to false.");
      } else {
        console.log("AppLayout: User is NOT authenticated. Attempting redirect to /login.");
        // This layout protects /app routes. If no user, redirect to /login.
        // The isLoading state for AppLayout becomes less relevant here if we are navigating away.
        // The Login page will handle its own loading state (isAuthCheckLoading).
        router.replace('/login');
        console.log("AppLayout: router.replace('/login') CALLED.");
      }
    });

    return () => {
      console.log("AppLayout: Unmount & Auth Check Effect Cleanup.");
      unsubscribe();
    };
  }, [router]); // router is stable, effect runs once on mount

  if (isLoading) {
    console.log("AppLayout: isLoading is TRUE. Rendering loading spinner.");
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Logo />
            <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  console.log("AppLayout: isLoading is FALSE. Rendering app shell.");
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <SidebarNav />
        <div className="flex flex-1 flex-col">
          <MainHeader />
          <main className="flex-1 p-6 md:p-8 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
