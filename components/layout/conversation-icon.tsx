'use client'

import { Bot, Hash, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DatabaseRoom } from '@/lib/types/database'

interface ConversationIconProps {
  room: Pick<DatabaseRoom, 'kind' | 'visibility'>
  className?: string
}

export function ConversationIcon({ room, className }: ConversationIconProps) {
  if (room.kind === 'personal') {
    return <Bot className={cn('text-muted-foreground', className)} />
  }

  if (room.visibility === 'private') {
    return <Lock className={cn('text-muted-foreground', className)} />
  }

  return <Hash className={cn('text-muted-foreground', className)} />
}
