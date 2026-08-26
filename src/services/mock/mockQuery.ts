import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { env } from '@/config/env'

type RealBaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>

/**
 * Builds an RTK Query `queryFn` that returns mock data while
 * `VITE_USE_MOCKS` is on, and transparently falls through to the real
 * HTTP request (`real`) once a backend is wired up. Swapping the whole
 * app to live data is a single env flag — no endpoint rewrites.
 */
export function endpoint<Arg, Res>(config: {
  mock: (arg: Arg) => Res
  real: (arg: Arg) => string | FetchArgs
  transformReal?: (data: any) => Res
}) {
  return async (
    arg: Arg,
    api: Parameters<RealBaseQuery>[1],
    extraOptions: Parameters<RealBaseQuery>[2],
    baseQuery: RealBaseQuery,
  ) => {
    if (env.useMocks) {
      try {
        // A small simulated latency keeps loading states realistic without feeling slow.
        await new Promise((r) => setTimeout(r, 90))
        // Deep-clone the result so RTK Query never freezes (and thus locks) the
        // underlying seed objects. Without this, a second write to the same seed
        // record throws — which is what broke "toggle off then on again".
        return { data: structuredClone(config.mock(arg)) }
      } catch (e) {
        return {
          error: { status: 400, data: (e as Error).message } as FetchBaseQueryError,
        }
      }
    }
    const result = await baseQuery(config.real(arg), api, extraOptions)
    if (result.error) {
      const errData = result.error.data as { message?: string } | string | undefined
      const errorMessage =
        typeof errData === 'string'
          ? errData
          : errData?.message || 'Request failed. Please try again.'
      return {
        error: {
          ...result.error,
          data: errorMessage,
        } as FetchBaseQueryError,
      }
    }
    if (result.data !== undefined) {
      const finalData = config.transformReal
        ? config.transformReal(result.data)
        : (result.data as Res)
      return { data: finalData }
    }
    return result as { data: Res } | { error: FetchBaseQueryError }
  }
}
