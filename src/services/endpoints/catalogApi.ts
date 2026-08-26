import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { Product, Service } from '@/types/models'

/** Products and services share list semantics, so they live together. */
export const catalogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Paginated<Product>, ListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        return {
          url: '/products',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<Product> => {
        const items = Array.isArray(response?.data) ? response.data : []
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['Product'],
    }),

    getServices: builder.query<Paginated<Service>, ListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        return {
          url: '/services',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<Service> => {
        const items = Array.isArray(response?.data) ? response.data : []
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['Service'],
    }),

    /* Listings scoped to a single store (used in the store detail page). */
    getStoreProducts: builder.query<Product[], ID>({
      query: (storeId) => ({
        url: `/stores/${storeId}/products`,
        method: 'GET',
      }),
      transformResponse: (response: any): Product[] =>
        Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [],
      providesTags: ['Product'],
    }),

    getStoreServices: builder.query<Service[], ID>({
      query: (storeId) => ({
        url: `/stores/${storeId}/services`,
        method: 'GET',
      }),
      transformResponse: (response: any): Service[] =>
        Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [],
      providesTags: ['Service'],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetServicesQuery,
  useGetStoreProductsQuery,
  useGetStoreServicesQuery,
} = catalogApi
