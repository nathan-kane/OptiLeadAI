
"use client";

import Link from 'next/link';
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

export function SidebarNav() {
  const pathname = usePathname();

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
         <div className="flex items-center gap-3 p-2 group-data-[state=collapsed]:justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="hidden group-data-[state=expanded]:block">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john.doe@example.com</p>
            </div>
          </div>
          <Link href="/login">
  <Button variant="ghost" className="w-full justify-start hidden group-data-[state=expanded]:flex">
    <LogOut className="mr-2 h-4 w-4" />
    Logout
  </Button>
</Link>
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
