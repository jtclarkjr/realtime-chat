'use client'

import { useMemo } from 'react'
import type { PersonalAIModelValue } from '@/lib/types/ai-models'
import { ChatInputPersonal } from './chat-input-personal'
import { ChatInputStandard } from './chat-input-standard'

const getPlaceholderText = (
  isLoading: boolean,
  isAILoading: boolean,
  isAIEnabled: boolean,
  isConnected: boolean,
  isAnonymous: boolean
): string => {
  if (isLoading) return 'Loading messages...'
  if (isAnonymous) return 'Sign in to send messages...'
  if (isAILoading) return 'AI is responding...'
  if (!isConnected && !isLoading)
    return isAIEnabled ? 'Ask AI (offline)...' : 'Type message (offline)...'
  if (isAIEnabled) return 'Ask AI assistant...'
  return 'Type a message...'
}

interface ChatInputProps {
  mode?: 'group' | 'personal'
  newMessage: string
  setNewMessage: (message: string) => void
  onSendMessage: (e: React.FormEvent) => void
  loading: boolean
  isConnected: boolean
  isAIEnabled: boolean
  setIsAIEnabled: (enabled: boolean) => void
  isAIPrivate: boolean
  setIsAIPrivate: (isPrivate: boolean) => void
  isAILoading: boolean
  isAnonymous: boolean
  allowPrivateAI?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  isAILocked?: boolean
  aiLockReason?: string
  aiNotice?: string
  aiNoticeTone?: 'warning' | 'destructive'
  selectedModel?: PersonalAIModelValue
  modelSelectorDisabled?: boolean
  modelSelectorNotice?: string
  modelSelectorNoticeTone?: 'warning' | 'destructive'
  onModelChange?: (value: PersonalAIModelValue) => void | Promise<void>
  attachmentEnabled?: boolean
  attachmentDisabled?: boolean
  attachmentAccept?: string
  attachmentMaxFiles?: number
  attachmentChips?: Array<{
    id: string
    name: string
  }>
  onSelectAttachmentFiles?: (files: FileList | null) => void
  onRemoveAttachmentFile?: (fileId: string) => void
}

export const ChatInput = ({
  mode = 'group',
  newMessage,
  setNewMessage,
  onSendMessage,
  loading,
  isConnected,
  isAIEnabled,
  setIsAIEnabled,
  isAIPrivate,
  setIsAIPrivate,
  isAILoading,
  isAnonymous,
  allowPrivateAI = true,
  inputRef,
  isAILocked = false,
  aiLockReason,
  aiNotice,
  aiNoticeTone = 'warning',
  selectedModel,
  modelSelectorDisabled = false,
  modelSelectorNotice,
  modelSelectorNoticeTone = 'warning',
  onModelChange,
  attachmentEnabled = false,
  attachmentDisabled = false,
  attachmentAccept = '',
  attachmentMaxFiles = 0,
  attachmentChips = [],
  onSelectAttachmentFiles,
  onRemoveAttachmentFile
}: ChatInputProps) => {
  const placeholder = useMemo(
    () =>
      getPlaceholderText(
        loading,
        isAILoading,
        isAIEnabled,
        isConnected,
        isAnonymous
      ),
    [isAIEnabled, isAILoading, isAnonymous, isConnected, loading]
  )

  if (mode === 'personal' && selectedModel && onModelChange) {
    return (
      <ChatInputPersonal
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={onSendMessage}
        loading={loading}
        isConnected={isConnected}
        isAILoading={isAILoading}
        isAnonymous={isAnonymous}
        inputRef={inputRef}
        selectedModel={selectedModel}
        modelSelectorDisabled={modelSelectorDisabled}
        modelSelectorNotice={modelSelectorNotice}
        modelSelectorNoticeTone={modelSelectorNoticeTone}
        onModelChange={onModelChange}
        attachmentEnabled={attachmentEnabled}
        attachmentDisabled={attachmentDisabled}
        attachmentAccept={attachmentAccept}
        attachmentMaxFiles={attachmentMaxFiles}
        attachmentChips={attachmentChips}
        onSelectAttachmentFiles={onSelectAttachmentFiles || (() => {})}
        onRemoveAttachmentFile={onRemoveAttachmentFile || (() => {})}
        placeholder={placeholder}
      />
    )
  }

  return (
    <ChatInputStandard
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSendMessage={onSendMessage}
      loading={loading}
      isConnected={isConnected}
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
      aiNotice={aiNotice}
      aiNoticeTone={aiNoticeTone}
      placeholder={placeholder}
    />
  )
}
