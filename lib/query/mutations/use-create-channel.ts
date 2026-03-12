'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroupChannel } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { CreateChannelResponse } from '@/lib/types/api'

interface CreateChannelVariables {
  groupId: string
  name: string
  description?: string
  visibility?: 'public' | 'private'
}

export function useCreateChannel() {
  const queryClient = useQueryClient()

  return useMutation<CreateChannelResponse, Error, CreateChannelVariables>({
    mutationFn: async ({ groupId, ...data }) =>
      createGroupChannel(groupId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(variables.groupId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
    }
  })
}
