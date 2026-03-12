'use client'

import { Loader2, Clock } from 'lucide-react'
import type { ChatMessage } from '@/lib/types/database'

interface MessageStatusIndicatorProps {
  message: ChatMessage
}

const getStatusTitle = (msg: ChatMessage): string => {
  if (msg.isRetrying || msg.isPending) return 'Sending...'
  if (msg.isQueued) return 'Queued for sending when connection is restored'
  return ''
}

const StatusIcon = ({ message }: { message: ChatMessage }) => {
  if (message.isRetrying || message.isPending) {
    return <Loader2 className="h-3 w-3 animate-spin text-yellow-600" />
  }
  if (message.isQueued) {
    return <Clock className="h-3 w-3 text-yellow-600" />
  }
  return null
}

export const MessageStatusIndicator = ({
  message
}: MessageStatusIndicatorProps) => {
  if (!message.isQueued && !message.isPending && !message.isRetrying) {
    return null
  }

  return (
    <div
      className="flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border shadow-sm"
      title={getStatusTitle(message)}
    >
      <StatusIcon message={message} />
    </div>
  )
}
