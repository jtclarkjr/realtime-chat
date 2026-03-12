'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteGroup } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { DeleteGroupResponse } from '@/lib/types/api'

export function useDeleteGroup() {
  const queryClient = useQueryClient()

  return useMutation<DeleteGroupResponse, Error, { groupId: string }>({
    mutationFn: async ({ groupId }) => deleteGroup(groupId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
    }
  })
}
