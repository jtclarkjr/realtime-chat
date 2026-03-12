'use client'

import { useQuery } from '@tanstack/react-query'
import { getGroupById } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { GroupView } from '@/lib/types/database'

interface UseGroupByIdOptions {
  groupId: string
  enabled?: boolean
  initialData?: GroupView
}

export function useGroupById({
  groupId,
  enabled = true,
  initialData
}: UseGroupByIdOptions) {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: async () => {
      const response = await getGroupById(groupId)
      return response.group
    },
    enabled: enabled && !!groupId,
    initialData,
    staleTime: 60 * 1000
  })
}
