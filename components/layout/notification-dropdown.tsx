'use client'

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Hash, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/lib/stores/ui-store'
import { useRooms } from '@/lib/query/queries/use-rooms'
import type { DatabaseRoom } from '@/lib/types/database'

interface NotificationDropdownProps {
  initialRooms: DatabaseRoom[]
  children: React.ReactNode
}

export function NotificationDropdown({
  initialRooms,
  children
}: NotificationDropdownProps) {
  const router = useRouter()
  const { unreadCounts, readRooms, markAsRead, dismissNotification } =
    useUIStore()

  const { data: rooms = [] } = useRooms({
    initialData: initialRooms.length > 0 ? initialRooms : undefined
  })

  // Get rooms with unread messages
  const unreadRooms = rooms
    .filter((room) => (unreadCounts[room.id] || 0) > 0)
    .toSorted((a, b) => (unreadCounts[b.id] || 0) - (unreadCounts[a.id] || 0))

  const readRoomList = readRooms
    .map((roomId) => rooms.find((room) => room.id === roomId))
    .filter(
      (room): room is DatabaseRoom =>
        !!room && (unreadCounts[room.id] || 0) === 0
    )

  const handleRoomClick = (roomId: string) => {
    markAsRead(roomId)
    router.push(`/room/${roomId}`)
  }

  const handleDismiss = (
    event: React.MouseEvent<HTMLButtonElement>,
    roomId: string
  ) => {
    event.stopPropagation()
    dismissNotification(roomId)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Notifications</h3>
          {unreadRooms.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {unreadRooms.length} channel{unreadRooms.length !== 1 ? 's' : ''}{' '}
              with unread messages
            </p>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {unreadRooms.length === 0 && readRoomList.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <p>No new notifications</p>
              <p className="text-xs mt-2">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="py-2">
              {unreadRooms.map((room) => (
                <div
                  key={`unread-${room.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRoomClick(room.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleRoomClick(room.id)
                    }
                  }}
                  className="relative w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left flex items-center gap-3 cursor-pointer"
                >
                  <span className="absolute top-2 right-3 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                    {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                  </span>
                  <button
                    type="button"
                    onClick={(event) => handleDismiss(event, room.id)}
                    className="absolute top-2 right-9 h-6 w-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    aria-label={`Dismiss ${room.name} notification`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="p-2 bg-muted rounded-lg">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{room.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {unreadCounts[room.id]} new message
                      {unreadCounts[room.id] !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
              {readRoomList.map((room) => (
                <div
                  key={`read-${room.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRoomClick(room.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleRoomClick(room.id)
                    }
                  }}
                  className="relative w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left flex items-center gap-3 cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(event) => handleDismiss(event, room.id)}
                    className="absolute top-2 right-3 h-6 w-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                    aria-label={`Dismiss ${room.name} notification`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="p-2 bg-muted rounded-lg">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{room.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
