'use client'

import { RoomList } from './room-list'
import { UserSection } from './user-section'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Home } from 'lucide-react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useUIStore } from '@/lib/stores/ui-store'
import { cn } from '@/lib/utils'
import type {
  DatabaseRoom,
  GroupView,
  PersonalChat
} from '@/lib/types/database'
import type { SidebarSection } from '@/lib/types/ui'
import type { PublicUser } from '@/lib/types/user'
import { useActiveRoomId } from '@/hooks/use-active-room-id'

interface SidebarProps {
  user: PublicUser
  initialGroups: GroupView[]
  initialGroupChannels: DatabaseRoom[]
  initialPersonalChats: PersonalChat[]
  initialDefaultRoomId: string | null
  collapsed: boolean
  onNavigate?: () => void
}

export function Sidebar({
  user,
  initialGroups,
  initialGroupChannels,
  initialPersonalChats,
  collapsed,
  onNavigate
}: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const activeRoomId = useActiveRoomId()
  const {
    toggleSidebar,
    sidebarSection,
    setSidebarSection,
    openExpandedGroup,
    hasHydrated
  } = useUIStore()

  const activeGroupId = params?.groupId as string | undefined
  let routeSidebarSection: SidebarSection | null = null
  if (pathname.startsWith('/personal')) {
    routeSidebarSection = 'personal'
  } else if (pathname.startsWith('/group')) {
    routeSidebarSection = 'groups'
  }
  const effectiveSidebarSection = user.isAnonymous
    ? 'groups'
    : routeSidebarSection || (hasHydrated ? sidebarSection : 'groups')

  useEffect(() => {
    if (pathname.startsWith('/personal')) {
      setSidebarSection('personal')
    } else if (pathname.startsWith('/group')) {
      setSidebarSection('groups')
    }
  }, [pathname, setSidebarSection])

  useEffect(() => {
    if (!pathname.startsWith('/group/') || !activeGroupId) {
      return
    }

    openExpandedGroup(activeGroupId)
  }, [activeGroupId, openExpandedGroup, pathname])

  useEffect(() => {
    if (!hasHydrated || user.isAnonymous) {
      return
    }

    if (sidebarSection === 'personal' && pathname === '/') {
      router.replace('/personal')
      onNavigate?.()
    }
  }, [
    hasHydrated,
    onNavigate,
    pathname,
    router,
    sidebarSection,
    user.isAnonymous
  ])

  const handleHomeClick = () => {
    router.push(effectiveSidebarSection === 'personal' ? '/personal' : '/')
    onNavigate?.()
  }

  const handleSectionChange = (section: SidebarSection) => {
    setSidebarSection(section)
    if (section === 'personal') {
      router.push('/personal')
    } else if (pathname.startsWith('/personal')) {
      router.push('/')
    }
    onNavigate?.()
  }

  return (
    <nav
      className="relative h-full flex flex-col"
      aria-label="Main navigation"
      role="navigation"
    >
      {!onNavigate && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'absolute left-full top-4 z-20 h-7 w-7 -translate-x-1/2 rounded-full border-border !bg-background dark:!bg-background shadow-sm cursor-pointer',
            'hover:bg-accent hover:text-accent-foreground'
          )}
          onClick={toggleSidebar}
        >
          {collapsed ? (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="sr-only">Expand sidebar</span>
            </>
          ) : (
            <>
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="sr-only">Collapse sidebar</span>
            </>
          )}
        </Button>
      )}

      {/* Logo / App name */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 cursor-pointer"
                onClick={handleHomeClick}
                title="Go to home"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Go to home</span>
              </Button>
              <button
                type="button"
                onClick={handleHomeClick}
                className="cursor-pointer text-lg font-bold hover:text-primary transition-colors"
                title="Go to home"
              >
                Realtime Chat
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 w-full">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={handleHomeClick}
              title="Go to home"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">Go to home</span>
            </Button>
          </div>
        )}
      </div>

      {/* Room list */}
      <RoomList
        activeRoomId={activeRoomId || null}
        activeSection={effectiveSidebarSection}
        collapsed={collapsed}
        initialGroups={initialGroups}
        initialGroupChannels={initialGroupChannels}
        initialPersonalChats={initialPersonalChats}
        user={user}
        onSectionChange={handleSectionChange}
        onNavigate={onNavigate}
      />

      {/* User section at bottom */}
      <UserSection
        user={user}
        collapsed={collapsed}
        initialGroups={initialGroups}
        initialPersonalChats={initialPersonalChats}
      />
    </nav>
  )
}
