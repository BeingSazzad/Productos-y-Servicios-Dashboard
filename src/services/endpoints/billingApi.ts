import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { Plan, Subscription, Transaction } from '@/types/models'

export interface PlanInput {
  name: string
  price: number
  duration: 'seven_days' | 'one_month' | 'one_year' | string
  packageType: 'store_creation' | 'store_growth' | string
  listingLimit?: number
  isUnlimitedListings?: boolean
  trialEnabled?: boolean
  trialPeriodDays?: number
  features?: string[]
  status?: string
  isActive?: boolean
}

export function mapBackendSubscriptionToSubscription(raw: any): Subscription {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')

  const rawUser = typeof raw.userId === 'object' && raw.userId !== null ? raw.userId : null
  const rawStore = typeof raw.store === 'object' && raw.store !== null ? raw.store : null
  const rawPackage = typeof raw.packageId === 'object' && raw.packageId !== null ? raw.packageId : null

  const userName = rawUser?.name || raw.userName || 'Subscriber'
  const userEmail = rawUser?.email || raw.userEmail || ''
  const storeName = rawStore?.displayName || rawStore?.name || raw.storeName || 'Store'
  const planName = rawPackage?.name || raw.planName || 'Subscription Package'
  const storeType =
    rawStore?.storeType === 'product_store'
      ? 'product'
      : rawStore?.storeType === 'service_store'
      ? 'service'
      : raw.storeType || 'product'

  const amount = typeof raw.amountPaid === 'number' ? raw.amountPaid : rawPackage?.price ?? 0

  let status: Subscription['status'] = 'active'
  if (raw.isDeleted) {
    status = 'canceled'
  } else if (raw.expiresAt) {
    const exp = new Date(raw.expiresAt).getTime()
    if (!isNaN(exp) && exp < Date.now()) {
      status = 'expired'
    }
  }

  return {
    id,
    _id: raw._id || id,
    storeId: String(rawStore?._id || rawStore?.id || raw.storeId || raw.store || ''),
    storeName,
    ownerName: userName,
    ownerEmail: userEmail,
    storeType,
    planId: String(rawPackage?._id || rawPackage?.id || raw.packageId || raw.planId || ''),
    planName,
    amount,
    currency: 'USD',
    billingCycle: rawPackage?.duration || raw.billingCycle || 'monthly',
    status,
    createdAt: raw.createdAt || raw.startDate,
    startDate: raw.startDate || raw.createdAt || new Date().toISOString(),
    expiresAt: raw.expiresAt || raw.currentPeriodEnd,
    stripeSubscriptionId: raw.stripeSubscriptionId,
    userId: rawUser
      ? {
          _id: rawUser._id || rawUser.id,
          name: rawUser.name,
          email: rawUser.email,
          phone: rawUser.phone,
          profileImage: rawUser.profileImage,
        }
      : undefined,
    user: rawUser
      ? {
          _id: rawUser._id || rawUser.id,
          name: rawUser.name,
          email: rawUser.email,
          phone: rawUser.phone,
          profileImage: rawUser.profileImage,
        }
      : undefined,
    store: rawStore
      ? {
          ...rawStore,
          _id: rawStore._id || rawStore.id,
          name: rawStore.displayName || rawStore.name,
          displayName: rawStore.displayName || rawStore.name,
          logo: rawStore.logo,
          email: rawStore.email,
          phone: rawStore.phone,
          city: rawStore.city,
          streetAddress: rawStore.streetAddress,
          isVerified: rawStore.isVerified,
        }
      : undefined,
    packageId: rawPackage
      ? {
          _id: rawPackage._id || rawPackage.id,
          name: rawPackage.name,
          price: rawPackage.price,
          duration: rawPackage.duration,
          packageType: rawPackage.packageType,
          listingLimit: rawPackage.listingLimit,
        }
      : undefined,
    package: rawPackage
      ? {
          _id: rawPackage._id || rawPackage.id,
          name: rawPackage.name,
          price: rawPackage.price,
          duration: rawPackage.duration,
          packageType: rawPackage.packageType,
          listingLimit: rawPackage.listingLimit,
        }
      : undefined,
    packageType: rawPackage?.packageType,
  }
}

export function mapBackendPackageToPlan(raw: any): Plan {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')
  const name = raw.name || raw.title || ''
  const price = typeof raw.price === 'number' ? raw.price : 0
  const status = raw.status || (raw.isActive === false ? 'inactive' : 'active')
  const isActive = status === 'active'

  return {
    id,
    _id: raw._id || id,
    name,
    description: raw.description || `${name} package`,
    price,
    currency: 'USD',
    billingCycle: raw.duration || 'monthly',
    duration: raw.duration || 'seven_days',
    packageType: raw.packageType || 'store_creation',
    listingLimit: raw.listingLimit ?? 0,
    isUnlimitedListings: Boolean(raw.isUnlimitedListings),
    trialEnabled: Boolean(raw.trialEnabled),
    trialPeriodDays: raw.trialPeriodDays ?? 0,
    stripeProductId: raw.stripeProductId,
    stripePriceId: raw.stripePriceId,
    status,
    isActive,
    features: Array.isArray(raw.features) ? raw.features : [],
    appliesTo: raw.appliesTo || ['product', 'service'],
    popular: Boolean(raw.popular),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

/** Subscriptions + plans (billing domain). */
export const billingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptions: builder.query<Paginated<Subscription>, ListParams & { plan?: string }>({
      query: (params) => {
        const queryParams: Record<string, any> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.search = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        if (params?.plan && params.plan !== 'all') queryParams.packageId = params.plan
        return {
          url: '/subscriptions',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<Subscription> => {
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
          items: dataList.map(mapBackendSubscriptionToSubscription),
          total: meta.total ?? dataList.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? meta.pageSize ?? 10,
        }
      },
      providesTags: ['Subscription'],
    }),

    getPlans: builder.query<Plan[], void>({
      query: () => ({ url: '/subscription-packages', method: 'GET' }),
      transformResponse: (response: any): Plan[] => {
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []
        return list.map(mapBackendPackageToPlan)
      },
      providesTags: ['Plan'],
    }),

    togglePlan: builder.mutation<Plan, { id: ID; isActive?: boolean; status?: string }>({
      query: ({ id, isActive, status }) => {
        const targetStatus = status || (isActive ? 'active' : 'inactive')
        return {
          url: `/subscription-packages/${id}/status`,
          method: 'PATCH',
          body: { status: targetStatus },
        }
      },
      transformResponse: (response: any) => {
        const item = response?.data || response
        return mapBackendPackageToPlan(item)
      },
      invalidatesTags: ['Plan'],
    }),

    createPlan: builder.mutation<Plan, PlanInput>({
      query: (body) => {
        const payload = {
          name: body.name,
          price: body.price,
          duration: body.duration || 'seven_days',
          packageType: body.packageType || 'store_creation',
          listingLimit: body.isUnlimitedListings ? 0 : (body.listingLimit ?? 0),
          isUnlimitedListings: Boolean(body.isUnlimitedListings),
          trialEnabled: Boolean(body.trialEnabled),
          trialPeriodDays: body.trialPeriodDays ?? 0,
          features: body.features || [],
        }
        return {
          url: '/subscription-packages',
          method: 'POST',
          body: payload,
        }
      },
      transformResponse: (response: any) => {
        const item = response?.data || response
        return mapBackendPackageToPlan(item)
      },
      invalidatesTags: ['Plan'],
    }),

    updatePlan: builder.mutation<Plan, { id: ID } & Partial<PlanInput>>({
      query: ({ id, ...body }) => {
        const payload: Record<string, any> = {}
        if (body.name !== undefined) payload.name = body.name
        if (body.price !== undefined) payload.price = body.price
        if (body.duration !== undefined) payload.duration = body.duration
        if (body.packageType !== undefined) payload.packageType = body.packageType
        if (body.listingLimit !== undefined) payload.listingLimit = body.isUnlimitedListings ? 0 : body.listingLimit
        if (body.isUnlimitedListings !== undefined) payload.isUnlimitedListings = Boolean(body.isUnlimitedListings)
        if (body.trialEnabled !== undefined) payload.trialEnabled = Boolean(body.trialEnabled)
        if (body.trialPeriodDays !== undefined) payload.trialPeriodDays = body.trialPeriodDays
        if (body.features !== undefined) payload.features = body.features

        return {
          url: `/subscription-packages/${id}`,
          method: 'PATCH',
          body: payload,
        }
      },
      transformResponse: (response: any) => {
        const item = response?.data || response
        return mapBackendPackageToPlan(item)
      },
      invalidatesTags: ['Plan'],
    }),

    deletePlan: builder.mutation<{ id: ID }, ID>({
      query: (id) => ({
        url: `/subscription-packages/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (_response: any, _meta: any, id: ID) => ({ id }),
      invalidatesTags: ['Plan'],
    }),

    cancelSubscription: builder.mutation<Subscription, ID>({
      query: (id) => ({ url: `/subscriptions/${id}/cancel`, method: 'POST' }),
      transformResponse: (response: any) => mapBackendSubscriptionToSubscription(response?.data || response),
      invalidatesTags: ['Subscription'],
    }),

    /* Transactions / payment history */
    getTransactions: builder.query<Paginated<Transaction>, ListParams>({
      query: (params) => ({ url: '/transactions', method: 'GET', params }),
      transformResponse: (response: any): Paginated<Transaction> => {
        const items = Array.isArray(response?.data) ? response.data : []
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['Transaction'],
    }),

    refundTransaction: builder.mutation<Transaction, ID>({
      query: (id) => ({ url: `/transactions/${id}/refund`, method: 'POST' }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: ['Transaction'],
    }),
  }),
})

export const {
  useGetSubscriptionsQuery,
  useGetPlansQuery,
  useTogglePlanMutation,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useCancelSubscriptionMutation,
  useGetTransactionsQuery,
  useRefundTransactionMutation,
} = billingApi
