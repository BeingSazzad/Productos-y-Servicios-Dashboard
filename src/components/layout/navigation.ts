import {
  LayoutDashboard,
  Users,
  Store,
  CreditCard,
  BadgeDollarSign,
  Receipt,
  Tags,
  Megaphone,
  LifeBuoy,
  Settings,
  Image,
  FileText,
  HelpCircle,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Exact match only (used for the dashboard index route). */
  end?: boolean
  /** Optional badge key resolved at render time. */
  badgeKey?: 'support'
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/** Sidebar navigation — grouped to mirror the marketplace's domains. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Marketplace',
    items: [
      { label: 'Users', to: ROUTES.users, icon: Users },
      { label: 'Stores', to: ROUTES.stores, icon: Store },
      { label: 'Categories', to: ROUTES.categories, icon: Tags },
    ],
  },
  {
    title: 'Billing',
    items: [
      { label: 'Subscriptions', to: ROUTES.subscriptions, icon: CreditCard },
      { label: 'Subscription Plans', to: ROUTES.plans, icon: BadgeDollarSign },
      { label: 'Transactions', to: ROUTES.transactions, icon: Receipt },
    ],
  },
  {
    title: 'Content (CMS)',
    items: [
      { label: 'Banners', to: ROUTES.banners, icon: Image },
      { label: 'Pages', to: ROUTES.pages, icon: FileText },
      { label: 'FAQs', to: ROUTES.faqs, icon: HelpCircle },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { label: 'Support', to: ROUTES.support, icon: LifeBuoy, badgeKey: 'support' },
      { label: 'Announcements', to: ROUTES.announcements, icon: Megaphone },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Admins', to: ROUTES.admins, icon: UserCog },
      { label: 'Settings', to: ROUTES.settings, icon: Settings },
    ],
  },
]
