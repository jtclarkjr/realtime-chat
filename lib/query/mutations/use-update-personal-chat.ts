'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deletePersonalChat, updatePersonalChat } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type {
  PersonalChatResponse,
  UpdatePersonalChatRequest
} from '@/lib/types/api'

export function useUpdatePersonalChat() {
  const queryClient = useQueryClient()

  return useMutation<
    PersonalChatResponse,
    Error,
    { chatId: string; data: UpdatePersonalChatRequest }
  >({
    mutationFn: ({ chatId, data }) => updatePersonalChat(chatId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        queryKeys.personalChats.detail(variables.chatId),
        data.chat
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.personalChats.all })
      queryClient.invalidateQueries({
        queryKey: queryKeys.rooms.detail(variables.chatId)
      })
    }
  })
}

export function useDeletePersonalChat() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean }, Error, { chatId: string }>({
    mutationFn: ({ chatId }) => deletePersonalChat(chatId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personalChats.all })
      queryClient.removeQueries({
        queryKey: queryKeys.personalChats.detail(variables.chatId)
      })
      queryClient.removeQueries({
        queryKey: queryKeys.rooms.detail(variables.chatId)
      })
    }
  })
}
