
"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons/logo';
import { navItems, type NavItem } from '@/config/nav';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client'; // Assuming you have a client-side auth instance
import { getUserProfile } from '@/lib/get-profile-name'; // Assuming getUserProfile is in this file
import { ProfileData } from '@/types'; // Assuming you have a type for ProfileData

export function SidebarNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        console.log('[SidebarNav] Auth state changed. User:', user.uid);
        try {
          // Assuming getUserProfile fetches the full profile including name and email
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error('[SidebarNav] Error fetching user profile:', error);
          setUserProfile(null); // Clear profile on error
        }
      } else {
        console.log('[SidebarNav] No user detected, setting userProfile to null');
        setUserProfile(null); // Clear profile if no user
      }
    });
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount and clean up on unmount

  const groupedNavItems = navItems.reduce((acc, item) => {
    const groupName = item.group || 'General';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 p-2">
          <Logo className="hidden group-data-[state=expanded]:block" />
          <span className="sr-only group-data-[state=collapsed]:not-sr-only">LS</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {Object.entries(groupedNavItems).map(([groupName, items]) => (
            <SidebarGroup key={groupName}>
              {groupName !== 'General' && <SidebarGroupLabel>{groupName}</SidebarGroupLabel>}
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
  <SidebarMenuButton
    isActive={pathname === item.href || (item.href !== '/dashboard' && item.href !== '/' && pathname.startsWith(item.href))}
    tooltip={{ children: item.label }}
    asChild
  >
    <span className="flex items-center">
      <item.icon />
      <span>{item.label}</span>
    </span>
  </SidebarMenuButton>
</Link>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        {currentUser && userProfile ? (
          <div className="flex items-center gap-3 p-2 group-data-[state=collapsed]:justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userProfile.avatarUrl || "https://placehold.co/40x40.png"} alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>{userProfile.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="hidden group-data-[state=expanded]:block">
              {/* Truncate name and email to prevent overflow */}
              {userProfile.name && <p className="text-sm font-medium truncate max-w-[150px]">{userProfile.name}</p>}
              {userProfile.email && <p className="text-xs text-muted-foreground truncate max-w-[150px]">{userProfile.email}</p>}
            </div>
          </div>
        ) : (
          // Placeholder or loading state when user is not logged in or profile is loading
          <div className="flex items-center gap-3 p-2 group-data-[state=collapsed]:justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/40x40.png" alt="Placeholder Avatar" />
              <AvatarFallback>U</AvatarFallback>
            </div>
            <div className="hidden group-data-[state=expanded]:block">
              <p className="text-sm font-medium text-gray-400">Loading...</p>
            </div>
          </div>
        )}
          <Link href="/login">
  <Button variant="ghost" size="icon" className="w-full group-data-[state=expanded]:hidden">
    <LogOut className="h-4 w-4" />
    <span className="sr-only">Logout</span>
  </Button>
</Link>
      </SidebarFooter>
    </Sidebar>
  );
}
