
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Target, MailCheck, Workflow, BarChart3, Settings, Users, User, CreditCard } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group?: string;
}

export const navItems: NavItem[] = [
  {
    href: '/dashboard', // Changed from '/'
    label: 'Dashboard',
    icon: LayoutDashboard,
    group: 'Overview',
  },
  {
    href: '/prospecting',
    label: 'Prospecting Campaigns',
    icon: Target,
    group: 'Lead Management',
  },

  // {
  //   href: '/lead-scoring',
  //   label: 'Lead Scoring',
  //   icon: Target,
  //   group: 'Lead Management',
  // },
  // {
  //   href: '/email-personalization',
  //   label: 'Email Personalization',
  //   icon: MailCheck,
  //   group: 'Lead Management',
  // },
  // {
  //   href: '/drip-campaigns',
  //   label: 'Drip Campaigns',
  //   icon: Workflow,
  //   group: 'Marketing Automation',
  // },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    group: 'Performance',
  },
  // Example for future expansion
  // {
  //   href: '/settings',
  //   label: 'Settings',
  //   icon: Settings,
  //   group: 'Configuration',
  // },
];
