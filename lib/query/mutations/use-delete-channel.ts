'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteGroupChannel } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { DatabaseRoom, GroupView } from '@/lib/types/database'
import type { DeleteRoomResponse } from '@/lib/types/api'

interface DeleteChannelVariables {
  groupId: string
  roomId: string
}

export function useDeleteChannel() {
  const queryClient = useQueryClient()

  return useMutation<DeleteRoomResponse, Error, DeleteChannelVariables>({
    mutationFn: async ({ groupId, roomId }) =>
      deleteGroupChannel(groupId, roomId),
    onSuccess: (data, variables) => {
      if (!data.success) {
        return
      }

      queryClient.setQueryData<DatabaseRoom[]>(
        queryKeys.rooms.list(),
        (existingRooms) => {
          if (!existingRooms) {
            return []
          }

          return existingRooms.filter((room) => room.id !== variables.roomId)
        }
      )

      queryClient.setQueryData<GroupView | undefined>(
        queryKeys.groups.detail(variables.groupId),
        (existingGroup) => {
          if (!existingGroup) {
            return existingGroup
          }

          return {
            ...existingGroup,
            channels: existingGroup.channels.filter(
              (entry) => entry.room.id !== variables.roomId
            )
          }
        }
      )

      queryClient.setQueryData<GroupView[] | undefined>(
        queryKeys.groups.list(),
        (existingGroups) => {
          if (!existingGroups) {
            return existingGroups
          }

          return existingGroups.map((group) => {
            if (group.group.id !== variables.groupId) {
              return group
            }

            return {
              ...group,
              channels: group.channels.filter(
                (entry) => entry.room.id !== variables.roomId
              )
            }
          })
        }
      )

      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    }
  })
}
