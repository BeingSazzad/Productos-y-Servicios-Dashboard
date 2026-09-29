/** Centralized route paths — the single source of truth for navigation. */
export const ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  verifyOtp: '/verify-otp',
  resetPassword: '/reset-password',

  dashboard: '/',

  users: '/users',
  userDetail: (id = ':id') => `/users/${id}`,

  stores: '/stores',
  storeDetail: (id = ':id') => `/stores/${id}`,

  categories: '/categories',

  // Billing
  subscriptions: '/subscriptions',
  plans: '/plans',
  transactions: '/transactions',

  // CMS
  banners: '/cms/banners',
  pages: '/cms/pages',
  faqs: '/cms/faqs',
  adsConfiguration: '/ads-configuration',
  advertisementsPayments: '/advertisements-payments',

  // Engagement
  support: '/support',
  announcements: '/announcements',
  reports: '/reports',

  // Administration
  admins: '/admins',
  settings: '/settings',
} as const
