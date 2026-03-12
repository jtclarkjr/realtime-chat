'use client'

import { useChatScroll, useSmartAutoScroll } from '@/hooks/ui'
import { useRealtimeChat, useAIChat, useStreamingMessages } from '@/hooks/chat'
import { useMessageMerging, useUnsendMessage } from '@/hooks/messages'
import {
  ConnectionStatusBar,
  ChatMessageList,
  ChatInput,
  NewMessagesBadge
} from '@/components/chat'
import type { ChatMessage } from '@/lib/types/database'
import type { PresenceState } from '@/lib/types/presence'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react'
import { track } from '@vercel/analytics/react'
import { toast } from 'sonner'
import { processAiFiles } from '@/lib/api/client'
import { useUpdatePersonalChat } from '@/lib/query/mutations'
import {
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_PERSONAL_ATTACHMENTS,
  PERSONAL_ATTACHMENT_ACCEPT
} from '@/lib/constants/attachments'
import {
  normalizePersonalAIModel,
  toManualAIModel
} from '@/lib/constants/ai-models'
import type { PersonalAIModelValue } from '@/lib/types/ai-models'
import { useUIStore } from '@/lib/stores/ui-store'

interface RealtimeChatProps {
  roomId: string
  mode?: 'group' | 'personal'
  username: string
  userId: string
  userAvatarUrl?: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
  onPresenceChange?: (users: PresenceState) => void
  isAnonymous?: boolean
  initialAIEnabled?: boolean
  allowPrivateAI?: boolean
  personalAIModel?: string | null
  pendingInitialAI?: {
    content: string
    triggerMessageId?: string
    fileContextId?: string
    requiresFileContext?: boolean
  } | null
}

type AttachmentSelection = {
  id: string
  file: File
}

const subscribeNoop = () => () => {}

/**
 * Realtime chat component
 * @param roomId - The ID of the room to join. Each room is a unique chat.
 * @param username - The username of the user
 * @param onMessage - The callback function to handle the messages. Useful if you want to store the messages in a database.
 * @param messages - The messages to display in the chat. Useful if you want to display messages from a database.
 * @returns The chat component
 */
export const RealtimeChat = ({
  roomId,
  mode = 'group',
  username,
  userId,
  userAvatarUrl,
  onMessage,
  messages: initialMessages = [],
  onPresenceChange,
  isAnonymous = false,
  initialAIEnabled = false,
  allowPrivateAI = true,
  personalAIModel = null,
  pendingInitialAI = null
}: RealtimeChatProps) => {
  const { containerRef, scrollToBottom, scrollToBottomInstant } =
    useChatScroll()
  const clearPendingPersonalAI = useUIStore(
    (state) => state.clearPendingPersonalAI
  )
  const updatePersonalChatMutation = useUpdatePersonalChat()

  const {
    streamingMessages,
    addOrUpdateStreamingMessage,
    clearStreamingMessage
  } = useStreamingMessages()

  const handleRemoteAIStreamingMessage = useCallback(
    (message: ChatMessage) => {
      addOrUpdateStreamingMessage(message)
    },
    [addOrUpdateStreamingMessage]
  )

  const handleRemoteAIStreamTerminated = useCallback(
    (streamId: string) => {
      clearStreamingMessage(streamId)
    },
    [clearStreamingMessage]
  )

  // When a confirmed AI broadcast arrives, clear the requester's streaming
  // entry so both the requester and other users render the same message object.
  const handleAIBroadcastReceived = useCallback(
    (message: ChatMessage) => {
      // Clear by persisted message ID (the streaming entry after SSE complete)
      clearStreamingMessage(message.id)
      // Clear by streamSourceId (the streaming entry during SSE streaming)
      if (message.streamSourceId) {
        clearStreamingMessage(message.streamSourceId)
      }
    },
    [clearStreamingMessage]
  )

  const {
    messages: realtimeMessages,
    sendMessage,
    retryMessage,
    isConnected,
    loading,
    queueStatus,
    clearFailedMessages,
    markMessageAsDeleted,
    deletedMessageIds,
    presenceUsers
  } = useRealtimeChat({
    roomId,
    username,
    userId,
    userAvatarUrl,
    onAIStreamingMessage: handleRemoteAIStreamingMessage,
    onAIStreamTerminated: handleRemoteAIStreamTerminated,
    onAIBroadcastReceived: handleAIBroadcastReceived
  })

  // Initialize unsend message
  const { unsendMessage, isUnsending } = useUnsendMessage({
    userId,
    roomId,
    markMessageAsDeleted
  })

  const {
    isAIEnabled,
    setIsAIEnabled,
    isAIPrivate,
    setIsAIPrivate,
    isAILoading,
    isAILocked,
    aiUsageNearLimitNotice,
    aiLockReason,
    sendAIMessage,
    generateReplyDraft
  } = useAIChat({
    roomId,
    userId,
    isConnected,
    onStreamingMessage: (message) => {
      addOrUpdateStreamingMessage(message)
    },
    onRemoveStreamingMessage: (messageId) => {
      clearStreamingMessage(messageId)
    },
    onCompleteMessage: (completedMessage) => {
      // Always update the streaming message with completed content
      const finalMessage = { ...completedMessage, isStreaming: false }
      addOrUpdateStreamingMessage(finalMessage)

      // For public messages, the broadcast will eventually replace this
      // For private messages, this stays permanently
    },
    initialAIEnabled,
    allowPrivateMessages: allowPrivateAI,
    isAnonymous
  })

  const [newMessage, setNewMessage] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<PersonalAIModelValue>(
    normalizePersonalAIModel(personalAIModel)
  )
  const [attachmentFiles, setAttachmentFiles] = useState<AttachmentSelection[]>(
    []
  )
  const [replyingMessageId, setReplyingMessageId] = useState<string | null>(
    null
  )
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const pendingInitialAIRunRef = useRef<string | null>(null)
  const hasHydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
  // Merge realtime messages with initial messages and streaming messages
  const allMessages = useMessageMerging({
    initialMessages,
    realtimeMessages,
    streamingMessages,
    userId,
    deletedMessageIds
  })

  // Smart auto-scroll that only scrolls when appropriate
  const {
    handleUserScroll,
    userHasScrolledUp,
    unreadMessageCount,
    scrollToBottomAndClearUnread
  } = useSmartAutoScroll({
    roomId,
    messages: allMessages,
    containerRef,
    scrollToBottom,
    scrollToBottomInstant
  })

  const effectiveIsConnected = hasHydrated ? isConnected : true
  const attachmentEnabled = mode === 'personal'
  const attachmentDisabled = !effectiveIsConnected || loading || isAILoading
  const attachmentChips = useMemo(
    () =>
      attachmentFiles.map((entry) => ({
        id: entry.id,
        name: entry.file.name
      })),
    [attachmentFiles]
  )
  const modelSelectorDisabled =
    mode === 'personal' &&
    (!initialAIEnabled || updatePersonalChatMutation.isPending || isAILocked)
  let modelSelectorNotice: string | undefined
  if (mode === 'personal') {
    modelSelectorNotice = isAILocked
      ? 'Limit has been hit.'
      : aiUsageNearLimitNotice
  }
  const modelSelectorNoticeTone = isAILocked ? 'destructive' : 'warning'
  const standardAINotice =
    mode === 'personal' ? undefined : aiLockReason || aiUsageNearLimitNotice
  let standardAINoticeTone: 'warning' | 'destructive' | undefined
  if (mode !== 'personal') {
    standardAINoticeTone = isAILocked ? 'destructive' : 'warning'
  }

  useEffect(() => {
    if (mode !== 'personal') {
      return
    }

    setSelectedModel(normalizePersonalAIModel(personalAIModel))
  }, [mode, personalAIModel, roomId])

  useEffect(() => {
    setAttachmentFiles([])
    pendingInitialAIRunRef.current = null
  }, [mode, roomId])

  const clearAttachmentFiles = useCallback(() => {
    setAttachmentFiles([])
  }, [])

  const handleSelectAttachmentFiles = useCallback(
    (files: FileList | null) => {
      if (!files || mode !== 'personal') {
        return
      }

      setAttachmentFiles((current) => {
        const next = [...current]

        for (const file of Array.from(files)) {
          if (file.size > MAX_ATTACHMENT_FILE_BYTES) {
            toast.error(`${file.name} exceeds the 20 MB per-file limit`)
            continue
          }

          if (next.length >= MAX_PERSONAL_ATTACHMENTS) {
            toast.error(
              `You can attach up to ${MAX_PERSONAL_ATTACHMENTS} files`
            )
            break
          }

          const duplicate = next.some(
            (entry) =>
              entry.file.name === file.name &&
              entry.file.size === file.size &&
              entry.file.lastModified === file.lastModified
          )
          if (duplicate) {
            continue
          }

          next.push({
            id: crypto.randomUUID(),
            file
          })
        }

        return next
      })
    },
    [mode]
  )

  const handleRemoveAttachmentFile = useCallback((fileId: string) => {
    setAttachmentFiles((current) =>
      current.filter((attachment) => attachment.id !== fileId)
    )
  }, [])

  const handleModelChange = useCallback(
    async (nextModel: PersonalAIModelValue) => {
      if (mode !== 'personal') {
        return
      }

      const previousModel = selectedModel
      setSelectedModel(nextModel)

      try {
        await updatePersonalChatMutation.mutateAsync({
          chatId: roomId,
          data: {
            aiModel: toManualAIModel(nextModel) ?? null
          }
        })
      } catch (error) {
        setSelectedModel(previousModel)
        toast.error(
          error instanceof Error ? error.message : 'Failed to update AI model'
        )
      }
    },
    [mode, roomId, selectedModel, updatePersonalChatMutation]
  )

  const processAttachments = useCallback(async (): Promise<
    string | undefined
  > => {
    if (!attachmentFiles.length) {
      return undefined
    }

    if (mode !== 'personal') {
      toast.error('Attachments are only available in personal chats')
      throw new Error('attachments_not_allowed')
    }

    if (!effectiveIsConnected) {
      toast.error('Attachments can only be sent while online')
      throw new Error('attachments_offline')
    }

    if (!isAIEnabled) {
      toast.error(
        aiLockReason || 'Enable AI to include attachments in your request'
      )
      throw new Error('attachments_require_ai')
    }

    const formData = new FormData()
    formData.append('channelId', roomId)
    attachmentFiles.forEach((entry) => {
      formData.append('files', entry.file, entry.file.name)
    })

    const result = await processAiFiles(formData)
    if (result.rejectedFiles.length > 0) {
      toast.error(
        `${result.rejectedFiles.length} file(s) were rejected by the server`
      )
    }

    return result.fileContextId
  }, [
    aiLockReason,
    attachmentFiles,
    effectiveIsConnected,
    isAIEnabled,
    mode,
    roomId
  ])

  useEffect(() => {
    if (
      !pendingInitialAI ||
      isAnonymous ||
      isAILoading ||
      isAILocked ||
      (mode === 'personal' && !initialAIEnabled)
    ) {
      return
    }

    if (
      pendingInitialAI.requiresFileContext &&
      !pendingInitialAI.fileContextId
    ) {
      return
    }

    const pendingKey = `${roomId}:${pendingInitialAI.triggerMessageId || pendingInitialAI.content}:${pendingInitialAI.fileContextId || 'no-file-context'}`
    if (pendingInitialAIRunRef.current === pendingKey) {
      return
    }

    pendingInitialAIRunRef.current = pendingKey
    void sendAIMessage(
      pendingInitialAI.content,
      allMessages.filter((message) => !message.isDeleted).slice(-10),
      pendingInitialAI.triggerMessageId,
      pendingInitialAI.fileContextId
    )
      .then(() => {
        clearPendingPersonalAI(roomId)
      })
      .catch((error) => {
        pendingInitialAIRunRef.current = null
        console.error('Failed to auto-start personal AI response:', error)
      })
  }, [
    allMessages,
    clearPendingPersonalAI,
    isAILocked,
    isAILoading,
    isAnonymous,
    initialAIEnabled,
    mode,
    pendingInitialAI,
    roomId,
    sendAIMessage
  ])
  // Handle clearing streaming messages when broadcast arrives
  useEffect(() => {
    streamingMessages.forEach((streamingMessage) => {
      if (!streamingMessage.isPrivate && streamingMessage.isAI) {
        const existingBroadcastMessage = realtimeMessages.find((msg) => {
          if (!msg.isAI || msg.isStreaming) return false

          if (msg.streamSourceId) {
            return msg.streamSourceId === streamingMessage.id
          }

          return (
            msg.content === streamingMessage.content &&
            msg.content &&
            msg.content.trim().length > 0
          )
        })

        if (existingBroadcastMessage) {
          clearStreamingMessage(streamingMessage.id)
        }
      }
    })
  }, [realtimeMessages, streamingMessages, clearStreamingMessage])

  useEffect(() => {
    if (onMessage) {
      onMessage(allMessages)
    }
  }, [allMessages, onMessage])

  useEffect(() => {
    if (onPresenceChange) {
      onPresenceChange(presenceUsers)
    }
  }, [presenceUsers, onPresenceChange])

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      // Prevent sending if loading (but allow offline sending - will be queued)
      if (!newMessage.trim() || loading || isAILoading) return

      const messageContent = newMessage.trim()
      let fileContextId: string | undefined

      try {
        fileContextId = await processAttachments()
      } catch {
        return
      }

      setNewMessage('')

      if (isAIEnabled) {
        const triggerMessageId = await sendMessage(
          messageContent,
          mode === 'personal' ? false : isAIPrivate
        )
        // Then send to AI for response with recent messages as context
        // Pass the trigger message ID so it can be marked as having an AI response
        await sendAIMessage(
          messageContent,
          allMessages.filter((message) => !message.isDeleted).slice(-10),
          triggerMessageId || undefined,
          fileContextId
        )

        if (fileContextId) {
          clearAttachmentFiles()
        }

        if (mode !== 'personal' && isAIPrivate) {
          track('event_ai_private_message_sent')
        } else if (mode !== 'personal') {
          track('event_ai_public_message_sent')
        }
      } else {
        // Send regular message
        await sendMessage(messageContent)
      }
    },
    [
      newMessage,
      mode,
      processAttachments,
      clearAttachmentFiles,
      setNewMessage,
      sendMessage,
      sendAIMessage,
      loading,
      isAIEnabled,
      isAIPrivate,
      isAILoading,
      allMessages
    ]
  )

  const handleReplyWithAI = useCallback(
    async (selectedMessage: ChatMessage, customPrompt?: string) => {
      const selectedMessageId = selectedMessage.serverId || selectedMessage.id
      const selectedMessageContent = selectedMessage.content.trim()

      if (!selectedMessageId || !selectedMessageContent) {
        toast.error('Unable to generate a reply for this message')
        return
      }

      setReplyingMessageId(selectedMessageId)

      try {
        const recentMessages = allMessages
          .filter((message) => !message.isDeleted)
          .slice(-10)

        const selectedInRecentMessages = recentMessages.some(
          (message) =>
            (message.serverId || message.id) === selectedMessageId &&
            message.content.trim() === selectedMessageContent
        )

        const previousMessages = selectedInRecentMessages
          ? recentMessages
          : [...recentMessages, selectedMessage]

        const generatedReply = await generateReplyDraft({
          previousMessages,
          targetMessage: {
            id: selectedMessageId,
            content: selectedMessageContent
          },
          customPrompt
        })

        setNewMessage(generatedReply)
        setIsAIEnabled(!!selectedMessage.isAI)
        inputRef.current?.focus()
      } catch (error) {
        console.error('Failed to generate AI reply:', error)
        toast.error(
          error instanceof Error ? error.message : 'Failed to generate AI reply'
        )
        throw error
      } finally {
        setReplyingMessageId(null)
      }
    },
    [allMessages, generateReplyDraft, setIsAIEnabled]
  )

  const isReplyingWithAI = useCallback(
    (messageId: string) => replyingMessageId === messageId,
    [replyingMessageId]
  )

  return (
    <div className="relative flex flex-col h-full w-full bg-background text-foreground antialiased">
      <ConnectionStatusBar
        isConnected={effectiveIsConnected}
        queueStatus={queueStatus}
        onClearFailedMessages={clearFailedMessages}
      />

      <ChatMessageList
        ref={containerRef}
        messages={allMessages}
        loading={loading}
        userId={userId}
        onRetry={retryMessage}
        onUnsend={unsendMessage}
        isUnsending={isUnsending}
        onReplyWithAI={isAILocked ? undefined : handleReplyWithAI}
        isReplyingWithAI={isReplyingWithAI}
        onUserScroll={handleUserScroll}
        isAnonymous={isAnonymous}
      />

      <NewMessagesBadge
        isVisible={userHasScrolledUp}
        newMessageCount={unreadMessageCount}
        onScrollToBottom={scrollToBottomAndClearUnread}
      />

      <ChatInput
        mode={mode}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        loading={loading}
        isConnected={effectiveIsConnected}
        isAIEnabled={isAIEnabled}
        setIsAIEnabled={setIsAIEnabled}
        isAIPrivate={isAIPrivate}
        setIsAIPrivate={setIsAIPrivate}
        isAILoading={isAILoading}
        isAnonymous={isAnonymous}
        allowPrivateAI={allowPrivateAI}
        inputRef={inputRef}
        isAILocked={isAILocked}
        aiLockReason={aiLockReason}
        aiNotice={standardAINotice}
        aiNoticeTone={standardAINoticeTone}
        selectedModel={mode === 'personal' ? selectedModel : undefined}
        modelSelectorDisabled={modelSelectorDisabled}
        modelSelectorNotice={modelSelectorNotice}
        modelSelectorNoticeTone={modelSelectorNoticeTone}
        onModelChange={handleModelChange}
        attachmentEnabled={attachmentEnabled}
        attachmentDisabled={attachmentDisabled}
        attachmentAccept={PERSONAL_ATTACHMENT_ACCEPT}
        attachmentMaxFiles={MAX_PERSONAL_ATTACHMENTS}
        attachmentChips={attachmentChips}
        onSelectAttachmentFiles={handleSelectAttachmentFiles}
        onRemoveAttachmentFile={handleRemoveAttachmentFile}
      />
    </div>
  )
}
