'use client'

import { useQuery } from '@tanstack/react-query'
import { getPersonalChats } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { PersonalChat } from '@/lib/types/database'

interface UsePersonalChatsOptions {
  q?: string
  limit?: number
  offset?: number
  enabled?: boolean
  initialData?: PersonalChat[]
}

export function usePersonalChats({
  q = '',
  limit = 50,
  offset = 0,
  enabled = true,
  initialData
}: UsePersonalChatsOptions = {}) {
  return useQuery({
    queryKey: queryKeys.personalChats.list(q, limit, offset),
    queryFn: async ({ signal }) => {
      const response = await getPersonalChats({
        q,
        limit,
        offset,
        signal
      })
      return response.chats
    },
    enabled,
    initialData,
    staleTime: 60 * 1000
  })
}
