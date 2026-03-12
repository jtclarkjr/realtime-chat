import Redis from 'ioredis'
import { Redis as UpstashRedis } from '@upstash/redis'
import { RedisLike } from './types'
import { hasUpstashConfig, REDIS_CONFIG } from './constants'

let ioredisClient: Redis | null = null
let redisDisabled = false
let redisDisableLogged = false
// Upstash client is created fresh for each adapter instance

function logRedisDisabled(error: unknown): void {
  if (redisDisableLogged) {
    return
  }

  redisDisableLogged = true
  console.warn('Redis unavailable, falling back to database-only mode:', error)
}

function disableRedis(error: unknown): void {
  redisDisabled = true
  logRedisDisabled(error)

  if (ioredisClient) {
    try {
      ioredisClient.disconnect()
    } catch (disconnectError) {
      console.warn(
        'Failed to disconnect Redis client cleanly:',
        disconnectError
      )
    }
    ioredisClient = null
  }
}

class NoopRedisAdapter implements RedisLike {
  async get(): Promise<string | null> {
    return null
  }

  async set(): Promise<string | null> {
    return 'OK'
  }

  async del(): Promise<number> {
    return 0
  }
}

const noopRedisAdapter = new NoopRedisAdapter()

class UpstashRedisAdapter implements RedisLike {
  private client: UpstashRedis

  constructor() {
    this.client = UpstashRedis.fromEnv()
  }

  async get(key: string): Promise<string | null> {
    const result = await this.client.get(key)
    // Upstash Redis automatically deserializes JSON, but we need strings
    // to maintain compatibility with our cache service
    if (result === null || result === undefined) {
      return null
    }
    // If it's already a string, return it as-is
    if (typeof result === 'string') {
      return result
    }
    // If it's an object, serialize it back to a string
    return JSON.stringify(result)
  }

  async set(
    key: string,
    value: string,
    mode?: string,
    duration?: number
  ): Promise<string | null> {
    if (mode === 'EX' && duration) {
      await this.client.setex(key, duration, value)
    } else {
      await this.client.set(key, value)
    }
    return 'OK'
  }

  async del(...keys: string[]): Promise<number> {
    return await this.client.del(...keys)
  }
}

class IoredisAdapter implements RedisLike {
  private client: Redis

  constructor(client: Redis) {
    this.client = client
  }

  private async execute<T>(
    fallback: T,
    operation: () => Promise<T>
  ): Promise<T> {
    if (redisDisabled) {
      return fallback
    }

    try {
      if (this.client.status === 'wait') {
        await this.client.connect()
      }

      return await operation()
    } catch (error) {
      disableRedis(error)
      return fallback
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.execute(null, () => this.client.get(key))
  }

  async set(
    key: string,
    value: string,
    mode?: string,
    duration?: number
  ): Promise<string | null> {
    return await this.execute('OK', async () => {
      if (mode === 'EX' && duration) {
        await this.client.setex(key, duration, value)
      } else {
        await this.client.set(key, value)
      }
      return 'OK'
    })
  }

  async del(...keys: string[]): Promise<number> {
    return await this.execute(0, () => this.client.del(...keys))
  }

  async quit(): Promise<void> {
    await this.client.quit()
  }
}

export function getRedisClient(): RedisLike {
  // Use Upstash Redis in production or when Upstash config is available
  if (hasUpstashConfig) {
    return new UpstashRedisAdapter()
  }

  if (redisDisabled) {
    return noopRedisAdapter
  }

  // Use ioredis for local development
  if (!ioredisClient) {
    ioredisClient = new Redis(REDIS_CONFIG.url, {
      maxRetriesPerRequest: REDIS_CONFIG.maxRetriesPerRequest,
      enableReadyCheck: REDIS_CONFIG.enableReadyCheck,
      lazyConnect: REDIS_CONFIG.lazyConnect,
      enableOfflineQueue: REDIS_CONFIG.enableOfflineQueue,
      connectTimeout: REDIS_CONFIG.connectTimeout
    })

    ioredisClient.on('error', (error) => {
      disableRedis(error)
    })

    ioredisClient.on('connect', () => {
      console.log('Connected to Redis')
    })
  }

  return new IoredisAdapter(ioredisClient)
}

export async function disconnectRedis(): Promise<void> {
  if (ioredisClient) {
    await ioredisClient.quit()
    ioredisClient = null
  }
  redisDisabled = false
  redisDisableLogged = false
  // Upstash client doesn't need explicit disconnection
}
