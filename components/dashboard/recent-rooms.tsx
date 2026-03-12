'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Hash, ArrowRight, Bot } from 'lucide-react'
import { useUIStore } from '@/lib/stores/ui-store'
import {
  getMissedMessages,
  getRoomById,
  transformApiMessage
} from '@/lib/api/client'
import { queryKeys } from '@/lib/query'
import { formatRelativeTime } from '@/lib/utils/format-time'
import type { RoomWithLastMessage } from '@/lib/actions/room-actions'
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user'

interface RecentRoomsProps {
  initialRooms: RoomWithLastMessage[]
}

export function RecentRooms({ initialRooms }: RecentRoomsProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthenticatedUser()
  const { recentRooms } = useUIStore()
  const roomsWithMessages = initialRooms.filter(
    (
      room
    ): room is RoomWithLastMessage & {
      lastMessage: NonNullable<RoomWithLastMessage['lastMessage']>
    } => room.lastMessage != null
  )

  // Sort rooms by:
  // 1. Recent rooms (from UI store) come first, in order of recency
  // 2. Then remaining rooms sorted by last message timestamp
  const sortedRooms = [...roomsWithMessages].toSorted((a, b) => {
    const aRecentIndex = recentRooms.indexOf(a.id)
    const bRecentIndex = recentRooms.indexOf(b.id)

    // If both are in recent rooms, sort by recency (lower index = more recent)
    if (aRecentIndex !== -1 && bRecentIndex !== -1) {
      return aRecentIndex - bRecentIndex
    }

    // If only one is in recent rooms, it comes first
    if (aRecentIndex !== -1) return -1
    if (bRecentIndex !== -1) return 1

    // For non-recent rooms, sort by last message timestamp
    return (
      new Date(b.lastMessage.timestamp).getTime() -
      new Date(a.lastMessage.timestamp).getTime()
    )
  })

  // Show top 5 rooms
  const displayedRooms = sortedRooms.slice(0, 5)

  if (displayedRooms.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold">Recent chats</h2>
        <div className="text-center py-8 text-muted-foreground">
          <p>No recent chats yet.</p>
          <p className="text-sm mt-2">
            Start a conversation in a room to see it here!
          </p>
        </div>
      </div>
    )
  }

  const prefetchRoomData = (roomId: string) => {
    router.prefetch(`/room/${roomId}`)

    void queryClient.prefetchQuery({
      queryKey: queryKeys.rooms.detail(roomId),
      queryFn: async () => {
        const response = await getRoomById(roomId)
        return response.room
      }
    })

    if (!user.id) return

    void queryClient.prefetchQuery({
      queryKey: queryKeys.messages.missed(roomId, user.id),
      queryFn: async () => {
        const data = await getMissedMessages(roomId, user.id)
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

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold">Recent chats</h2>
      <div className="space-y-2">
        {displayedRooms.map((room) =>
          room.lastMessage ? (
            <Link
              key={room.id}
              href={`/room/${room.id}`}
              onMouseEnter={() => prefetchRoomData(room.id)}
              onFocus={() => prefetchRoomData(room.id)}
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors group"
            >
              <div className="p-2 bg-muted rounded-lg shrink-0">
                <Hash className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1">{room.name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {room.lastMessage.isAI && (
                    <Bot className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">
                    {room.lastMessage.userName}: {room.lastMessage.content}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(room.lastMessage.timestamp)}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ) : null
        )}
      </div>
    </div>
  )
}
