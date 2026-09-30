import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { EntityStatus, ID } from '@/types/common.types'
import type { Store, StoreDetailData, StoreType } from '@/types/models'

interface StoreListParams extends ListParams {
  type?: StoreType | 'all'
}

export const storesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStores: builder.query<Paginated<Store>, StoreListParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.searchTerm = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        if (params?.type && params.type !== 'all') {
          queryParams.storeType =
            params.type === 'product'
              ? 'product_store'
              : params.type === 'service'
              ? 'service_store'
              : params.type
        }
        return {
          url: '/stores',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<Store> => {
        const items = Array.isArray(response?.data) ? response.data : []
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['Store'],
    }),

    getStore: builder.query<StoreDetailData, ID>({
      query: (id) => ({
        url: `/stores/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any): StoreDetailData => {
        const data = response?.data || {}
        return {
          store: data.store || data,
          products: Array.isArray(data.products) ? data.products : [],
          services: Array.isArray(data.services) ? data.services : [],
        }
      },
      providesTags: (_r, _e, id) => [{ type: 'Store', id }],
    }),

    updateStoreStatus: builder.mutation<Store, { id: ID; status: EntityStatus | string }>({
      query: ({ id, status }) => ({
        url: `/stores/status/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ['Store', 'Product', 'Service'],
    }),

    verifyStore: builder.mutation<Store, { id: ID; isVerified: boolean }>({
      query: ({ id, isVerified }) => ({
        url: `/stores/verify/${id}`,
        method: 'PATCH',
        body: { isVerified },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ['Store'],
    }),
  }),
})

export const {
  useGetStoresQuery,
  useGetStoreQuery,
  useUpdateStoreStatusMutation,
  useVerifyStoreMutation,
} = storesApi

