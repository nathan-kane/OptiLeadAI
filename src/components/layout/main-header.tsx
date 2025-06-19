"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, UserCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { navItems } from '@/config/nav';
import Link from 'next/link';

export function MainHeader() {
  const pathname = usePathname();
  const currentNavItem = navItems.find(item => item.href === pathname || (item.href !== '/' && pathname.startsWith(item.href)));
  const pageTitle = currentNavItem?.label || "Dashboard";

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
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="rounded-full">
            <UserCircle className="h-6 w-6" />
            <span className="sr-only">User Profile</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
