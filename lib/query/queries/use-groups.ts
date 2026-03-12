'use client'

import { useQuery } from '@tanstack/react-query'
import { getGroups } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { GroupView } from '@/lib/types/database'

interface UseGroupsOptions {
  enabled?: boolean
  initialData?: GroupView[]
}

export function useGroups({
  enabled = true,
  initialData
}: UseGroupsOptions = {}) {
  return useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: async () => {
      const response = await getGroups()
      return response.groups
    },
    enabled,
    initialData,
    staleTime: 60 * 1000
  })
}
