'use client'

import { useQuery } from '@tanstack/react-query'
import { getRoomMembers } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { RoomMemberEntry } from '@/lib/types/database'

interface UseRoomMembersOptions {
  groupId: string
  roomId: string
  enabled?: boolean
  initialData?: RoomMemberEntry[]
}

export function useRoomMembers({
  groupId,
  roomId,
  enabled = true,
  initialData
}: UseRoomMembersOptions) {
  return useQuery({
    queryKey: queryKeys.groups.roomMembers(roomId),
    queryFn: async () => {
      const response = await getRoomMembers(groupId, roomId)
      return response.members
    },
    enabled: enabled && !!groupId && !!roomId,
    initialData,
    staleTime: 30 * 1000
  })
}
