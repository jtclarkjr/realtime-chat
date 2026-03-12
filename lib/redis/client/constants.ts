/**
 * Check if we're running with Upstash/Vercel KV configuration
 */
export const hasUpstashConfig = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
)

/**
 * Default Redis connection configuration for local development
 */
export const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  lazyConnect: true,
  enableOfflineQueue: false,
  connectTimeout: 250
} as const
