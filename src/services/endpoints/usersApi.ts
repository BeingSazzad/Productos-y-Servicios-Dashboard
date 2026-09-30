import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { EntityStatus, ID } from '@/types/common.types'
import type { User } from '@/types/models'

export function mapBackendUserToUser(raw: any): User {
  if (!raw) return raw
  const imageUrlBase = (import.meta.env.VITE_IMAGE_URL as string | undefined) || ''
  const avatarUrl = raw.profileImage
    ? raw.profileImage.startsWith('http')
      ? raw.profileImage
      : `${imageUrlBase}${raw.profileImage}`
    : undefined

  const storeObj = raw.store
  const storeName = storeObj?.displayName || storeObj?.name || raw.storeName
  const storeId = storeObj?._id || raw.storeId

  return {
    id: String(raw._id || raw.id || ''),
    name: raw.name || '',
    email: raw.email || '',
    phone: raw.phone ? `${raw.countryCode || ''} ${raw.phone}`.trim() : undefined,
    avatarUrl,
    status: raw.status || 'active',
    hasStore: Boolean(storeId || storeName),
    storeName,
    storeId,
    banReason: raw.banReason,
    createdAt: raw.createdAt || new Date().toISOString(),
    lastActiveAt: raw.updatedAt || raw.lastActiveAt || raw.createdAt || new Date().toISOString(),
    role: raw.role || raw.activeRole,
    verified: raw.verified,
    subscriptionStatus: raw.subscriptionStatus,
    store: storeObj,
  }
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<Paginated<User>, ListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.searchTerm = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        return {
          url: '/users',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<User> => {
        let rawData = response?.data
        if (rawData && !Array.isArray(rawData) && Array.isArray(rawData.data)) {
          rawData = rawData.data
        }
        const dataList = Array.isArray(rawData)
          ? rawData
          : Array.isArray(response)
          ? response
          : []
        const meta = response?.meta || response?.data?.meta || {}
        return {
          items: dataList.map(mapBackendUserToUser),
          total: meta.total ?? dataList.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? meta.pageSize ?? 10,
        }
      },
      providesTags: ['User'],
    }),

    getUser: builder.query<User, ID>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any): User => {
        const userRaw = response?.data || response
        return mapBackendUserToUser(userRaw)
      },
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),

    updateUserStatus: builder.mutation<User, { id: ID; status: EntityStatus | string; reason?: string }>({
      query: ({ id, status }) => ({
        url: `/users/status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: any): User => {
        const userRaw = response?.data || response
        return mapBackendUserToUser(userRaw)
      },
      invalidatesTags: ['User', 'Store', 'Product', 'Service'],
    }),
  }),
})

export const { useGetUsersQuery, useGetUserQuery, useUpdateUserStatusMutation } = usersApi
