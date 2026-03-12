'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query-keys'
import { getMissedMessages, transformApiMessage } from '@/lib/api/client'
import type { ChatMessage } from '@/lib/types/database'

interface UseMissedMessagesOptions {
  roomId: string
  userId: string
  enabled?: boolean
}

const mergeMessages = (
  existingMessages: ChatMessage[],
  incomingMessages: ChatMessage[]
): ChatMessage[] => {
  const merged = new Map<string, ChatMessage>()

  existingMessages.forEach((message) => {
    merged.set(message.id, message)
  })

  incomingMessages.forEach((incomingMessage) => {
    if (
      incomingMessage.clientMsgId &&
      merged.has(incomingMessage.clientMsgId)
    ) {
      const optimisticMatch = merged.get(incomingMessage.clientMsgId)
      if (optimisticMatch?.isOptimistic) {
        merged.delete(incomingMessage.clientMsgId)
      }
    }

    const existingMessage = merged.get(incomingMessage.id)
    if (!existingMessage) {
      merged.set(incomingMessage.id, incomingMessage)
      return
    }

    const incomingTime = new Date(incomingMessage.createdAt || 0).getTime()
    const existingTime = new Date(existingMessage.createdAt || 0).getTime()

    if (incomingTime >= existingTime) {
      merged.set(incomingMessage.id, {
        ...existingMessage,
        ...incomingMessage
      })
    }
  })

  return Array.from(merged.values()).toSorted(
    (a, b) =>
      new Date(a.createdAt || 0).getTime() -
      new Date(b.createdAt || 0).getTime()
  )
}

export function useMissedMessages({
  roomId,
  userId,
  enabled = true
}: UseMissedMessagesOptions) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.messages.missed(roomId, userId)

  return useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      try {
        const existingMessages =
          queryClient.getQueryData<ChatMessage[]>(queryKey) || []
        const data = await getMissedMessages(roomId, userId, signal)

        if (data.messages?.length > 0) {
          const incomingMessages = data.messages.map(transformApiMessage)
          return mergeMessages(existingMessages, incomingMessages)
        }

        // caught_up should not clear already loaded timeline for this session.
        return existingMessages
      } catch (error) {
        // Preserve last successful cache data if this request is aborted.
        if (error instanceof Error && error.name === 'AbortError') {
          throw error
        }
        throw error
      }
    },
    enabled: enabled && !!roomId && !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
    gcTime: 30 * 60 * 1000
  })
}
