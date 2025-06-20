
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
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
  const pathname = usePathname(); // Get current pathname
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    console.log(`AppLayout: Mount & Auth Check Effect Running for path: ${pathname}. Initial isAppLoading: ${isAppLoading}`);
    if (!auth) {
      console.error("AppLayout: Auth object is NOT AVAILABLE for onAuthStateChanged setup! Firebase might not have initialized correctly.");
      setIsAppLoading(false);
      console.log("AppLayout: Auth init error, setting isAppLoading to false.");
      router.replace('/login'); 
      console.log("AppLayout: Auth init error - router.replace('/login') CALLED.");
      return;
    }
    console.log("AppLayout: Auth object IS available for onAuthStateChanged setup.");

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(`AppLayout: onAuthStateChanged FIRED for path: ${pathname}. User object: ${user ? user.uid : null}. Current isAppLoading: ${isAppLoading}`);
      if (user) {
        console.log(`AppLayout: User IS authenticated (uid: ${user.uid}). Path: ${pathname}. Allowing app content.`);
        setIsAppLoading(false);
        console.log("AppLayout: User found, setting isAppLoading to false.");
      } else {
        console.log(`AppLayout: User is NOT authenticated for path: ${pathname}. Attempting redirect to /login.`);
        setIsAppLoading(false); // Stop loading as we are redirecting
        router.replace('/login');
        console.log("AppLayout: router.replace('/login') CALLED because no user.");
      }
    });

    return () => {
      console.log("AppLayout: Unmount & Auth Check Effect Cleanup.");
      unsubscribe();
    };
  }, [router, pathname]); // Added pathname to dependency array

  if (isAppLoading) {
    console.log(`AppLayout: isAppLoading is TRUE for path: ${pathname}. Rendering loading spinner.`);
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Logo />
            <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  console.log(`AppLayout: isAppLoading is FALSE for path: ${pathname}. Rendering app shell.`);
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <SidebarNav />
        <div className="relative flex flex-1 flex-col overflow-x-hidden">
          <MainHeader />
          <main className="flex-1 p-6 md:p-8 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
