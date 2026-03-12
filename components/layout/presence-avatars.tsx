'use client'

import { UserAvatar } from '@/components/ui/user-avatar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import type { PresenceState } from '@/lib/types/presence'

interface PresenceAvatarsProps {
  presenceUsers: PresenceState
  currentUserId?: string
  maxVisible?: number
}

export function PresenceAvatars({
  presenceUsers,
  currentUserId,
  maxVisible = 5
}: PresenceAvatarsProps) {
  const users = Object.values(presenceUsers)

  if (users.length === 0) {
    return null
  }

  // Sort: current user first, then alphabetically
  const sortedUsers = [...users].toSorted((a, b) => {
    if (a.id === currentUserId) return -1
    if (b.id === currentUserId) return 1
    return a.name.localeCompare(b.name)
  })

  const visibleUsers = sortedUsers.slice(0, maxVisible)
  const overflowCount = Math.max(0, users.length - maxVisible)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center -space-x-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Show online users (${users.length})`}
        >
          {visibleUsers.map((user) => {
            const isCurrentUser = user.id === currentUserId

            return (
              <div
                key={user.id}
                className={`relative ring-2 ring-background rounded-full transition-transform hover:scale-110 hover:z-10 ${
                  isCurrentUser ? 'ring-primary' : ''
                }`}
              >
                <UserAvatar
                  src={user.avatar_url}
                  alt={user.name}
                  size="sm"
                  className="h-7 w-7"
                />
              </div>
            )
          })}

          {overflowCount > 0 && (
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs font-medium ring-2 ring-background transition-transform hover:scale-110">
              +{overflowCount}
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-0">
        <div className="border-b border-border px-3 py-2">
          <p className="text-sm font-medium">Online now ({users.length})</p>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {sortedUsers.map((user) => {
            const isCurrentUser = user.id === currentUserId
            return (
              <div
                key={user.id}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                <UserAvatar
                  src={user.avatar_url}
                  alt={user.name}
                  size="sm"
                  className="h-6 w-6"
                />
                <span className="truncate">
                  {isCurrentUser ? `${user.name} (you)` : user.name}
                </span>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
