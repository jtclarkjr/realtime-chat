'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGroup } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { CreateGroupRequest, CreateGroupResponse } from '@/lib/types/api'

export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation<CreateGroupResponse, Error, CreateGroupRequest>({
    mutationFn: createGroup,
    onSuccess: (data) => {
      if (!data.success) return
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
    }
  })
}
