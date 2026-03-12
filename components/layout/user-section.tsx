'use client'

import { UserAvatar } from '@/components/ui/user-avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { LogOut, Settings, Bell } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicUser } from '@/lib/types/user'
import { cn } from '@/lib/utils'
import { useNetworkConnectivity } from '@/hooks/connection/use-network-connectivity'
import { NotificationDropdown } from './notification-dropdown'
import type { GroupView, PersonalChat } from '@/lib/types/database'
import { useUIStore } from '@/lib/stores/ui-store'
import { signOutViaLogoutRoute } from '@/lib/auth/client'

interface UserSectionProps {
  user: PublicUser
  collapsed: boolean
  initialGroups: GroupView[]
  initialPersonalChats: PersonalChat[]
}

export function UserSection({
  user,
  collapsed,
  initialGroups,
  initialPersonalChats
}: UserSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const { isOnline } = useNetworkConnectivity()
  const { unreadCounts, hasHydrated } = useUIStore()
  const effectiveOnline = hasHydrated ? isOnline : true

  const totalUnread = hasHydrated
    ? Object.values(unreadCounts).reduce<number>((sum, count) => sum + count, 0)
    : 0

  let presenceLabel = 'Offline'
  let presenceDotClass = 'bg-red-500'

  if (user.isAnonymous) {
    presenceLabel = 'Guest'
    presenceDotClass = 'bg-muted-foreground/60'
  } else if (effectiveOnline) {
    presenceLabel = 'Online'
    presenceDotClass = 'bg-green-500'
  }

  const handleSignOut = async () => {
    try {
      setOpen(false)
      signOutViaLogoutRoute()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const profileTrigger = (
    <button
      className={cn(
        'flex items-center gap-3 rounded-full bg-background/80 px-2.5 py-1.5 shadow-sm transition-colors hover:bg-muted/50 cursor-pointer',
        collapsed ? 'justify-center w-full p-2' : 'flex-1'
      )}
      type="button"
      aria-label="Open user menu"
    >
      <UserAvatar
        src={user.avatarUrl}
        alt={user.username}
        size="md"
        className="shrink-0"
      />
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0 text-left">
            <div className="font-medium text-sm truncate">{user.username}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-block h-2 w-2 rounded-full',
                  presenceDotClass
                )}
                aria-hidden="true"
              />
              <span>{presenceLabel}</span>
            </div>
          </div>
        </>
      )}
    </button>
  )

  return (
    <div className="border-t border-border p-3">
      <div
        className={cn(
          'flex items-center gap-2',
          collapsed ? 'flex-col' : 'flex-row'
        )}
      >
        {hasHydrated ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{profileTrigger}</PopoverTrigger>
            <PopoverContent
              side="top"
              align={collapsed ? 'center' : 'start'}
              className="w-56 p-2"
            >
              <div className="flex items-center gap-3 px-2 py-1.5 mb-2">
                <UserAvatar
                  src={user.avatarUrl}
                  alt={user.username}
                  size="md"
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {user.username}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-block h-2 w-2 rounded-full',
                        presenceDotClass
                      )}
                      aria-hidden="true"
                    />
                    <span>{presenceLabel}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border mb-2" />

              {!user.isAnonymous && (
                <Button
                  variant="ghost"
                  className="w-full cursor-pointer justify-start gap-2"
                  onClick={() => {
                    setOpen(false)
                    router.push('/settings')
                  }}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Button>
              )}

              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className="text-sm text-muted-foreground">Theme</span>
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              </div>

              <div className="border-t border-border my-2" />

              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>{user.isAnonymous ? 'Log Out' : 'Sign Out'}</span>
              </Button>
            </PopoverContent>
          </Popover>
        ) : (
          profileTrigger
        )}

        {hasHydrated ? (
          <NotificationDropdown
            initialGroups={initialGroups}
            initialPersonalChats={initialPersonalChats}
            includePersonalChats={!user.isAnonymous}
          >
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full bg-background/80 shadow-sm hover:bg-muted/50 cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </NotificationDropdown>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-full bg-background/80 shadow-sm hover:bg-muted/50 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        )}
      </div>
    </div>
  )
}
