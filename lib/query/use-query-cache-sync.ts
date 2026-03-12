'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { queryKeys } from './query-keys'
import type { DatabaseRoom } from '@/lib/types/database'

export function useQueryCacheSync() {
  const queryClient = useQueryClient()

  const invalidateRooms = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.personalChats.all })
  }, [queryClient])

  const invalidateMissedMessages = useCallback(
    (roomId: string, userId: string) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.missed(roomId, userId)
      })
    },
    [queryClient]
  )

  const updateRoomInCache = useCallback(
    (room: DatabaseRoom) => {
      queryClient.setQueryData<DatabaseRoom[]>(
        queryKeys.rooms.list(),
        (oldData) => {
          if (!oldData) return [room]
          const exists = oldData.some((r) => r.id === room.id)
          if (exists) {
            return oldData.map((r) => (r.id === room.id ? room : r))
          }
          return [...oldData, room]
        }
      )
    },
    [queryClient]
  )

  const removeRoomFromCache = useCallback(
    (roomId: string) => {
      queryClient.setQueryData<DatabaseRoom[]>(
        queryKeys.rooms.list(),
        (oldData) => {
          if (!oldData) return []
          return oldData.filter((r) => r.id !== roomId)
        }
      )
    },
    [queryClient]
  )

  return {
    invalidateRooms,
    invalidateMissedMessages,
    updateRoomInCache,
    removeRoomFromCache
  }
}
