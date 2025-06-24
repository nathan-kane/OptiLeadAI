
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { MainHeader } from '@/components/layout/main-header';
import { Logo } from '@/components/icons/logo';
import { getUserProfile } from '@/lib/get-profile-name';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    console.log(`AppLayout: Mount & Auth Check Effect Running for path: ${pathname}.`);
    if (!auth?.onAuthStateChanged) {
      console.error("AppLayout: Auth object is not available or invalid. Firebase might not have initialized correctly.");
      setIsAppLoading(false);
      router.replace('/login');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(`AppLayout: onAuthStateChanged fired. User: ${user ? user.uid : 'null'}`);
      
      // Allow the verify-email page to render without these checks
      if (pathname === '/verify-email') {
        setIsAppLoading(false);
        return;
      }

      if (user) {
        // If user is authenticated, check for a profile (unless already on the profile page)
        if (pathname !== '/profile') {
          try {
            const profile = await getUserProfile(user.uid);
            if (!profile) {
              console.log('AppLayout: No user profile found, redirecting to /profile to create one.');
              setIsAppLoading(false); // Set loading to false BEFORE redirect
              router.replace('/profile');
              return;
            }
          } catch (err) {
            console.error('AppLayout: Error checking user profile:', err);
            // If profile check fails, still allow app to load to avoid getting stuck.
            // You might want to handle this more gracefully, e.g., show an error toast.
          }
        }
        console.log(`AppLayout: User is authenticated. Allowing app content at ${pathname}.`);
        setIsAppLoading(false);
      } else {
        // If no user, redirect to login
        console.log(`AppLayout: User is not authenticated. Redirecting to /login.`);
        setIsAppLoading(false); // Set loading to false BEFORE redirect
        router.replace('/login');
      }
    });

    return () => {
      console.log("AppLayout: Unmounting and cleaning up auth listener.");
      unsubscribe();
    };
  }, [router, pathname]);

  if (isAppLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Logo />
            <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // If on /verify-email or /profile when loading is done, render only children without the main layout shell
  // to avoid flashing the dashboard UI.
  if (pathname.startsWith('/verify-email')) {
    return <>{children}</>;
  }

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
