'use client'

import { useQuery } from '@tanstack/react-query'
import { getPersonalChatById } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { PersonalChat } from '@/lib/types/database'

interface UsePersonalChatByIdOptions {
  chatId: string
  enabled?: boolean
  initialData?: PersonalChat
}

export function usePersonalChatById({
  chatId,
  enabled = true,
  initialData
}: UsePersonalChatByIdOptions) {
  return useQuery({
    queryKey: queryKeys.personalChats.detail(chatId),
    queryFn: async () => {
      const response = await getPersonalChatById(chatId)
      return response.chat
    },
    enabled: enabled && !!chatId,
    initialData,
    staleTime: 60 * 1000
  })
}
