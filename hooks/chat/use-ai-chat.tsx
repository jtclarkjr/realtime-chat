'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { streamAIMessage } from '@/lib/api/client'
import { useAIUsage } from '@/lib/query/queries'
import { queryKeys } from '@/lib/query/query-keys'
import { AI_USER_ID } from '@/lib/services/user/ai-user-setup'
import type { ChatMessage } from '@/lib/types/database'
import { useAIUsageLock } from './use-ai-usage-lock'

interface UseAIChatProps {
  roomId: string
  userId: string
  isConnected: boolean
  onStreamingMessage: (message: ChatMessage) => void
  onRemoveStreamingMessage?: (messageId: string) => void
  onCompleteMessage: (message: ChatMessage) => void
  initialAIEnabled?: boolean
  allowPrivateMessages?: boolean
  isAnonymous?: boolean
}

interface UseAIChatReturn {
  isAIEnabled: boolean
  setIsAIEnabled: (enabled: boolean) => void
  isAIPrivate: boolean
  setIsAIPrivate: (isPrivate: boolean) => void
  isAILoading: boolean
  isAILocked: boolean
  aiUsageNearLimitNotice?: string
  aiLockReason?: string
  sendAIMessage: (
    content: string,
    previousMessages: ChatMessage[],
    triggerMessageId?: string,
    fileContextId?: string
  ) => Promise<void>
  generateReplyDraft: (params: {
    previousMessages: ChatMessage[]
    targetMessage: {
      id: string
      content: string
    }
    customPrompt?: string
  }) => Promise<string>
}

interface StreamAIResponseOptions {
  content: string
  previousMessages: ChatMessage[]
  triggerMessageId?: string
  targetMessage?: {
    id: string
    content: string
  }
  customPrompt?: string
  fileContextId?: string
  draftOnly?: boolean
  onStart?: (messageId: string, user: ChatMessage['user']) => void
  onContent?: (fullContent: string, messageId: string) => void
  onComplete?: (payload: {
    fullContent: string
    messageId: string
    createdAt?: string
  }) => void
}

export function useAIChat({
  roomId,
  userId,
  isConnected,
  onStreamingMessage,
  onRemoveStreamingMessage,
  onCompleteMessage,
  initialAIEnabled = false,
  allowPrivateMessages = true,
  isAnonymous = false
}: UseAIChatProps): UseAIChatReturn {
  const queryClient = useQueryClient()
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(initialAIEnabled)
  const [isAIPrivate, setIsAIPrivate] = useState<boolean>(false)
  const [isAILoading, setIsAILoading] = useState<boolean>(false)
  const { data: aiUsage } = useAIUsage({ enabled: !isAnonymous })
  const { isAILocked, aiUsageNearLimitNotice, aiLockReason } = useAIUsageLock({
    aiUsage,
    isAnonymous
  })
  const effectiveAIEnabled = isAIEnabled && !isAILocked

  useEffect(() => {
    setIsAIEnabled(initialAIEnabled)
  }, [initialAIEnabled, roomId])

  useEffect(() => {
    if (!allowPrivateMessages) {
      setIsAIPrivate(false)
    }
  }, [allowPrivateMessages, roomId])

  const streamAIResponse = useCallback(
    async ({
      content,
      previousMessages = [],
      triggerMessageId,
      targetMessage,
      customPrompt,
      fileContextId,
      draftOnly = false,
      onStart,
      onContent,
      onComplete
    }: StreamAIResponseOptions): Promise<void> => {
      // Prepare context from previous messages
      const messageContext = previousMessages.map((msg) => ({
        content: msg.content,
        isAi: msg.isAI || false,
        userName: msg.user.name
      }))

      // Call AI streaming API
      const response = await streamAIMessage({
        roomId,
        userId,
        message: content.trim(),
        responseFormat: 'markdown',
        previousMessages: messageContext,
        isPrivate: allowPrivateMessages ? isAIPrivate : false,
        triggerMessageId,
        fileContextId,
        targetMessageId: targetMessage?.id,
        targetMessageContent: targetMessage?.content,
        customPrompt,
        draftOnly
      })

      if (!response.ok) {
        let errorMessage = 'Failed to get AI response'
        try {
          const errorData = (await response.json()) as {
            error?: string
            details?: {
              message?: string
            }
          }
          errorMessage =
            errorData.details?.message || errorData.error || errorMessage
        } catch {
          // Ignore parse failures and keep the generic message.
        }
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffered = ''

      const processDataLine = (line: string) => {
        if (!line.startsWith('data: ')) return

        const payload = line.slice(6).trim()
        if (!payload || payload === '[DONE]') return

        const data = JSON.parse(payload)

        if (data.type === 'start') {
          onStart?.(data.messageId, data.user)
        } else if (data.type === 'content') {
          onContent?.(data.fullContent, data.messageId)
        } else if (data.type === 'complete') {
          onComplete?.({
            fullContent: data.fullContent || '',
            messageId: data.messageId,
            createdAt: data.createdAt
          })
        } else if (data.type === 'error') {
          throw new Error(data.error)
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          buffered += decoder.decode()
          break
        }

        buffered += decoder.decode(value, { stream: true })
        const lines = buffered.split(/\r?\n/)
        buffered = lines.pop() || ''

        for (const line of lines) {
          processDataLine(line)
        }
      }

      if (buffered.trim()) {
        processDataLine(buffered)
      }
    },
    [allowPrivateMessages, isAIPrivate, roomId, userId]
  )

  const sendAIMessage = useCallback(
    async (
      content: string,
      previousMessages: ChatMessage[] = [],
      triggerMessageId?: string,
      fileContextId?: string
    ): Promise<void> => {
      if (!isConnected || !content.trim() || isAILoading || isAILocked) return

      setIsAILoading(true)
      let streamingMessage: ChatMessage | null = null

      try {
        // Ensure we're connected before starting AI response
        if (!isConnected) {
          throw new Error('Not connected to chat')
        }

        // Show an optimistic typing placeholder immediately while waiting for SSE start event.
        const optimisticStreamingId = `ai-stream-local-${crypto.randomUUID()}`
        streamingMessage = {
          id: optimisticStreamingId,
          content: '',
          user: {
            id: AI_USER_ID || 'ai-assistant',
            name: 'AI Assistant'
          },
          createdAt: new Date().toISOString(),
          roomId,
          isAI: true,
          isStreaming: true,
          isPrivate: allowPrivateMessages ? isAIPrivate : false,
          requesterId: userId
        }
        onStreamingMessage(streamingMessage)

        await streamAIResponse({
          content,
          previousMessages,
          triggerMessageId,
          fileContextId,
          onStart: (messageId, user) => {
            if (!streamingMessage) return

            if (streamingMessage.id !== messageId) {
              onRemoveStreamingMessage?.(streamingMessage.id)
            }

            // Initialize streaming message with server's database ID
            streamingMessage = {
              id: messageId,
              content: '',
              user,
              createdAt: new Date().toISOString(),
              roomId,
              isAI: true,
              isStreaming: true,
              isPrivate: allowPrivateMessages ? isAIPrivate : false,
              requesterId: userId
            }
            onStreamingMessage(streamingMessage)
          },
          onContent: (fullContent, messageId) => {
            if (!streamingMessage) return

            if (streamingMessage.id !== messageId) {
              onRemoveStreamingMessage?.(streamingMessage.id)
            }

            streamingMessage = {
              id: messageId,
              user: streamingMessage.user,
              createdAt: streamingMessage.createdAt,
              roomId: streamingMessage.roomId,
              isAI: streamingMessage.isAI,
              isStreaming: streamingMessage.isStreaming,
              isPrivate: streamingMessage.isPrivate,
              requesterId: streamingMessage.requesterId,
              content: fullContent
            }
            onStreamingMessage(streamingMessage)
          },
          onComplete: ({ fullContent, messageId, createdAt }) => {
            if (!streamingMessage) return

            if (streamingMessage.id !== messageId) {
              onRemoveStreamingMessage?.(streamingMessage.id)
            }

            const finalMessage: ChatMessage = {
              id: messageId,
              user: streamingMessage.user,
              roomId: streamingMessage.roomId,
              isAI: streamingMessage.isAI,
              isPrivate: streamingMessage.isPrivate,
              requesterId: streamingMessage.requesterId,
              content: fullContent,
              createdAt: createdAt || streamingMessage.createdAt,
              isStreaming: false
            }
            onCompleteMessage(finalMessage)
            streamingMessage = null
          }
        })
      } catch (error) {
        console.error('Error calling AI streaming API:', error)
        if (streamingMessage) {
          onRemoveStreamingMessage?.(streamingMessage.id)
        }

        // Show error message in chat
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          content:
            error instanceof Error
              ? error.message
              : 'Sorry, I encountered an error. Please try again.',
          user: {
            id: 'ai-assistant',
            name: 'AI Assistant'
          },
          createdAt: new Date().toISOString(),
          roomId,
          isAI: true
        }
        onCompleteMessage(errorMessage)
      } finally {
        setIsAILoading(false)
        void queryClient.invalidateQueries({ queryKey: queryKeys.ai.usage() })
      }
    },
    [
      allowPrivateMessages,
      isConnected,
      isAILocked,
      roomId,
      userId,
      isAILoading,
      isAIPrivate,
      onStreamingMessage,
      onRemoveStreamingMessage,
      onCompleteMessage,
      queryClient,
      streamAIResponse
    ]
  )

  const generateReplyDraft = useCallback(
    async ({
      previousMessages = [],
      targetMessage,
      customPrompt
    }: {
      previousMessages: ChatMessage[]
      targetMessage: {
        id: string
        content: string
      }
      customPrompt?: string
    }): Promise<string> => {
      if (isAILocked) {
        throw new Error(
          aiLockReason || 'AI assistant usage is locked until reset.'
        )
      }

      if (!isConnected || isAILoading) {
        throw new Error('AI is not available right now')
      }

      const trimmedTargetContent = targetMessage.content.trim()
      if (!trimmedTargetContent) {
        throw new Error('Target message is empty')
      }

      setIsAILoading(true)

      try {
        let generatedText = ''

        await streamAIResponse({
          content:
            customPrompt?.trim() || 'Write a direct reply to this message.',
          previousMessages,
          targetMessage: {
            id: targetMessage.id,
            content: trimmedTargetContent
          },
          customPrompt: customPrompt?.trim() || undefined,
          draftOnly: true,
          onContent: (fullContent) => {
            generatedText = fullContent
          },
          onComplete: ({ fullContent }) => {
            generatedText = fullContent
          }
        })

        const trimmed = generatedText.trim()
        if (!trimmed) {
          throw new Error('No AI reply generated')
        }

        return trimmed
      } finally {
        setIsAILoading(false)
        void queryClient.invalidateQueries({ queryKey: queryKeys.ai.usage() })
      }
    },
    [
      aiLockReason,
      isAILocked,
      isConnected,
      isAILoading,
      queryClient,
      streamAIResponse
    ]
  )

  return {
    isAIEnabled: effectiveAIEnabled,
    setIsAIEnabled,
    isAIPrivate,
    setIsAIPrivate,
    isAILoading,
    isAILocked,
    aiUsageNearLimitNotice,
    aiLockReason,
    sendAIMessage,
    generateReplyDraft
  }
}
