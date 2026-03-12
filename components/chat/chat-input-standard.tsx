'use client'

import { cn } from '@/lib/utils'
import { AIBadge } from '@/components/ui/ai-badge'
import { ChatComposer } from '@/components/ui/chat-composer'

interface ChatInputStandardProps {
  newMessage: string
  setNewMessage: (message: string) => void
  onSendMessage: (event: React.FormEvent) => void
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
  placeholder: string
}

export function ChatInputStandard({
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
  placeholder
}: ChatInputStandardProps) {
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
        onValueChange={setNewMessage}
        onSubmit={onSendMessage}
        onStopAIResponse={() => {}}
        className={cn(inputDisabled && 'opacity-50')}
      >
        <AIBadge
          isActive={isAIEnabled}
          onToggle={() => setIsAIEnabled(!isAIEnabled)}
          isPrivate={isAIPrivate}
          onPrivacyToggle={() => setIsAIPrivate(!isAIPrivate)}
          isAnonymous={isAnonymous}
          allowPrivateToggle={allowPrivateAI}
          isLocked={isAILocked}
          lockReason={aiLockReason}
        />
      </ChatComposer>

      {aiNotice && !isAnonymous && (
        <p
          id="ai-status"
          className={cn(
            'mt-2 text-xs',
            aiNoticeTone === 'destructive'
              ? 'text-destructive'
              : 'text-amber-600 dark:text-amber-400'
          )}
        >
          {aiNotice}
        </p>
      )}
    </div>
  )
}
