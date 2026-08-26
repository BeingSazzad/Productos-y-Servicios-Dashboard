import { api } from '@/services/api'
import type { DashboardOverviewData, DashboardOverviewResponse } from '@/types/models'

export const statsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<DashboardOverviewData, { year?: string | number } | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.year) queryParams.year = params.year
        return {
          url: '/dashboard/overview',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: DashboardOverviewResponse) => {
        return response.data
      },
      providesTags: ['Stats'],
    }),
  }),
})

export const { useGetDashboardOverviewQuery } = statsApi
