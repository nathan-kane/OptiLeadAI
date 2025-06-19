
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AppLayout: Mount & Auth Check Effect Running.");
    if (!auth) {
      console.error("AppLayout: Auth object is NOT AVAILABLE for onAuthStateChanged setup! Firebase might not have initialized correctly.");
      // Consider redirecting to an error page or showing a global error.
      // For now, this might lead to a loop if router.replace('/login') is called below.
      // To prevent potential loops, we might want to set isLoading to false and show an error UI.
      // However, the primary issue is likely auth initialization.
      return; 
    }
    console.log("AppLayout: Auth object IS available for onAuthStateChanged setup.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AppLayout: onAuthStateChanged FIRED. User object:", user);
      if (user) {
        console.log("AppLayout: User IS authenticated (uid:", user.uid, "). Allowing app content.");
        setIsLoading(false);
      } else {
        console.log("AppLayout: User is NOT authenticated. Attempting redirect to /login.");
        router.replace('/login'); 
        console.log("AppLayout: router.replace('/login') CALLED.");
      }
    });

    return () => {
      console.log("AppLayout: Unmount & Auth Check Effect Cleanup.");
      unsubscribe(); 
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Logo />
            <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
