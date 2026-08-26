import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'
import { env } from '@/config/env'


export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.apiUrl,
    prepareHeaders: (headers, { getState }) => {
      const stateToken = (getState() as RootState).auth?.token
      const localToken = typeof localStorage !== 'undefined' ? localStorage.getItem('token') || localStorage.getItem('access_token') : null
      const token = stateToken || localToken
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: [
    'User',
    'Store',
    'Product',
    'Service',
    'Subscription',
    'Plan',
    'Category',
    'Stats',
    'Report',
    'Admin',
    'Banner',
    'ContentPage',
    'Faq',
    'Transaction',
    'Announcement',
    'AuditLog',
    'SupportTicket',
    'SupportThread',
  ],
  endpoints: () => ({}),
})
