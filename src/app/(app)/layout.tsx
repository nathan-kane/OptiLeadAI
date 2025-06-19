
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
  const [isAppLoading, setIsAppLoading] = useState(true); // Renamed from isLoading

  useEffect(() => {
    console.log("AppLayout: Mount & Auth Check Effect Running. Initial isAppLoading:", isAppLoading);
    if (!auth) {
      console.error("AppLayout: Auth object is NOT AVAILABLE for onAuthStateChanged setup! Firebase might not have initialized correctly.");
      setIsAppLoading(false);
      console.log("AppLayout: Auth init error, setting isAppLoading to false.");
      // Consider redirecting to an error page or login if auth fundamentally fails
      router.replace('/login'); // Fallback redirect
      console.log("AppLayout: Auth init error - router.replace('/login') CALLED.");
      return;
    }
    console.log("AppLayout: Auth object IS available for onAuthStateChanged setup.");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Note: isAppLoading inside this callback might be stale if it's not in deps,
      // but decisions should be based on 'user' object.
      console.log("AppLayout: onAuthStateChanged FIRED. User object:", user ? user.uid : null);
      if (user) {
        console.log("AppLayout: User IS authenticated (uid:", user.uid, "). Allowing app content.");
        setIsAppLoading(false);
        console.log("AppLayout: User found, setting isAppLoading to false.");
      } else {
        console.log("AppLayout: User is NOT authenticated. Attempting redirect to /login.");
        router.replace('/login');
        console.log("AppLayout: router.replace('/login') CALLED.");
        // If redirecting, isAppLoading might ideally be true until LoginPage takes over,
        // or set to false here if LoginPage isn't expected to show its own loader.
        // For now, let LoginPage handle its own loading state.
      }
    });

    return () => {
      console.log("AppLayout: Unmount & Auth Check Effect Cleanup.");
      unsubscribe();
    };
  }, [router]); // Dependency array changed

  if (isAppLoading) {
    console.log("AppLayout: isAppLoading is TRUE. Rendering loading spinner.");
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Logo />
            <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  console.log("AppLayout: isAppLoading is FALSE. Rendering app shell.");
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
