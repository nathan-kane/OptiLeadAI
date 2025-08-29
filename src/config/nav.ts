import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Target, MailCheck, Workflow, BarChart3, Settings, Users, User, CreditCard, DollarSign, Plus, Building2, Home, Search, ClipboardCheck, UserCheck, HelpCircle } from 'lucide-react';

export interface NavItem {
  href?: string;
  label: string;
  icon: LucideIcon;
  group?: string;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    label: 'Leads',
    icon: Target,
    group: 'Lead Management',
    children: [
      {
        href: '/dashboard',
        label: 'Leads Dashboard',
        icon: LayoutDashboard,
      },
      {
        href: '/prospecting',
        label: 'Prospecting Campaigns',
        icon: Target,
      },
      {
        href: '/analytics',
        label: 'Analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Clients',
    icon: Users,
    group: 'CRM / Client Management',
    children: [
      {
        href: '/clients',
        label: 'Clients Dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'Transactions',
    icon: DollarSign,
    group: 'Transaction Management',
    children: [
      {
        href: '/transactions',
        label: 'Transactions Dashboard',
        icon: LayoutDashboard,
      },
      {
        href: '/transactions/new',
        label: 'New Transaction',
        icon: Plus,
      },
    ],
  },
  {
    label: 'Service Partners',
    icon: Building2,
    group: 'Service Management',
    children: [
      {
        href: '/service-partners/mortgage',
        label: 'Mortgage Companies',
        icon: Home,
      },
      {
        href: '/service-partners/title-company',
        label: 'Title Companies',
        icon: ClipboardCheck,
      },
      {
        href: '/service-partners/appraisers',
        label: 'Appraisers',
        icon: Search,
      },
      {
        href: '/service-partners/inspectors',
        label: 'Inspectors',
        icon: ClipboardCheck,
      },
    ],
  },
  {
    href: '/help',
    label: 'Help & Support',
    icon: HelpCircle,
    group: 'Support',
  },
  // Example for future expansion
  // {
  //   href: '/settings',
  //   label: 'Settings',
  //   icon: Settings,
  //   group: 'Configuration',
  // },
];
