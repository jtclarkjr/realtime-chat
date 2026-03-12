import {
  getRooms,
  createRoom as createRoomInDB,
  getRoomById as getRoomByIdFromDB,
  deleteRoom as deleteRoomFromDB
} from '@/lib/supabase/db/rooms'
import type { DatabaseRoom, DatabaseRoomInsert } from '@/lib/types/database'
import {
  getRedisClient,
  CACHE_KEYS,
  CACHE_TTL,
  CACHE_SETTINGS,
  getCacheConfig
} from '@/lib/redis'

interface CachedRooms {
  rooms: DatabaseRoom[]
  timestamp: number
}

interface CachedRoom {
  room: DatabaseRoom
  timestamp: number
}

export class RoomCacheService {
  private redis = getRedisClient()
  private config = getCacheConfig()

  /**
   * Validate and safely stringify data for Redis storage
   */
  private safeStringify(data: unknown): string {
    try {
      const stringified = JSON.stringify(data)
      // Validate that it's actually a valid JSON string and not "[object Object]"
      if (stringified === '[object Object]' || stringified === undefined) {
        throw new Error('Invalid serialization result')
      }
      return stringified
    } catch (error) {
      console.error('Error stringifying data for cache:', error)
      console.error('Data that failed to stringify:', data)
      throw new Error('Failed to stringify data for cache', { cause: error })
    }
  }

  /**
   * Get all rooms with Redis caching and database fallback
   */
  async getAllRooms(): Promise<DatabaseRoom[]> {
    try {
      // Try to get from cache first
      const cachedData = await this.redis.get(CACHE_KEYS.ROOMS_ALL)

      if (cachedData) {
        // Check for corrupted cache data
        if (typeof cachedData === 'object') {
          console.warn(
            'All rooms cached data is already an object, clearing cache'
          )
          await this.redis.del(CACHE_KEYS.ROOMS_ALL)
        } else if (cachedData === '[object Object]') {
          console.warn(
            "Corrupted all rooms cache data: '[object Object]', clearing cache"
          )
          await this.redis.del(CACHE_KEYS.ROOMS_ALL)
        } else {
          try {
            const parsed: CachedRooms = JSON.parse(cachedData)
            const cacheAge = Date.now() - parsed.timestamp

            // Return cached data if it's fresh enough
            if (cacheAge < CACHE_SETTINGS.SYNC_THRESHOLD) {
              return parsed.rooms
            }

            // If cache is stale but exists, return it and refresh in background
            const ttl = this.config.ttlMultiplier * CACHE_TTL.ROOMS_ALL * 1000
            if (cacheAge < ttl && this.config.backgroundRefreshEnabled) {
              this.refreshRoomsCache().catch(console.error)
              return parsed.rooms
            }
          } catch (parseError) {
            console.error(
              'JSON parse error for all rooms, cached data:',
              cachedData
            )
            console.error('Parse error:', parseError)
            // Clear the corrupted cache entry
            await this.redis.del(CACHE_KEYS.ROOMS_ALL)
          }
        }
      }

      // Cache miss or expired - fetch from database
      return await this.refreshRoomsCache()
    } catch (error) {
      console.error('Error in getAllRooms cache service:', error)
      // Fallback to direct database query
      return await getRooms()
    }
  }

  /**
   * Get a specific room by ID with caching
   */
  async getRoomById(id: string): Promise<DatabaseRoom | null> {
    try {
      const cacheKey = CACHE_KEYS.ROOM_BY_ID(id)
      const cachedData = await this.redis.get(cacheKey)

      if (cachedData) {
        // Check if cachedData is already an object (shouldn't happen with Redis)
        if (typeof cachedData === 'object') {
          console.warn(
            `Cached data for room ${id} is already an object, clearing cache`
          )
          await this.redis.del(cacheKey)
        } else if (cachedData === '[object Object]') {
          console.warn(
            `Corrupted cache data for room ${id}: '[object Object]', clearing cache`
          )
          await this.redis.del(cacheKey)
        } else {
          try {
            const parsed: CachedRoom = JSON.parse(cachedData)
            const cacheAge = Date.now() - parsed.timestamp

            const ttl =
              this.config.ttlMultiplier * CACHE_TTL.ROOM_INDIVIDUAL * 1000
            if (cacheAge < ttl) {
              return parsed.room
            }
          } catch (parseError) {
            console.error(
              `JSON parse error for room ${id}, cached data:`,
              cachedData
            )
            console.error('Parse error:', parseError)
            // Clear the corrupted cache entry
            await this.redis.del(cacheKey)
          }
        }
      }

      // Cache miss or expired - fetch from database
      const room = await getRoomByIdFromDB(id)

      if (room) {
        // Cache the individual room
        const cacheData: CachedRoom = {
          room,
          timestamp: Date.now()
        }
        const ttl = Math.round(
          this.config.ttlMultiplier * CACHE_TTL.ROOM_INDIVIDUAL
        )
        await this.redis.set(cacheKey, this.safeStringify(cacheData), 'EX', ttl)
      }

      return room
    } catch (error) {
      console.error('Error in getRoomById cache service:', error)
      // Fallback to direct database query
      return await getRoomByIdFromDB(id)
    }
  }

  /**
   * Create a new room and update cache
   */
  async createRoom(roomData: DatabaseRoomInsert): Promise<DatabaseRoom> {
    try {
      // Create room in database
      const newRoom = await createRoomInDB(roomData)

      // Invalidate the all rooms cache
      await this.invalidateRoomsCache()

      // Cache the individual room
      const cacheData: CachedRoom = {
        room: newRoom,
        timestamp: Date.now()
      }
      const ttl = Math.round(
        this.config.ttlMultiplier * CACHE_TTL.ROOM_INDIVIDUAL
      )
      await this.redis.set(
        CACHE_KEYS.ROOM_BY_ID(newRoom.id),
        this.safeStringify(cacheData),
        'EX',
        ttl
      )

      return newRoom
    } catch (error) {
      console.error('Error in createRoom cache service:', error)
      throw error
    }
  }

  /**
   * Refresh the rooms cache from database
   */
  private async refreshRoomsCache(): Promise<DatabaseRoom[]> {
    try {
      const rooms = await getRooms()

      const cacheData: CachedRooms = {
        rooms,
        timestamp: Date.now()
      }

      const ttl = Math.round(this.config.ttlMultiplier * CACHE_TTL.ROOMS_ALL)
      await this.redis.set(
        CACHE_KEYS.ROOMS_ALL,
        this.safeStringify(cacheData),
        'EX',
        ttl
      )

      // Update last sync timestamp
      await this.redis.set(CACHE_KEYS.ROOM_LAST_SYNC, Date.now().toString())

      return rooms
    } catch (error) {
      console.error('Error refreshing rooms cache:', error)
      throw error
    }
  }

  /**
   * Invalidate all room-related caches
   */
  async invalidateRoomsCache(): Promise<void> {
    try {
      await this.redis.del(CACHE_KEYS.ROOMS_ALL)

      // Also remove last sync timestamp to force refresh
      await this.redis.del(CACHE_KEYS.ROOM_LAST_SYNC)
    } catch (error) {
      console.error('Error invalidating rooms cache:', error)
    }
  }

  /**
   * Invalidate a specific room's cache
   */
  async invalidateRoomCache(roomId: string): Promise<void> {
    try {
      await this.redis.del(CACHE_KEYS.ROOM_BY_ID(roomId))
      // Also invalidate the all rooms cache since it contains this room
      await this.invalidateRoomsCache()
    } catch (error) {
      console.error('Error invalidating room cache:', error)
    }
  }

  /**
   * Warm the cache by pre-loading rooms
   */
  async warmCache(): Promise<void> {
    try {
      await this.refreshRoomsCache()
    } catch (error) {
      console.error('Error warming cache:', error)
    }
  }

  /**
   * Check if cache needs reconciliation with database
   */
  async needsReconciliation(): Promise<boolean> {
    try {
      const lastSync = await this.redis.get(CACHE_KEYS.ROOM_LAST_SYNC)
      if (!lastSync) return true

      const lastSyncTime = parseInt(lastSync)
      const timeSinceSync = Date.now() - lastSyncTime

      return timeSinceSync > CACHE_SETTINGS.SYNC_THRESHOLD
    } catch (error) {
      console.error('Error checking reconciliation need:', error)
      return true
    }
  }

  /**
   * Delete a room and update cache
   */
  async deleteRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      // Delete room from database with explicit owner enforcement.
      const success = await deleteRoomFromDB(roomId, userId)

      if (success) {
        // Invalidate all room caches
        await this.invalidateRoomCache(roomId)

        // Also invalidate any message cache for this room
        // This ensures Redis doesn't have stale message data
        // Note: We'll try to delete specific known keys instead of using pattern matching
        // since some Redis clients may not support the keys() method
        try {
          // Delete known cache keys for this room
          const keysToDelete = [
            `chat:latest_message:${roomId}`
            // Add other specific keys as needed
          ]

          for (const key of keysToDelete) {
            await this.redis.del(key)
          }
        } catch (keyError) {
          console.warn('Could not clean up message cache keys:', keyError)
          // Continue with room deletion even if cache cleanup fails
        }
      }

      return success
    } catch (error) {
      console.error('Error in deleteRoom cache service:', error)
      throw error
    }
  }

  /**
   * Force reconciliation with database
   */
  async reconcileWithDatabase(): Promise<void> {
    try {
      // Force refresh from database
      await this.refreshRoomsCache()
    } catch (error) {
      console.error('Error during reconciliation:', error)
      throw error
    }
  }
}

// Export singleton instance
export const roomCacheService = new RoomCacheService()
