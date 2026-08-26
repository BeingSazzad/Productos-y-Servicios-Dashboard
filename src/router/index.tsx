import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PrivateRoute } from './PrivateRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ROUTES } from '@/constants/routes'

import LoginPage from '@/pages/auth/LoginPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import VerifyOtpPage from '@/pages/auth/VerifyOtpPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import UsersPage from '@/pages/users/UsersPage'
import UserDetailPage from '@/pages/users/UserDetailPage'
import StoresPage from '@/pages/stores/StoresPage'
import StoreDetailPage from '@/pages/stores/StoreDetailPage'
import SubscriptionsPage from '@/pages/subscriptions/SubscriptionsPage'
import PlansPage from '@/pages/plans/PlansPage'
import TransactionsPage from '@/pages/billing/TransactionsPage'
import CategoriesPage from '@/pages/categories/CategoriesPage'
import BannersPage from '@/pages/cms/BannersPage'
import PagesPage from '@/pages/cms/PagesPage'
import FaqsPage from '@/pages/cms/FaqsPage'
import SupportPage from '@/pages/support/SupportPage'
import AnnouncementsPage from '@/pages/engagement/AnnouncementsPage'
import AdminsPage from '@/pages/admins/AdminsPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: ROUTES.login, element: <LoginPage /> },
  { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
  { path: ROUTES.verifyOtp, element: <VerifyOtpPage /> },
  { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.users, element: <UsersPage /> },
          { path: ROUTES.userDetail(), element: <UserDetailPage /> },
          { path: ROUTES.stores, element: <StoresPage /> },
          { path: ROUTES.storeDetail(), element: <StoreDetailPage /> },
          { path: ROUTES.categories, element: <CategoriesPage /> },

          { path: ROUTES.subscriptions, element: <SubscriptionsPage /> },
          { path: ROUTES.plans, element: <PlansPage /> },
          { path: ROUTES.transactions, element: <TransactionsPage /> },

          { path: ROUTES.banners, element: <BannersPage /> },
          { path: ROUTES.pages, element: <PagesPage /> },
          { path: ROUTES.faqs, element: <FaqsPage /> },

          { path: ROUTES.support, element: <SupportPage /> },
          { path: ROUTES.announcements, element: <AnnouncementsPage /> },

          { path: ROUTES.admins, element: <AdminsPage /> },
          { path: ROUTES.settings, element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <Navigate to="/404" replace /> },
])
