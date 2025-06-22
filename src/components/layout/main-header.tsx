
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { navItems } from '@/config/nav';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { getUserProfile } from '@/lib/get-profile-name';

export function MainHeader() {
  const pathname = usePathname();
  const currentNavItem = navItems.find(item => item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href)));
  const pageTitle = currentNavItem?.label || "Dashboard";

  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[MainHeader] Auth state changed. User:', user);
      if (user) {
        // Fetch the name from Firestore profile document
        const profile = await getUserProfile(user.uid);
        console.log('[MainHeader] getUserProfile returned:', profile);
        setUserName(profile?.name || null);
      } else {
        console.log('[MainHeader] No user detected, setting userName to null');
        setUserName(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-xl font-semibold">{pageTitle}</h1>
      <div className="ml-auto flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <div className="flex flex-col items-center">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">User Profile</span>
            </Button>
          </Link>
          {userName && (
            <span className="text-xs text-muted-foreground mt-1 leading-none max-w-[80px] truncate text-center block">
              {userName}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
