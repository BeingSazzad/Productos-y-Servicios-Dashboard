import { api } from '@/services/api'
import type { ID } from '@/types/common.types'
import type { Admin } from '@/types/models'

export interface CreateAdminRequest {
  name: string
  email: string
  password?: string
  role: string
}

export interface UpdateAdminRequest {
  id: ID
  name: string
  email: string
  password?: string
  role: string
}

export function mapBackendAdminToAdmin(raw: any): Admin {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')
  return {
    id,
    _id: raw._id || id,
    name: raw.name || '',
    email: raw.email || '',
    role: raw.role || 'admin',
    status: raw.status || 'active',
    profileImage: raw.profileImage || '',
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    lastActiveAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
  }
}

export const adminsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<Admin[], void>({
      query: () => ({
        url: '/users/admins',
        method: 'GET',
      }),
      transformResponse: (response: any): Admin[] => {
        const list = Array.isArray(response?.data?.data)
          ? response.data.data
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []
        return list.map(mapBackendAdminToAdmin)
      },
      providesTags: ['Admin'],
    }),

    createAdmin: builder.mutation<Admin, CreateAdminRequest>({
      query: (body) => ({
        url: '/users/create-admin',
        method: 'POST',
        body: {
          name: body.name,
          email: body.email,
          password: body.password,
          role: body.role || 'admin',
        },
      }),
      transformResponse: (response: any) => mapBackendAdminToAdmin(response?.data || response),
      invalidatesTags: ['Admin'],
    }),



    updateAdminStatus: builder.mutation<Admin, { id: ID; status: Admin['status'] }>({
      query: ({ id, status }) => ({
        url: `/users/admin/status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: any) => mapBackendAdminToAdmin(response?.data || response),
      invalidatesTags: ['Admin'],
    }),

    deleteAdmin: builder.mutation<{ id: ID }, ID>({
      query: (id) => ({
        url: `/users/admins/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (_response: any, _meta: any, id: ID) => ({ id }),
      invalidatesTags: ['Admin'],
    }),
  }),
})

export const {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminStatusMutation,
  useDeleteAdminMutation,
} = adminsApi
