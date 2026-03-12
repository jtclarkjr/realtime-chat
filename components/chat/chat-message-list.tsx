'use client'

import { forwardRef, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatMessageItem } from '@/components/chat-message'
import { ScrollDateIndicator } from '@/components/chat'
import { MessageListSkeleton } from '@/components/skeletons'
import { useScrollDateDetection, useVirtualizer } from '@/hooks/ui'
import type { ChatMessage } from '@/lib/types/database'

interface ChatMessageListProps {
  messages: ChatMessage[]
  loading: boolean
  userId: string
  onRetry: (messageId: string) => void
  onUnsend?: (messageId: string) => void
  isUnsending?: (messageId: string) => boolean
  onReplyWithAI?: (message: ChatMessage, customPrompt?: string) => Promise<void>
  isReplyingWithAI?: (messageId: string) => boolean
  onUserScroll?: () => void
  isAnonymous?: boolean
}

export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  (
    {
      messages,
      loading,
      userId,
      onRetry,
      onUnsend,
      isUnsending,
      onReplyWithAI,
      isReplyingWithAI,
      onUserScroll,
      isAnonymous = false
    },
    ref
  ) => {
    const { scrollDate, isScrolling, handleScroll } = useScrollDateDetection()
    const filteredMessages = useMemo(
      () => messages.filter((message) => !message.isDeleted),
      [messages]
    )
    const enableVirtualization = filteredMessages.length > 150
    const enableAnimations = filteredMessages.length < 200
    const scrollContainerRef = useRef<HTMLDivElement | null>(null)

    const setCombinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        scrollContainerRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const rowVirtualizer = useVirtualizer({
      count: filteredMessages.length,
      getScrollElement: () => scrollContainerRef.current,
      estimateSize: () => 72,
      overscan: 8
    })
    const virtualItems = rowVirtualizer.getVirtualItems()
    const shouldFallbackToStandardList =
      enableVirtualization &&
      filteredMessages.length > 0 &&
      virtualItems.length === 0

    const handleCombinedScroll = (e: React.UIEvent<HTMLDivElement>) => {
      handleScroll(e)
      onUserScroll?.()
    }

    return (
      <>
        <ScrollDateIndicator date={scrollDate} isVisible={isScrolling} />
        <div
          ref={setCombinedRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-4"
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
          onScroll={handleCombinedScroll}
        >
          {loading && filteredMessages.length === 0 && (
            <div className="py-2 sm:py-4" aria-label="Loading chat messages">
              <MessageListSkeleton />
            </div>
          )}
          {!loading && filteredMessages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <div>No messages yet. Start the conversation!</div>
            </div>
          )}
          {filteredMessages.length > 0 && (
            <>
              {enableVirtualization && !shouldFallbackToStandardList ? (
                <div
                  className="relative"
                  style={{ height: rowVirtualizer.getTotalSize() }}
                >
                  {virtualItems.map((virtualRow) => {
                    const message = filteredMessages[virtualRow.index]
                    if (!message) return null
                    const prevMessage =
                      virtualRow.index > 0
                        ? filteredMessages[virtualRow.index - 1]
                        : null
                    const showHeader =
                      !prevMessage || prevMessage.user.id !== message.user.id

                    return (
                      <div
                        key={virtualRow.key}
                        ref={rowVirtualizer.measureElement}
                        className="pb-3 sm:pb-4"
                        data-index={virtualRow.index}
                        data-message-id={message.id}
                        data-message-date={message.createdAt || ''}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`
                        }}
                      >
                        <ChatMessageItem
                          message={message}
                          isOwnMessage={message.user.id === userId}
                          showHeader={showHeader}
                          currentUserId={userId}
                          onRetry={onRetry}
                          onUnsend={onUnsend}
                          isUnsending={isUnsending}
                          onReplyWithAI={onReplyWithAI}
                          isReplyingWithAI={isReplyingWithAI}
                          isAnonymous={isAnonymous}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  <div className="flex flex-col">
                    {filteredMessages.map((message, index, currentMessages) => {
                      const prevMessage =
                        index > 0 ? currentMessages[index - 1] : null
                      const showHeader =
                        !prevMessage || prevMessage.user.id !== message.user.id
                      const shouldAnimate =
                        enableAnimations && !message.isOptimistic

                      return shouldAnimate ? (
                        <motion.div
                          key={message.id}
                          className="pb-3 sm:pb-4"
                          data-message-id={message.id}
                          data-message-date={message.createdAt || ''}
                          exit={{
                            opacity: 0,
                            height: 0,
                            marginTop: 0,
                            marginBottom: 0,
                            transition: { duration: 0.3, ease: 'easeInOut' }
                          }}
                        >
                          <ChatMessageItem
                            message={message}
                            isOwnMessage={message.user.id === userId}
                            showHeader={showHeader}
                            currentUserId={userId}
                            onRetry={onRetry}
                            onUnsend={onUnsend}
                            isUnsending={isUnsending}
                            onReplyWithAI={onReplyWithAI}
                            isReplyingWithAI={isReplyingWithAI}
                            isAnonymous={isAnonymous}
                          />
                        </motion.div>
                      ) : (
                        <div
                          key={message.id}
                          className="pb-3 sm:pb-4"
                          data-message-id={message.id}
                          data-message-date={message.createdAt || ''}
                        >
                          <ChatMessageItem
                            message={message}
                            isOwnMessage={message.user.id === userId}
                            showHeader={showHeader}
                            currentUserId={userId}
                            onRetry={onRetry}
                            onUnsend={onUnsend}
                            isUnsending={isUnsending}
                            onReplyWithAI={onReplyWithAI}
                            isReplyingWithAI={isReplyingWithAI}
                            isAnonymous={isAnonymous}
                          />
                        </div>
                      )
                    })}
                  </div>
                </AnimatePresence>
              )}
            </>
          )}
        </div>
      </>
    )
  }
)

ChatMessageList.displayName = 'ChatMessageList'
