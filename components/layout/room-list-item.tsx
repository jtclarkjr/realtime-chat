'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/lib/stores/ui-store'
import {
  getMissedMessages,
  getRoomById,
  transformApiMessage
} from '@/lib/api/client'
import { queryKeys } from '@/lib/query'
import type { DatabaseRoom } from '@/lib/types/database'
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user'
import { getRoomHref } from '@/lib/utils/chat-routes'
import { ConversationIcon } from './conversation-icon'

interface RoomListItemProps {
  room: DatabaseRoom
  isActive: boolean
  collapsed: boolean
  onNavigate?: () => void
}

export function RoomListItem({
  room,
  isActive,
  collapsed,
  onNavigate
}: RoomListItemProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthenticatedUser()
  const { unreadCounts } = useUIStore()
  const unreadCount = unreadCounts[room.id] || 0

  const prefetchRoomData = () => {
    router.prefetch(getRoomHref(room))

    void queryClient.prefetchQuery({
      queryKey: queryKeys.rooms.detail(room.id),
      queryFn: async () => {
        const response = await getRoomById(room.id)
        return response.room
      }
    })

    if (!user.id) return

    void queryClient.prefetchQuery({
      queryKey: queryKeys.messages.missed(room.id, user.id),
      queryFn: async () => {
        const data = await getMissedMessages(room.id, user.id)
        if (
          (data.type === 'missed_messages' ||
            data.type === 'recent_messages') &&
          data.messages?.length > 0
        ) {
          return data.messages.map(transformApiMessage)
        }

        return []
      }
    })
  }

  const handleClick = () => {
    // Call onNavigate callback (for mobile drawer)
    onNavigate?.()
  }

  const linkContent = (
    <>
      <ConversationIcon
        room={room}
        className={cn(
          'shrink-0',
          isActive && 'text-primary',
          collapsed ? 'h-5 w-5' : 'h-4 w-4'
        )}
      />

      {!collapsed && (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm font-medium',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {room.name}
          </span>
        </div>
      )}

      {/* Unread badge */}
      {!collapsed && unreadCount > 0 && (
        <span className="h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shrink-0">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Unread indicator for collapsed state */}
      {collapsed && unreadCount > 0 && (
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
      )}
    </>
  )

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={getRoomHref(room)}
              onMouseEnter={prefetchRoomData}
              onFocus={prefetchRoomData}
              onClick={handleClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative group cursor-pointer',
                'hover:bg-muted/50',
                isActive && 'bg-accent border-l-4 border-primary pl-2',
                'justify-center px-2'
              )}
              aria-label={`${room.name} channel${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
              aria-current={isActive ? 'page' : undefined}
              role="listitem"
            >
              {linkContent}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{room.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Link
      href={getRoomHref(room)}
      onMouseEnter={prefetchRoomData}
      onFocus={prefetchRoomData}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative cursor-pointer',
        'hover:bg-muted/50',
        isActive && 'bg-accent border-l-4 border-primary pl-2'
      )}
      aria-label={`${room.name} channel${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
      aria-current={isActive ? 'page' : undefined}
      role="listitem"
    >
      {linkContent}
    </Link>
  )
}
