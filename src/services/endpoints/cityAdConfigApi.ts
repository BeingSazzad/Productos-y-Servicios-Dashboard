import { api } from '@/services/api'
import type { ListParams, Paginated } from '@/types/api.types'
import type { ID } from '@/types/common.types'
import type { CityAdConfiguration, FeaturedPositionPrice } from '@/types/models'

export interface CityAdConfigInput {
  country: string
  countryCode: string
  province?: string
  provinceCode?: string
  city: string
  canton?: string
  sector?: string
  neighborhood?: string
  latitude: number
  longitude: number
  featuredCapacity: number
  featuredEnabled: boolean
  featuredPositionPricing: FeaturedPositionPrice[]
  status?: string
  defaultFeaturedImageFile?: File | null
}

export function mapBackendCityAdConfig(raw: any): CityAdConfiguration {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')
  const pricing = Array.isArray(raw.featuredPositionPricing)
    ? raw.featuredPositionPricing.map((item: any) => ({
        position: Number(item?.position) || 0,
        price: Number(item?.price) || 0,
      }))
    : []

  return {
    id,
    _id: raw._id || id,
    country: raw.country || '',
    countryCode: raw.countryCode || '',
    province: raw.province || '',
    provinceCode: raw.provinceCode || '',
    city: raw.city || raw.canton || '',
    canton: raw.canton || raw.city || '',
    sector: raw.sector || '',
    neighborhood: raw.neighborhood || '',
    latitude: Number(raw.latitude) || 0,
    longitude: Number(raw.longitude) || 0,
    bannerCapacity: typeof raw.bannerCapacity === 'number' ? raw.bannerCapacity : undefined,
    featuredCapacity: Number(raw.featuredCapacity) || 0,
    bannerEnabled: Boolean(raw.bannerEnabled),
    featuredEnabled: Boolean(raw.featuredEnabled),
    featuredPositionPricing: pricing,
    defaultFeaturedImage: raw.defaultFeaturedImage || '',
    status: raw.status || 'active',
    lockVersion: raw.lockVersion,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

function toPayloadJson(body: CityAdConfigInput) {
  const payload: Record<string, unknown> = {
    country: body.country,
    countryCode: body.countryCode,
    city: body.city,
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    featuredCapacity: Number(body.featuredCapacity),
    featuredEnabled: Boolean(body.featuredEnabled),
    featuredPositionPricing: (body.featuredPositionPricing || []).map((item) => ({
      position: Number(item.position),
      price: Number(item.price),
    })),
  }

  if (body.province) payload.province = body.province
  if (body.provinceCode) payload.provinceCode = body.provinceCode
  if (body.canton) payload.canton = body.canton
  if (body.sector) payload.sector = body.sector
  if (body.neighborhood) payload.neighborhood = body.neighborhood

  if (body.status) {
    payload.status = body.status
  }

  return payload
}

/** Builds multipart form-data: `data` (JSON string) + optional `defaultFeaturedImage` file. */
export function buildCityAdConfigFormData(body: CityAdConfigInput): FormData {
  const formData = new FormData()
  formData.append('data', JSON.stringify(toPayloadJson(body)))
  if (body.defaultFeaturedImageFile) {
    formData.append('defaultFeaturedImage', body.defaultFeaturedImageFile)
  }
  return formData
}

function unwrapList(response: any): any[] {
  const rawData = response?.data
  if (Array.isArray(rawData)) return rawData
  if (Array.isArray(rawData?.data)) return rawData.data
  if (Array.isArray(response)) return response
  return []
}

export const cityAdConfigApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCityAdConfigs: builder.query<Paginated<CityAdConfiguration>, ListParams | void>({
      query: (params) => {
        const queryParams: Record<string, unknown> = {}
        if (params?.page) queryParams.page = params.page
        if (params?.pageSize) queryParams.limit = params.pageSize
        if (params?.search && params.search.trim()) queryParams.searchTerm = params.search.trim()
        if (params?.status && params.status !== 'all') queryParams.status = params.status
        return {
          url: '/city-ad-configurations/admin',
          method: 'GET',
          params: queryParams,
        }
      },
      transformResponse: (response: any): Paginated<CityAdConfiguration> => {
        const list = unwrapList(response)
        const pagination = response?.pagination || {}
        return {
          items: list.map(mapBackendCityAdConfig),
          total: pagination.total ?? list.length,
          page: pagination.page ?? 1,
          pageSize: pagination.limit ?? pagination.pageSize ?? 10,
        }
      },
      providesTags: ['CityAdConfig'],
    }),

    getCityAdConfig: builder.query<CityAdConfiguration, ID>({
      query: (id) => ({
        url: `/city-ad-configurations/admin/${id}`,
        method: 'GET',
      }),
      transformResponse: (response: any): CityAdConfiguration =>
        mapBackendCityAdConfig(response?.data || response),
      providesTags: (_res, _err, id) => [{ type: 'CityAdConfig', id }],
    }),

    createCityAdConfig: builder.mutation<CityAdConfiguration, CityAdConfigInput>({
      query: (body) => ({
        url: '/city-ad-configurations/admin',
        method: 'POST',
        body: buildCityAdConfigFormData(body),
      }),
      transformResponse: (response: any) => mapBackendCityAdConfig(response?.data || response),
      invalidatesTags: ['CityAdConfig'],
    }),

    updateCityAdConfig: builder.mutation<CityAdConfiguration, { id: ID } & CityAdConfigInput>({
      query: ({ id, ...body }) => ({
        url: `/city-ad-configurations/admin/${id}`,
        method: 'PATCH',
        body: buildCityAdConfigFormData(body),
      }),
      transformResponse: (response: any) => mapBackendCityAdConfig(response?.data || response),
      invalidatesTags: ['CityAdConfig'],
    }),

    deleteCityAdConfig: builder.mutation<{ id: ID }, ID>({
      query: (id) => ({
        url: `/city-ad-configurations/admin/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (_response: any, _meta: any, id: ID) => ({ id }),
      invalidatesTags: ['CityAdConfig'],
    }),
  }),
})

export const {
  useGetCityAdConfigsQuery,
  useGetCityAdConfigQuery,
  useCreateCityAdConfigMutation,
  useUpdateCityAdConfigMutation,
  useDeleteCityAdConfigMutation,
} = cityAdConfigApi
