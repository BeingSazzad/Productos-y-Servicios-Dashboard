import { api } from '../api'
import type { ID, ISODate } from '@/types/common.types'

export type ReportType = 'user' | 'store'
export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed'
export type ReportActionTaken =
  | 'none'
  | 'other'
  | 'dismissed_no_violation'
  | 'content_removed'
  | 'user_blocked'
  | 'warning_issued'
  | 'store_suspended'

export interface ReportUser {
  _id?: string
  id?: string
  name: string
  role?: string
  email?: string
  profileImage?: string
  status?: string
  phone?: string
}

export interface ReportStore {
  _id?: string
  id?: string
  name: string
  logo?: string
  status?: string
  owner?: any
}

export interface ReportItem {
  id: ID
  _id: ID
  reporterId?: ReportUser | null
  reportType: ReportType
  targetStore?: ReportStore | null
  targetUser?: ReportUser | null
  reason: string
  description: string
  images?: string[]
  status: ReportStatus
  adminNotes?: string
  actionTaken: ReportActionTaken
  resolvedBy?: any
  resolvedAt?: ISODate | null
  isDeleted?: boolean
  createdAt: ISODate
  updatedAt?: ISODate
}

export interface ReportSummary {
  total: number
  pending: number
  under_review: number
  resolved: number
  dismissed: number
  storeReports: number
  userReports: number
}

export interface ReportStats {
  totalReports: number
  pendingReports: number
  underReviewReports: number
  resolvedReports: number
  dismissedReports: number
  storeReportsCount: number
  userReportsCount: number
  recentReports?: ReportItem[]
}

export interface GetReportsResponse {
  reports: ReportItem[]
  summary?: ReportSummary
  meta: {
    page: number
    limit: number
    total: number
    totalPage: number
  }
}

export interface GetReportsParams {
  page?: number
  limit?: number
  status?: string
  reportType?: string
  search?: string
}

export interface UpdateReportPayload {
  id: ID
  status: ReportStatus
  adminNotes?: string
  actionTaken?: ReportActionTaken
}

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReportStats: builder.query<ReportStats, void>({
      query: () => ({
        url: '/reports/stats',
        method: 'GET',
      }),
      transformResponse: (res: any): ReportStats => {
        return (
          res?.data || {
            totalReports: 0,
            pendingReports: 0,
            underReviewReports: 0,
            resolvedReports: 0,
            dismissedReports: 0,
            storeReportsCount: 0,
            userReportsCount: 0,
            recentReports: [],
          }
        )
      },
      providesTags: ['Report'],
    }),

    getReports: builder.query<GetReportsResponse, GetReportsParams | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.limit) queryParams.limit = params.limit
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        if (params?.reportType && params.reportType !== 'all')
          queryParams.reportType = params.reportType
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()

        return {
          url: '/reports',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): GetReportsResponse => {
        const data = response?.data || {}
        const rawReports = Array.isArray(data?.reports)
          ? data.reports
          : Array.isArray(data)
          ? data
          : []
        const reports = rawReports.map((r: any) => ({
          ...r,
          id: String(r._id || r.id || ''),
          _id: String(r._id || r.id || ''),
        }))

        return {
          reports,
          summary: data?.summary,
          meta: response?.meta || {
            page: 1,
            limit: 10,
            total: reports.length,
            totalPage: 1,
          },
        }
      },
      providesTags: ['Report'],
    }),

    updateReportStatus: builder.mutation<ReportItem, UpdateReportPayload>({
      query: ({ id, ...body }) => ({
        url: `/reports/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Report'],
    }),
  }),
})

export const {
  useGetReportStatsQuery,
  useGetReportsQuery,
  useUpdateReportStatusMutation,
} = reportsApi