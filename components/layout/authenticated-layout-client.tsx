'use client'

import { useEffect } from 'react'
import { Sidebar } from './sidebar'
import { MobileSidebarToggle } from './mobile-sidebar-toggle'
import { UnreadMessageTracker } from './unread-message-tracker'
import { AnonymousBanner } from '@/components/anonymous-banner'
import { useUIStore } from '@/lib/stores/ui-store'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle
} from '@/components/ui/sheet'
import { usePathname } from 'next/navigation'
import { RoomsRealtimeSync } from './rooms-realtime-sync'
import { AuthenticatedUserProvider } from './authenticated-user-context'
import { NavigationDialogs } from './navigation-dialogs'
import type {
  DatabaseRoom,
  GroupView,
  PersonalChat
} from '@/lib/types/database'
import type { PublicUser } from '@/lib/types/user'
import { cn } from '@/lib/utils'
import { getConversationRouteContextFromPathname } from '@/lib/utils/chat-routes'

interface AuthenticatedLayoutClientProps {
  user: PublicUser
  initialGroups: GroupView[]
  initialGroupChannels: DatabaseRoom[]
  initialPersonalChats: PersonalChat[]
  initialDefaultRoomId: string | null
  children: React.ReactNode
}

export function AuthenticatedLayoutClient({
  user,
  initialGroups,
  initialGroupChannels,
  initialPersonalChats,
  initialDefaultRoomId,
  children
}: AuthenticatedLayoutClientProps) {
  const pathname = usePathname()
  const {
    sidebarCollapsed,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    hasHydrated
  } = useUIStore()
  const effectiveSidebarCollapsed = hasHydrated ? sidebarCollapsed : false
  const effectiveMobileDrawerOpen = hasHydrated ? mobileDrawerOpen : false

  useEffect(() => {
    void useUIStore.persist.rehydrate()
  }, [])

  const { roomId } = getConversationRouteContextFromPathname(pathname)
  const announcement = roomId
    ? `Navigated to room ${roomId}`
    : 'Navigated to dashboard'

  return (
    <AuthenticatedUserProvider user={user}>
      <div className="h-dvh flex flex-col w-full">
        <RoomsRealtimeSync userId={user.id} />
        <UnreadMessageTracker userId={user.id} />
        <NavigationDialogs initialGroups={initialGroups} />
        <MobileSidebarToggle />
        {user.isAnonymous && <AnonymousBanner />}

        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Sidebar - hidden on mobile */}
          <aside
            className={cn(
              'relative z-20 hidden md:flex flex-col overflow-visible border-r border-border bg-background transition-all duration-300 ease-in-out',
              effectiveSidebarCollapsed ? 'w-16' : 'w-60'
            )}
          >
            <Sidebar
              user={user}
              initialGroups={initialGroups}
              initialGroupChannels={initialGroupChannels}
              initialPersonalChats={initialPersonalChats}
              initialDefaultRoomId={initialDefaultRoomId}
              collapsed={effectiveSidebarCollapsed}
            />
          </aside>

          {/* Mobile Sidebar Drawer */}
          <Sheet
            open={effectiveMobileDrawerOpen}
            onOpenChange={setMobileDrawerOpen}
          >
            <SheetContent side="left" className="p-0 w-60">
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SheetDescription className="sr-only">
                Browse rooms, open notifications, and manage your account.
              </SheetDescription>
              <Sidebar
                user={user}
                initialGroups={initialGroups}
                initialGroupChannels={initialGroupChannels}
                initialPersonalChats={initialPersonalChats}
                initialDefaultRoomId={initialDefaultRoomId}
                collapsed={false}
                onNavigate={() => setMobileDrawerOpen(false)}
              />
            </SheetContent>
          </Sheet>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">{children}</div>
          </main>
        </div>

        {/* Live region for screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
      </div>
    </AuthenticatedUserProvider>
  )
}
