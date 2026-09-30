import { z } from 'zod'

/**
 * Zod-validated environment variables.
 * Fails fast at startup if a required env var is missing or malformed.
 */
const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('Julio Admin'),
  VITE_API_URL: z.string().url().default('http://localhost:4000/api'),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional().default(''),
  VITE_USE_MOCKS: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment configuration. Check your .env file.')
}

export const env = {
  appName: parsed.data.VITE_APP_NAME,
  apiUrl: parsed.data.VITE_API_URL,
  googleMapsApiKey: parsed.data.VITE_GOOGLE_MAPS_API_KEY,
  useMocks: parsed.data.VITE_USE_MOCKS,
} as const
