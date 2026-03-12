'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AIBadge } from '@/components/ui/ai-badge'
import { Send } from 'lucide-react'

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
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

export const ChatInput = ({
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
  inputRef
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    const maxHeight = parseFloat(getComputedStyle(textarea).maxHeight) || 160
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px'
  }

  useEffect(() => {
    autoResize()
  }, [newMessage])

  const inputDisabled = loading || isAILoading || isAnonymous

  return (
    <form
      onSubmit={onSendMessage}
      className="flex w-full gap-2 sm:gap-3 border-t border-border p-3 sm:p-4 bg-background/50 backdrop-blur-sm"
      role="form"
      aria-label="Send message"
    >
      <div
        className={cn(
          'flex-1 flex items-end gap-2 rounded-2xl border border-border/50 bg-background dark:bg-transparent transition-all duration-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 px-4 py-3 sm:py-2',
          inputDisabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Textarea
          ref={(node) => {
            textareaRef.current = node
            if (inputRef) {
              inputRef.current = node
            }
          }}
          className="flex-1 w-0 border-0 bg-transparent shadow-none px-0 py-1 min-h-0 h-auto resize-none max-h-64 overflow-y-scroll scrollbar-none leading-relaxed focus-visible:ring-0 focus-visible:border-transparent dark:bg-transparent"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value)
            autoResize()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (newMessage.trim()) {
                const form = e.currentTarget.closest('form')
                if (form) {
                  form.requestSubmit()
                }
              }
            }
          }}
          placeholder={getPlaceholderText(
            loading,
            isAILoading,
            isAIEnabled,
            isConnected,
            isAnonymous
          )}
          disabled={inputDisabled}
          autoComplete="off"
          autoCapitalize="sentences"
          autoFocus={!inputDisabled}
          aria-label="Type your message"
          aria-describedby="ai-status"
          rows={1}
        />
        <div className="flex-shrink-0">
          <AIBadge
            isActive={isAIEnabled}
            onToggle={() => setIsAIEnabled(!isAIEnabled)}
            isPrivate={isAIPrivate}
            onPrivacyToggle={() => setIsAIPrivate(!isAIPrivate)}
            isAnonymous={isAnonymous}
          />
        </div>
      </div>
      {!loading && newMessage.trim() && !isAnonymous && (
        <Button
          className={cn(
            'aspect-square h-12 w-12 sm:h-10 sm:w-10 rounded-full animate-in fade-in slide-in-from-right-4 duration-300 active:scale-95',
            isConnected
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-orange-500 hover:bg-orange-600'
          )}
          type="submit"
          disabled={loading}
          aria-label={isConnected ? 'Send message' : 'Queue message (offline)'}
          title={
            isConnected
              ? 'Send message'
              : "You're offline - message will be queued and sent when connection is restored"
          }
        >
          <Send className="h-5 w-5 sm:h-4 sm:w-4" aria-hidden="true" />
        </Button>
      )}
    </form>
  )
}
