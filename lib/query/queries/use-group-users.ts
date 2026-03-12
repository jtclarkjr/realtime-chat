'use client'

import { useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchGroupUsers } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { UserDirectoryEntry } from '@/lib/types/database'

interface UseGroupUsersOptions {
  query: string
  limit?: number
  enabled?: boolean
  initialData?: UserDirectoryEntry[]
}

export function useGroupUsers({
  query,
  limit = 20,
  enabled = true,
  initialData
}: UseGroupUsersOptions) {
  const deferredQuery = useDeferredValue(query)

  return useQuery({
    queryKey: queryKeys.groups.users(deferredQuery.trim()),
    queryFn: async ({ signal }) => {
      const response = await searchGroupUsers(
        deferredQuery.trim(),
        limit,
        signal
      )
      return response.users
    },
    enabled: enabled && deferredQuery.trim().length > 0,
    initialData,
    staleTime: 30 * 1000
  })
}
