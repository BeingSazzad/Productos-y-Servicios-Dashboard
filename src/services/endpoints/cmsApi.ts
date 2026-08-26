import { api } from '@/services/api'
import type { ID } from '@/types/common.types'
import type { Banner, BannerPlacement, ContentPage, ContentStatus, Faq } from '@/types/models'

export interface UpdateContentPageRequest {
  id?: ID
  type: string
  title?: string
  content: string
  status?: ContentStatus
}

export interface BannerInput {
  name?: string
  title?: string
  description?: string
  imageFile?: File | null
  imageUrl?: string
  placement?: BannerPlacement
  isActive?: boolean
  startsAt?: string
  endsAt?: string
}

export function mapBackendBannerToBanner(raw: any): Banner {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')
  const name = raw.name || raw.title || ''
  const description = raw.description || ''
  const imagePath = raw.image || raw.imageUrl || ''
  const rawStatus = raw.status
  const isActive =
    typeof rawStatus === 'boolean'
      ? rawStatus
      : typeof rawStatus === 'string'
      ? rawStatus.toLowerCase() === 'active'
      : Boolean(raw.isActive)

  const statusStr = typeof rawStatus === 'string' ? rawStatus : (isActive ? 'active' : 'inactive')

  return {
    id,
    _id: raw._id || id,
    title: name,
    name,
    description,
    imageUrl: imagePath,
    image: imagePath,
    placement: raw.placement || 'home_top',
    isActive,
    status: statusStr,
    isDeleted: raw.isDeleted,
    startsAt: raw.startsAt || raw.createdAt || new Date().toISOString(),
    endsAt: raw.endsAt || raw.updatedAt || new Date().toISOString(),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export function mapBackendFaqToFaq(raw: any): Faq {
  if (!raw) return raw
  const id = String(raw._id || raw.id || '')
  return {
    id,
    _id: raw._id || id,
    question: raw.question || '',
    answer: raw.answer || '',
    category: raw.category || 'General',
    order: typeof raw.order === 'number' ? raw.order : 0,
    isPublished: raw.isPublished !== false,
    isDeleted: Boolean(raw.isDeleted),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

const RULE_TITLE_MAP: Record<string, string> = {
  about: 'About Us',
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
  guidelines: 'Community Guidelines',
}

export function mapBackendRuleToContentPage(raw: any, defaultType?: string): ContentPage {
  const rawObj = Array.isArray(raw?.data) ? raw.data[0] : raw?.data || raw || {}
  const type = rawObj.type || defaultType || 'about'
  const id = String(rawObj._id || rawObj.id || type)

  return {
    id,
    _id: rawObj._id || id,
    type,
    title: RULE_TITLE_MAP[type] || (type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Page'),
    content: rawObj.content || '',
    status: 'published',
    updatedAt: rawObj.updatedAt || rawObj.createdAt || new Date().toISOString(),
  }
}

export type FaqInput = {
  question: string
  answer: string
  category?: string
  order?: number
  isPublished?: boolean
}

export const cmsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /* Banners */
    getBanners: builder.query<Banner[], void>({
      query: () => ({ url: '/banners/all', method: 'GET' }),
      transformResponse: (response: any): Banner[] => {
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []
        return list.map(mapBackendBannerToBanner)
      },
      providesTags: ['Banner'],
    }),

    toggleBanner: builder.mutation<Banner, { id: ID; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/banners/status/${id}`,
        method: 'PATCH',
        body: { status: isActive ? 'active' : 'inactive' },
      }),
      transformResponse: (response: any) => mapBackendBannerToBanner(response?.data || response),
      async onQueryStarted({ id, isActive }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cmsApi.util.updateQueryData('getBanners', undefined, (draft) => {
            const banner = draft.find((b) => b.id === id || b._id === id)
            if (banner) {
              banner.isActive = isActive
              banner.status = isActive ? 'active' : 'inactive'
            }
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ['Banner'],
    }),

    createBanner: builder.mutation<Banner, BannerInput>({
      query: (body) => {
        const formData = new FormData()
        formData.append(
          'data',
          JSON.stringify({
            name: body.name || body.title || '',
            description: body.description || '',
          }),
        )
        if (body.imageFile) {
          formData.append('image', body.imageFile)
        }
        return {
          url: '/banners',
          method: 'POST',
          body: formData,
        }
      },
      transformResponse: (response: any) => mapBackendBannerToBanner(response?.data || response),
      invalidatesTags: ['Banner'],
    }),

    updateBanner: builder.mutation<Banner, { id: ID } & Partial<BannerInput>>({
      query: ({ id, ...body }) => {
        const formData = new FormData()
        formData.append(
          'data',
          JSON.stringify({
            name: body.name || body.title || '',
            description: body.description || '',
          }),
        )
        if (body.imageFile) {
          formData.append('image', body.imageFile)
        }
        return {
          url: `/banners/${id}`,
          method: 'PATCH',
          body: formData,
        }
      },
      transformResponse: (response: any) => mapBackendBannerToBanner(response?.data || response),
      invalidatesTags: ['Banner'],
    }),

    deleteBanner: builder.mutation<{ id: ID }, ID>({
      query: (id) => ({ url: `/banners/${id}`, method: 'DELETE' }),
      transformResponse: (_response: any, _meta: any, id: ID) => ({ id }),
      invalidatesTags: ['Banner'],
    }),

    /* Content pages / Rules */
    getContentPages: builder.query<ContentPage[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBaseQuery) {
        const types = ['about', 'terms', 'privacy', 'guidelines']
        try {
          const results = await Promise.all(
            types.map(async (type) => {
              const res = await fetchWithBaseQuery({ url: `/rules/${type}`, method: 'GET' })
              if (res.error) {
                return mapBackendRuleToContentPage(null, type)
              }
              return mapBackendRuleToContentPage(res.data, type)
            }),
          )
          return { data: results }
        } catch {
          return { data: types.map((t) => mapBackendRuleToContentPage(null, t)) }
        }
      },
      providesTags: ['ContentPage'],
    }),

    getRuleByType: builder.query<ContentPage, string>({
      query: (type) => ({ url: `/rules/${type}`, method: 'GET' }),
      transformResponse: (response: any, _meta: any, type: string): ContentPage =>
        mapBackendRuleToContentPage(response, type),
      providesTags: (_res, _err, type) => [{ type: 'ContentPage', id: type }],
    }),

    updateContentPage: builder.mutation<ContentPage, UpdateContentPageRequest>({
      query: (body) => ({
        url: '/rules',
        method: 'POST',
        body: {
          content: body.content,
          type: body.type,
        },
      }),
      transformResponse: (response: any, _meta: any, arg: UpdateContentPageRequest) =>
        mapBackendRuleToContentPage(response, arg.type),
      invalidatesTags: ['ContentPage'],
    }),

    /* FAQs */
    getFaqs: builder.query<Faq[], void>({
      query: () => ({ url: '/faqs', method: 'GET' }),
      transformResponse: (response: any): Faq[] => {
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : []
        return list.map(mapBackendFaqToFaq)
      },
      providesTags: ['Faq'],
    }),

    toggleFaq: builder.mutation<Faq, { id: ID; isPublished: boolean }>({
      query: ({ id, isPublished }) => ({ url: `/faqs/${id}`, method: 'PATCH', body: { isPublished } }),
      transformResponse: (response: any) => mapBackendFaqToFaq(response?.data || response),
      async onQueryStarted({ id, isPublished }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cmsApi.util.updateQueryData('getFaqs', undefined, (draft) => {
            const faq = draft.find((f) => f.id === id || f._id === id)
            if (faq) faq.isPublished = isPublished
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ['Faq'],
    }),

    createFaq: builder.mutation<Faq, FaqInput>({
      query: (body) => ({
        url: '/faqs',
        method: 'POST',
        body: {
          question: body.question,
          answer: body.answer,
        },
      }),
      transformResponse: (response: any) => mapBackendFaqToFaq(response?.data || response),
      invalidatesTags: ['Faq'],
    }),

    updateFaq: builder.mutation<Faq, { id: ID } & Partial<FaqInput>>({
      query: ({ id, ...body }) => ({
        url: `/faqs/${id}`,
        method: 'PATCH',
        body: {
          question: body.question,
          answer: body.answer,
        },
      }),
      transformResponse: (response: any) => mapBackendFaqToFaq(response?.data || response),
      invalidatesTags: ['Faq'],
    }),

    deleteFaq: builder.mutation<{ id: ID }, ID>({
      query: (id) => ({ url: `/faqs/${id}`, method: 'DELETE' }),
      transformResponse: (_response: any, _meta: any, id: ID) => ({ id }),
      invalidatesTags: ['Faq'],
    }),
  }),
})

export const {
  useGetBannersQuery,
  useToggleBannerMutation,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useGetContentPagesQuery,
  useGetRuleByTypeQuery,
  useUpdateContentPageMutation,
  useGetFaqsQuery,
  useToggleFaqMutation,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = cmsApi
