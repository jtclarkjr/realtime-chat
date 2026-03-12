'use client'

import { Button } from '@/components/ui/button'
import { Menu, Hash, LogOut, Users, Sparkles } from 'lucide-react'
import { useUIStore } from '@/lib/stores/ui-store'
import { useGroups, usePersonalChats, useRoomById } from '@/lib/query/queries'
import { PresenceAvatars } from './presence-avatars'
import { useParams } from 'next/navigation'
import type { PublicUser } from '@/lib/types/user'
import type { GroupView, PersonalChat } from '@/lib/types/database'
import { signOutViaLogoutRoute } from '@/lib/auth/client'
import { getConversationRouteContext } from '@/lib/utils/chat-routes'
import { MemberManagementDialog } from './member-management-dialog'
import { useState } from 'react'
import { useUpdatePersonalChat } from '@/lib/query/mutations'
import { toast } from 'sonner'
import { ConversationIcon } from './conversation-icon'

interface TopBarProps {
  user: PublicUser
  initialGroups: GroupView[]
  initialPersonalChats: PersonalChat[]
}

export function TopBar({
  user,
  initialGroups,
  initialPersonalChats
}: TopBarProps) {
  const params = useParams()
  const { setMobileDrawerOpen, roomPresenceUsers, openCreateChannelDialog } =
    useUIStore()
  const { data: groups = [] } = useGroups({
    initialData: initialGroups.length > 0 ? initialGroups : undefined,
    enabled: true
  })
  const { data: personalChats = [] } = usePersonalChats({
    initialData:
      initialPersonalChats.length > 0 ? initialPersonalChats : undefined,
    enabled: !user.isAnonymous
  })
  const [showMemberManager, setShowMemberManager] = useState(false)
  const updatePersonalChatMutation = useUpdatePersonalChat()
  const routeContext = getConversationRouteContext(params)
  const currentRoomId = routeContext.roomId || undefined
  const { data: roomById } = useRoomById({
    roomId: currentRoomId || '',
    enabled: !!currentRoomId
  })

  const allRooms = [
    ...groups.flatMap((group) => group.channels.map((entry) => entry.room)),
    ...personalChats
  ]
  const currentRoom = currentRoomId
    ? allRooms.find((room) => room.id === currentRoomId) || roomById || null
    : null
  const currentGroup = routeContext.groupId
    ? groups.find((group) => group.group.id === routeContext.groupId) || null
    : groups.find((group) =>
        group.channels.some((entry) => entry.room.id === currentRoomId)
      ) || null
  const presenceUsers = currentRoomId
    ? roomPresenceUsers[currentRoomId] || {}
    : {}
  const canManageMembers =
    !!currentRoom &&
    currentRoom.kind === 'group' &&
    !!currentGroup &&
    currentGroup.permissions.can_admin
  const canCreateChannel =
    !user.isAnonymous && !!currentGroup && currentGroup.permissions.can_write
  let currentRoomDescription = 'Group channel'

  if (currentRoom?.kind === 'personal') {
    currentRoomDescription = currentRoom.ai_enabled
      ? 'Personal AI chat'
      : 'Personal chat with AI disabled'
  } else if (currentGroup && currentRoom) {
    currentRoomDescription = `${currentGroup.group.name} ${
      currentRoom.description || ''
    }`.trim()
  } else if (currentRoom?.description) {
    currentRoomDescription = currentRoom.description
  }

  const handleTogglePersonalAI = async () => {
    if (!currentRoom || currentRoom.kind !== 'personal') {
      return
    }

    try {
      await updatePersonalChatMutation.mutateAsync({
        chatId: currentRoom.id,
        data: {
          aiEnabled: !currentRoom.ai_enabled
        }
      })
      toast.success(
        currentRoom.ai_enabled ? 'Personal AI disabled' : 'Personal AI enabled'
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update personal chat'
      )
    }
  }

  if (!currentRoom) {
    return (
      <header className="md:hidden border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
            <h1 className="font-semibold text-base truncate">Home</h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={signOutViaLogoutRoute}
            title={user.isAnonymous ? 'Log Out' : 'Sign Out'}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">
              {user.isAnonymous ? 'Log Out' : 'Sign Out'}
            </span>
          </Button>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          {/* Left side - Mobile menu or Room info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>

            <div className="flex items-center gap-3 min-w-0">
              <ConversationIcon
                room={currentRoom}
                className="h-5 w-5 shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <h1 className="font-semibold text-base truncate">
                  {currentRoom.name}
                </h1>
                <p className="text-xs text-muted-foreground truncate hidden sm:block">
                  {currentRoomDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Presence and actions */}
          <div className="flex items-center gap-2">
            {currentRoom.kind === 'personal' && !user.isAnonymous && (
              <Button
                type="button"
                variant={currentRoom.ai_enabled ? 'default' : 'outline'}
                size="sm"
                onClick={handleTogglePersonalAI}
                disabled={updatePersonalChatMutation.isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {currentRoom.ai_enabled ? 'AI On' : 'AI Off'}
              </Button>
            )}
            {canCreateChannel && currentGroup && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  openCreateChannelDialog(
                    currentGroup.group.id,
                    currentGroup.group.visibility
                  )
                }
              >
                <Hash className="mr-2 h-4 w-4" />
                Add channel
              </Button>
            )}
            {canManageMembers && currentGroup && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMemberManager(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Members
              </Button>
            )}
            {Object.keys(presenceUsers).length > 0 && (
              <div className="shrink-0">
                <PresenceAvatars
                  presenceUsers={presenceUsers}
                  currentUserId={user.id}
                  maxVisible={5}
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              onClick={signOutViaLogoutRoute}
              title={user.isAnonymous ? 'Log Out' : 'Sign Out'}
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">
                {user.isAnonymous ? 'Log Out' : 'Sign Out'}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {currentGroup && currentRoom.kind === 'group' && (
        <MemberManagementDialog
          open={showMemberManager}
          onOpenChange={setShowMemberManager}
          group={currentGroup}
          room={currentRoom}
        />
      )}
    </>
  )
}
