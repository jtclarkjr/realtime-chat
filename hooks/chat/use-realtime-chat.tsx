'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { markMessageAsReceived } from '@/lib/api/client'
import type { ChatMessage } from '@/lib/types/database'
import type { AIStreamRealtimePayload } from '@/lib/types/ai-stream'
import type { PresenceState } from '@/lib/types/presence'
import { useNetworkConnectivity, useWebSocketConnection } from '../connection'
import { useMissedMessages, useOptimisticMessageSender } from '../messages'

interface UseRealtimeChatProps {
  roomId: string
  username: string
  userId: string
  userAvatarUrl?: string
  onAIStreamingMessage?: (message: ChatMessage) => void
  onAIStreamTerminated?: (streamId: string) => void
  onAIBroadcastReceived?: (message: ChatMessage) => void
}

const roomTimelineSessionCache = new Map<string, ChatMessage[]>()

export function useRealtimeChat({
  roomId,
  username,
  userId,
  userAvatarUrl,
  onAIStreamingMessage,
  onAIStreamTerminated,
  onAIBroadcastReceived
}: UseRealtimeChatProps) {
  const cacheKey = `${userId}:${roomId}`
  const cachedTimeline = useMemo(
    () => roomTimelineSessionCache.get(cacheKey) || [],
    [cacheKey]
  )
  const [confirmedMessages, setConfirmedMessages] = useState<ChatMessage[]>([])
  const [deletedMessageIds, setDeletedMessageIds] = useState<Set<string>>(
    new Set()
  )
  const [presenceUsers, setPresenceUsers] = useState<PresenceState>({})

  // Network connectivity detection
  const networkState = useNetworkConnectivity()
  const isConnected = networkState.isOnline

  // Fetch missed messages on mount
  const { messages: missedMessages, loading: missedMessagesLoading } =
    useMissedMessages({
      roomId,
      userId,
      enabled: true
    })

  // Handle incoming real-time messages (broadcast messages)
  const handleIncomingMessage = useCallback(
    (receivedMessage: ChatMessage): void => {
      // Clean message states (broadcast = confirmed sent)
      const cleanedMessage = {
        ...receivedMessage,
        isPending: false,
        isQueued: false,
        isRetrying: false,
        isFailed: false,
        isOptimistic: false
      }

      // Add to confirmed messages - useOptimistic will handle deduplication automatically
      setConfirmedMessages((current) => {
        // Check if message already exists to avoid duplicates
        const existingIndex = current.findIndex(
          (msg) => msg.id === receivedMessage.id
        )
        if (existingIndex >= 0) {
          // Update existing message
          return current.map((msg, index) =>
            index === existingIndex ? cleanedMessage : msg
          )
        }
        return [...current, cleanedMessage]
      })

      // When a confirmed AI broadcast arrives, notify so the requester's
      // streaming entry can be cleaned up (ensures identical render path).
      if (receivedMessage.isAI) {
        onAIBroadcastReceived?.(receivedMessage)
      }

      // Mark message as received (async, don't wait)
      markMessageAsReceived({
        userId,
        roomId,
        messageId: receivedMessage.id
      }).catch((error) =>
        console.error('Error marking message as received:', error)
      )
    },
    [roomId, userId, onAIBroadcastReceived]
  )

  // Handle unsent message events
  const handleMessageUnsent = useCallback((messageId: string): void => {
    // Track deleted message IDs globally
    setDeletedMessageIds((prev) => new Set(prev).add(messageId))

    // Update confirmed messages - check both id and serverId
    setConfirmedMessages((current) =>
      current.map((msg) =>
        msg.id === messageId || msg.serverId === messageId
          ? { ...msg, isDeleted: true }
          : msg
      )
    )
  }, [])

  // Handle presence sync events
  const handlePresenceSync = useCallback((state: PresenceState) => {
    setPresenceUsers(state)
  }, [])

  const handleAIStreamEvent = useCallback(
    (event: AIStreamRealtimePayload): void => {
      if (event.isPrivate) return

      if (event.eventType === 'error') {
        onAIStreamTerminated?.(event.streamId)
        return
      }

      const streamingMessage: ChatMessage = {
        id: event.streamId,
        content: event.fullContent,
        user: event.user,
        createdAt: event.createdAt,
        roomId: event.roomId,
        isAI: true,
        isStreaming: true,
        isPrivate: false,
        requesterId: event.requesterId
      }

      onAIStreamingMessage?.(streamingMessage)
    },
    [onAIStreamTerminated, onAIStreamingMessage]
  )

  // WebSocket connection for real-time messaging
  useWebSocketConnection({
    roomId,
    userId,
    onMessage: handleIncomingMessage,
    onAIStreamEvent: handleAIStreamEvent,
    onMessageUnsent: handleMessageUnsent,
    enabled: networkState.isOnline,
    username,
    userAvatarUrl,
    onPresenceSync: handlePresenceSync
  })

  // Optimistic message sender with queue support
  const {
    optimisticMessages,
    sendMessage,
    retryMessage,
    queueStatus,
    clearFailedMessages
  } = useOptimisticMessageSender({
    roomId,
    userId,
    username,
    userAvatarUrl,
    isConnected,
    confirmedMessages,
    onConfirmedMessageUpdate: setConfirmedMessages
  })

  // Merge missed messages with optimistic messages
  const allMessages = useMemo(() => {
    const baseMessages = [...cachedTimeline, ...missedMessages]

    // Mark missed messages as deleted if they're in the deleted set
    const updatedMissedMessages = baseMessages.map((msg) =>
      deletedMessageIds.has(msg.id) ? { ...msg, isDeleted: true } : msg
    )

    const combinedMessages = [...updatedMissedMessages, ...optimisticMessages]
    const messageMap = new Map<string, ChatMessage>()

    // Deduplication by message ID and clientMsgId
    combinedMessages.forEach((message) => {
      if (message.isOptimistic && message.serverId) {
        const confirmedMessage = messageMap.get(message.serverId)
        if (confirmedMessage && !confirmedMessage.isOptimistic) {
          return
        }
      }

      const existingMessage = messageMap.get(message.id)

      if (!existingMessage) {
        // Check if this is a broadcast/confirmed message replacing an optimistic message
        if (!message.isOptimistic) {
          let replacedOptimistic = false

          // Primary: Use clientMsgId for deterministic reconciliation (real-time broadcasts)
          if (message.clientMsgId) {
            const optimisticMessage = messageMap.get(message.clientMsgId)

            if (optimisticMessage?.isOptimistic) {
              // Deterministic match found - replace optimistic with confirmed
              messageMap.delete(message.clientMsgId)
              messageMap.set(message.id, {
                ...message,
                isOptimistic: false,
                isOptimisticConfirmed: false
              })
              replacedOptimistic = true
            }
          }

          // Fallback: Use content/timestamp heuristic when clientMsgId is absent
          // (handles missed messages fetched from DB on reconnect)
          if (!replacedOptimistic) {
            const messageTime = new Date(message.createdAt || 0).getTime()

            for (const [existingId, existing] of messageMap.entries()) {
              if (
                existing.isOptimistic &&
                existing.content === message.content &&
                existing.user.id === message.user.id
              ) {
                const existingTime = new Date(existing.createdAt || 0).getTime()
                const timeDiff = Math.abs(messageTime - existingTime)

                // If within 5 seconds, consider it the same message
                if (timeDiff < 5000) {
                  // Replace optimistic with confirmed message
                  messageMap.delete(existingId)
                  messageMap.set(message.id, {
                    ...message,
                    isOptimistic: false,
                    isOptimisticConfirmed: false
                  })
                  replacedOptimistic = true
                  break
                }
              }
            }
          }

          // No match found - add as new message
          if (!replacedOptimistic) {
            messageMap.set(message.id, message)
          }
        } else {
          // This is an optimistic message - add it
          messageMap.set(message.id, message)
        }
      } else {
        // Always prefer confirmed messages over optimistic ones
        if (!message.isOptimistic && existingMessage.isOptimistic) {
          messageMap.set(message.id, message)
        } else if (message.isOptimistic && !existingMessage.isOptimistic) {
          // Keep the confirmed message
        } else {
          // Both same type, prefer newer timestamp
          const newTime = new Date(message.createdAt || 0).getTime()
          const existingTime = new Date(
            existingMessage.createdAt || 0
          ).getTime()
          if (newTime > existingTime) {
            messageMap.set(message.id, message)
          }
        }
      }
    })

    // Convert back to array and sort by creation date
    const uniqueMessages = Array.from(messageMap.values())
    return uniqueMessages.toSorted(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() -
        new Date(b.createdAt || 0).getTime()
    )
  }, [cachedTimeline, missedMessages, optimisticMessages, deletedMessageIds])

  useEffect(() => {
    roomTimelineSessionCache.set(cacheKey, allMessages)
  }, [cacheKey, allMessages])

  // Callback to update confirmed messages and track deleted messages
  const handleMessageUpdate = useCallback(
    (updater: (messages: ChatMessage[]) => ChatMessage[]) => {
      setConfirmedMessages((current) => {
        const updated = updater(current)

        // Check if any messages were marked as deleted and add them to deletedMessageIds
        updated.forEach((msg) => {
          if (msg.isDeleted) {
            setDeletedMessageIds((prev) => new Set(prev).add(msg.id))
          }
        })

        return updated
      })
    },
    []
  )

  // Direct method to mark a message as deleted (for unsend)
  const markMessageAsDeleted = useCallback((messageId: string) => {
    setDeletedMessageIds((prev) => new Set(prev).add(messageId))
    // Also update confirmed messages if the message exists there
    setConfirmedMessages((current) =>
      current.map((msg) =>
        msg.id === messageId || msg.serverId === messageId
          ? {
              ...msg,
              isDeleted: true,
              content: 'This message was deleted'
            }
          : msg
      )
    )
  }, [])

  return {
    messages: allMessages,
    sendMessage,
    retryMessage,
    isConnected,
    loading: missedMessagesLoading,
    queueStatus,
    clearFailedMessages,
    onMessageUpdate: handleMessageUpdate,
    markMessageAsDeleted,
    deletedMessageIds,
    presenceUsers
  }
}
