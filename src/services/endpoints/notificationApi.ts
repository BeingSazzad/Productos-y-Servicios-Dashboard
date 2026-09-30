import { api } from '@/services/api'
import type { ID, ISODate } from '@/types/common.types'

export interface AdminNotification {
  id: ID
  _id?: ID
  title: string
  text: string
  read: boolean
  type?: string
  receiver?: any
  referenceId?: any
  referenceModel?: string
  isDeleted?: boolean
  createdAt: ISODate
  updatedAt?: ISODate
}

export interface AdminNotificationListResponse {
  notifications: AdminNotification[]
  unreadCount: number
  total: number
  page: number
  limit: number
}

export interface GetNotificationParams {
  page?: number
  limit?: number
}

export function mapBackendNotification(raw: any): AdminNotification {
  const id = String(raw._id || raw.id || '')
  return {
    id,
    _id: raw._id || id,
    title: raw.title || 'Notification',
    text: raw.text || raw.message || '',
    read: Boolean(raw.read),
    type: raw.type,
    receiver: raw.receiver,
    referenceId: raw.referenceId,
    referenceModel: raw.referenceModel,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt,
  }
}

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<AdminNotificationListResponse, GetNotificationParams | void>({
      query: (params) => {
        const queryParams: Record<string, number> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.limit) queryParams.limit = params.limit
        return {
          url: '/notifications/admin',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): AdminNotificationListResponse => {
        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []
        const meta = response?.meta || {}
        const notifications: AdminNotification[] = data.map(mapBackendNotification)
        const unreadCount =
          typeof meta.unreadCount === 'number'
            ? meta.unreadCount
            : notifications.filter((n: AdminNotification) => !n.read).length

        return {
          notifications,
          unreadCount,
          total: meta.total ?? notifications.length,
          page: meta.page ?? 1,
          limit: meta.limit ?? 10,
        }
      },
      providesTags: ['Notification'],
    }),

    readAllNotifications: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/admin',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    markNotificationAsRead: builder.mutation<void, ID>({
      query: (id) => ({
        url: `/notifications/admin/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation<void, ID>({
      query: (id) => ({
        url: `/notifications/admin/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteAllNotifications: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/admin',
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} = notificationApi