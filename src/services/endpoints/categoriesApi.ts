import { api } from '@/services/api'
import type { ID } from '@/types/common.types'
import type { Category, StoreType } from '@/types/models'

export interface CategoryInput {
  name: string
  description?: string
  type: StoreType
  status?: string
}

export function mapBackendCategory(raw: any): Category {
  const listingCount =
    raw.listingCount ??
    raw.listingsCount ??
    raw.listings ??
    raw.totalListings ??
    raw.productCount ??
    raw.serviceCount ??
    raw.count ??
    0

  return {
    id: String(raw._id || raw.id || ''),
    _id: raw._id,
    name: raw.name || '',
    description: raw.description || '',
    type: raw.type === 'service' ? 'service' : 'product',
    status: raw.status || 'active',
    isActive: raw.status ? raw.status === 'active' : raw.isActive ?? true,
    isDeleted: Boolean(raw.isDeleted),
    listingCount,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export const categoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => ({
        url: '/categories',
        method: 'GET',
      }),
      transformResponse: (response: any): Category[] => {
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []
        return list.map(mapBackendCategory)
      },
      providesTags: ['Category'],
    }),

    createCategory: builder.mutation<Category, CategoryInput>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body: {
          name: body.name,
          description: body.description || '',
          type: body.type,
        },
      }),
      transformResponse: (response: any) => mapBackendCategory(response?.data || response),
      invalidatesTags: ['Category'],
    }),

    updateCategory: builder.mutation<Category, { id: ID } & CategoryInput>({
      query: ({ id, ...body }) => ({
        url: `/categories/${id}`,
        method: 'PATCH',
        body: {
          name: body.name,
          description: body.description || '',
          type: body.type,
          ...(body.status ? { status: body.status } : {}),
        },
      }),
      transformResponse: (response: any) => mapBackendCategory(response?.data || response),
      invalidatesTags: ['Category'],
    }),

    toggleCategory: builder.mutation<Category, { id: ID; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/categories/${id}`,
        method: 'PATCH',
        body: { status: isActive ? 'active' : 'inactive' },
      }),
      transformResponse: (response: any) => mapBackendCategory(response?.data || response),
      invalidatesTags: ['Category'],
    }),

    deleteCategory: builder.mutation<{ id: ID }, ID>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useToggleCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi
