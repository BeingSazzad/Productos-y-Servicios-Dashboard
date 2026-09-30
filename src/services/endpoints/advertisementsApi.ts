import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { AdvertisementPayment, AdvertisementPaymentCity } from '@/types/models'

export interface AdvertisementPaymentsResult extends Paginated<AdvertisementPayment> {
  totalPayments: number
  totalRevenue: number
  activeAdsCount: number
  trialCount: number
}

function mapCity(raw: any): AdvertisementPaymentCity | null {
  if (!raw) return null
  if (typeof raw === 'string') return { name: raw }
  return {
    id: String(raw.id || raw._id || ''),
    name: raw.name || raw.city || '',
    country: raw.country || '',
    countryCode: raw.countryCode || '',
    latitude: raw.latitude != null ? Number(raw.latitude) : undefined,
    longitude: raw.longitude != null ? Number(raw.longitude) : undefined,
  }
}

function mapPosition(raw: any): number | null {
  if (raw == null || raw === '') return null
  if (typeof raw === 'object') {
    const value = raw.position ?? raw.value
    return value == null || Number.isNaN(Number(value)) ? null : Number(value)
  }
  const value = Number(raw)
  return Number.isNaN(value) ? null : value
}

export function mapBackendAdvertisementPayment(raw: any): AdvertisementPayment {
  if (!raw) return raw
  const seller = raw.seller
    ? {
        id: String(raw.seller.id || raw.seller._id || ''),
        name: raw.seller.name || '',
        email: raw.seller.email || '',
        phone: raw.seller.phone || '',
        profileImage: raw.seller.profileImage || null,
      }
    : null

  const store = raw.store
    ? {
        id: String(raw.store.id || raw.store._id || ''),
        displayName: raw.store.displayName || null,
        logo: raw.store.logo || null,
        storeType: raw.store.storeType || '',
        phone: raw.store.phone || null,
        email: raw.store.email || null,
        address: raw.store.address || null,
      }
    : null

  const pkg = raw.package
    ? {
        id: String(raw.package.id || raw.package._id || ''),
        name: raw.package.name || '',
        duration: raw.package.duration || '',
        price: Number(raw.package.price) || 0,
      }
    : null

  const subscription = raw.subscription
    ? {
        status: raw.subscription.status || '',
        expiresAt: raw.subscription.expiresAt,
        remainingDays: Number(raw.subscription.remainingDays) || 0,
        isExpired: Boolean(raw.subscription.isExpired),
      }
    : null

  return {
    id: String(raw.id || raw._id || ''),
    subscriptionId: raw.subscriptionId ? String(raw.subscriptionId) : undefined,
    seller,
    store,
    city: mapCity(raw.city),
    position: mapPosition(raw.position),
    amountPaid: Number(raw.amountPaid) || 0,
    trxId: raw.trxId ?? null,
    stripeSessionId: raw.stripeSessionId ?? null,
    invoiceNumber: raw.invoiceNumber ?? null,
    invoiceUrl: raw.invoiceUrl ?? null,
    invoiceDownloadUrl: raw.invoiceDownloadUrl ?? null,
    paymentMethod: raw.paymentMethod || '',
    paymentStatus: raw.paymentStatus || '',
    paymentDate: raw.paymentDate,
    isTrial: Boolean(raw.isTrial),
    package: pkg,
    subscription,
    advertisement: raw.advertisement ?? null,
    isAdSubmitted: Boolean(raw.isAdSubmitted),
  }
}

export const advertisementsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdvertisementPayments: builder.query<AdvertisementPaymentsResult, ListParams | void>({
      query: (params) => {
        const queryParams: Record<string, unknown> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.searchTerm = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.paymentStatus = params.status
        return {
          url: '/advertisements/admin/payments',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): AdvertisementPaymentsResult => {
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []
        const pagination = response?.pagination || {}
        const meta = response?.meta || {}
        return {
          items: list.map(mapBackendAdvertisementPayment),
          total: pagination.total ?? meta.total ?? list.length,
          page: pagination.page ?? meta.page ?? 1,
          pageSize: pagination.limit ?? meta.limit ?? 10,
          totalPayments: meta.totalPayments ?? pagination.total ?? list.length,
          totalRevenue: Number(meta.totalRevenue) || 0,
          activeAdsCount: Number(meta.activeAdsCount) || 0,
          trialCount: Number(meta.trialCount) || 0,
        }
      },
      providesTags: ['AdvertisementPayment'],
    }),

    getAdvertisementPayment: builder.query<AdvertisementPayment, ID>({
      query: (id) => ({
        url: `/advertisements/admin/payments/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any): AdvertisementPayment =>
        mapBackendAdvertisementPayment(response?.data || response),
      providesTags: (_res, _err, id) => [{ type: 'AdvertisementPayment', id }],
    }),
  }),
})

export const { useGetAdvertisementPaymentsQuery, useGetAdvertisementPaymentQuery } = advertisementsApi
