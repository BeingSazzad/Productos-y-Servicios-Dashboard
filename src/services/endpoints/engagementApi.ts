import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { Announcement, AnnouncementAudience } from '@/types/models'

export interface AnnouncementListParams extends ListParams {
  audience?: AnnouncementAudience | 'all'
}

export interface CreateAnnouncementRequest {
  title: string
  message: string
  audience: AnnouncementAudience
}

export function mapBackendAnnouncement(raw: any): Announcement {
  const msg = raw?.message || raw?.body || ''
  return {
    id: String(raw?._id || raw?.id || ''),
    _id: raw?._id,
    title: raw?.title || '',
    message: msg,
    body: msg,
    audience: raw?.audience || 'everyone',
    channel: raw?.channel || 'push_notification',
    status: raw?.status || 'sent',
    recipients: raw?.recipients ?? 0,
    createdBy: raw?.createdBy,
    isDeleted: Boolean(raw?.isDeleted),
    sentAt: raw?.sentAt || raw?.createdAt,
    createdAt: raw?.createdAt || new Date().toISOString(),
    updatedAt: raw?.updatedAt,
  }
}

export const engagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<Paginated<Announcement>, AnnouncementListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
        if (params?.audience && params.audience !== 'all') queryParams.audience = params.audience
        return {
          url: '/announcements',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<Announcement> => {
        const rawList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []
        const items = rawList.map(mapBackendAnnouncement)
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['Announcement'],
    }),

    createAnnouncement: builder.mutation<Announcement, CreateAnnouncementRequest>({
      query: (body) => ({
        url: '/announcements',
        method: 'POST',
        body: {
          title: body.title,
          message: body.message,
          audience: body.audience,
        },
      }),
      transformResponse: (response: any) => mapBackendAnnouncement(response?.data || response),
      invalidatesTags: ['Announcement'],
    }),

    deleteAnnouncement: builder.mutation<{ id: ID }, ID>({
      query: (id) => ({
        url: `/announcements/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Announcement'],
    }),
  }),
})

export const {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} = engagementApi
