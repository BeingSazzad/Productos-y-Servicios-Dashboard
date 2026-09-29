import { api } from '@/services/api'
import type { Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { Category, StoreType } from '@/types/models'

export interface CategoryInput {
  name: string
  description?: string
  type: StoreType
  parentId?: string | null
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

  const subCategories = Array.isArray(raw.subCategories)
    ? raw.subCategories.map(mapBackendCategory)
    : undefined

  return {
    id: String(raw._id || raw.id || ''),
    _id: raw._id,
    parentId: raw.parentId ? String(raw.parentId) : null,
    name: raw.name || '',
    description: raw.description || '',
    type: raw.type === 'service' ? 'service' : 'product',
    status: raw.status || 'active',
    isActive: raw.status ? raw.status === 'active' : raw.isActive ?? true,
    isDeleted: Boolean(raw.isDeleted),
    listingCount,
    listingsCount: listingCount,
    subCategories,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export interface GetCategoriesParams {
  type?: StoreType
  page?: number
  pageSize?: number
  limit?: number
  searchTerm?: string
  status?: string
}

export const categoriesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<Paginated<Category>, GetCategoriesParams | StoreType | void>({
      query: (params) => {
        const queryParams: Record<string, string | number> = {}
        const type = typeof params === 'string' ? params : params?.type
        if (type) queryParams.type = type
        if (typeof params === 'object' && params !== null) {
          if (params.page) queryParams.page = params.page
          if (params.pageSize || params.limit) queryParams.limit = params.pageSize || params.limit!
          if (params.searchTerm) queryParams.searchTerm = params.searchTerm
          if (params.status && params.status !== 'all') queryParams.status = params.status
        }
        return {
          url: '/categories',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<Category> => {
        let list: any[] = []
        if (Array.isArray(response?.data)) {
          list = response.data
        } else if (Array.isArray(response?.data?.data)) {
          list = response.data.data
        } else if (Array.isArray(response)) {
          list = response
        }
        const meta = response?.meta || response?.data?.meta || {}
        return {
          items: list.map(mapBackendCategory),
          total: meta.total ?? list.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? meta.pageSize ?? 10,
        }
      },
      providesTags: ['Category'],
    }),

    getSingleCategory: builder.query<Category, ID>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any) => mapBackendCategory(response?.data || response),
      providesTags: (_res, _err, id) => [{ type: 'Category', id }, 'Category'],
    }),

    createCategory: builder.mutation<Category, CategoryInput>({
      query: (body) => {
        const payload: Record<string, unknown> = {
          name: body.name,
          description: body.description || '',
          type: body.type,
        }
        if (body.parentId) payload.parentId = body.parentId
        if (body.status) payload.status = body.status
        return {
          url: '/categories',
          method: 'POST',
          body: payload,
        }
      },
      transformResponse: (response: any) => mapBackendCategory(response?.data || response),
      invalidatesTags: ['Category'],
    }),

    updateCategory: builder.mutation<Category, { id: ID } & CategoryInput>({
      query: ({ id, ...body }) => {
        const payload: Record<string, unknown> = {
          name: body.name,
          description: body.description || '',
          type: body.type,
        }
        if (body.parentId !== undefined) payload.parentId = body.parentId
        if (body.status) payload.status = body.status
        return {
          url: `/categories/${id}`,
          method: 'PATCH',
          body: payload,
        }
      },
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
  useGetSingleCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useToggleCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi
