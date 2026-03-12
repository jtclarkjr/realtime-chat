'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startPersonalChat } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type {
  StartPersonalChatRequest,
  StartPersonalChatResponse
} from '@/lib/types/api'
import { useUIStore } from '@/lib/stores/ui-store'

export function useStartPersonalChat() {
  const queryClient = useQueryClient()

  return useMutation<
    StartPersonalChatResponse,
    Error,
    StartPersonalChatRequest
  >({
    mutationFn: startPersonalChat,
    onSuccess: (data, variables) => {
      if (!data.success || !data.chat) return
      if (data.chat.ai_enabled && data.message && !variables.deferAiResponse) {
        useUIStore.getState().setPendingPersonalAI(data.chat.id, {
          content: data.message.content,
          triggerMessageId: data.message.id
        })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.personalChats.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
      queryClient.setQueryData(
        queryKeys.personalChats.detail(data.chat.id),
        data.chat
      )
    }
  })
}
