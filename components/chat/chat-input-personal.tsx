'use client'

import {
  ChatComposer,
  ChatComposerModelSelector
} from '@/components/ui/chat-composer'
import type { PersonalAIModelValue } from '@/lib/types/ai-models'

interface ChatInputPersonalProps {
  newMessage: string
  setNewMessage: (message: string) => void
  onSendMessage: (event: React.FormEvent) => void
  loading: boolean
  isConnected: boolean
  isAILoading: boolean
  isAnonymous: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  selectedModel: PersonalAIModelValue
  modelSelectorDisabled: boolean
  modelSelectorNotice?: string
  modelSelectorNoticeTone?: 'warning' | 'destructive'
  onModelChange: (value: PersonalAIModelValue) => void | Promise<void>
  attachmentEnabled: boolean
  attachmentDisabled: boolean
  attachmentAccept: string
  attachmentMaxFiles: number
  attachmentChips: Array<{
    id: string
    name: string
  }>
  onSelectAttachmentFiles: (files: FileList | null) => void
  onRemoveAttachmentFile: (fileId: string) => void
  placeholder: string
}

export function ChatInputPersonal({
  newMessage,
  setNewMessage,
  onSendMessage,
  loading,
  isConnected,
  isAILoading,
  isAnonymous,
  inputRef,
  selectedModel,
  modelSelectorDisabled,
  modelSelectorNotice,
  modelSelectorNoticeTone = 'warning',
  onModelChange,
  attachmentEnabled,
  attachmentDisabled,
  attachmentAccept,
  attachmentMaxFiles,
  attachmentChips,
  onSelectAttachmentFiles,
  onRemoveAttachmentFile,
  placeholder
}: ChatInputPersonalProps) {
  const inputDisabled = loading || isAILoading || isAnonymous

  return (
    <div className="border-t border-border bg-background/50 p-3 backdrop-blur-sm sm:p-4">
      <ChatComposer
        value={newMessage}
        placeholder={placeholder}
        inputRef={inputRef}
        disabled={inputDisabled}
        sendDisabled={loading || !newMessage.trim() || isAnonymous}
        isConnected={isConnected}
        showStopButton={false}
        attachment={{
          enabled: attachmentEnabled,
          disabled: attachmentDisabled,
          accept: attachmentAccept,
          maxFiles: attachmentMaxFiles,
          files: attachmentChips
        }}
        onValueChange={setNewMessage}
        onSubmit={onSendMessage}
        onStopAIResponse={() => {}}
        onSelectAttachmentFiles={onSelectAttachmentFiles}
        onRemoveAttachmentFile={onRemoveAttachmentFile}
      >
        <ChatComposerModelSelector
          selectedModel={selectedModel}
          disabled={modelSelectorDisabled}
          notice={modelSelectorNotice}
          noticeTone={modelSelectorNoticeTone}
          onModelChange={onModelChange}
        />
      </ChatComposer>
    </div>
  )
}
