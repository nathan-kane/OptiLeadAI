
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { navItems } from '@/config/nav';
import { UserMenu } from '@/components/layout/user-menu';

export function MainHeader() {
  const pathname = usePathname();
  
  // Helper function to find nav item in nested structure
  const findNavItem = (items: any[]): any => {
    for (const item of items) {
      if (item.href === pathname || (item.href && item.href !== '/' && pathname.startsWith(item.href))) {
        return item;
      }
      if (item.children) {
        const found = findNavItem(item.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  const currentNavItem = findNavItem(navItems);
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
        <UserMenu />
      </div>
    </header>
  );
}
