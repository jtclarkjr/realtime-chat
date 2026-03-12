'use client'

import { useEffect, useState } from 'react'
import { Bot, MoreHorizontal, Trash2, Users } from 'lucide-react'
import { PresenceAvatars } from '@/components/layout/presence-avatars'
import { MemberManagementDialog } from '@/components/layout/member-management-dialog'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import type {
  DatabaseRoom,
  GroupView,
  PersonalChat
} from '@/lib/types/database'
import type { PresenceState } from '@/lib/types/presence'
import type { PublicUser } from '@/lib/types/user'

interface RoomOverlayControlsProps {
  room: DatabaseRoom
  personalChat?: PersonalChat | null
  group?: GroupView | null
  currentUserId: PublicUser['id']
  presenceUsers: PresenceState
  controls: {
    canDeleteRoom: boolean
    canManageChannelMembers: boolean
    canShowRoomActions: boolean
    onDelete: () => Promise<void>
    onTogglePersonalAI?: () => Promise<void>
    deletePending: boolean
  }
}

export function RoomOverlayControls({
  room,
  personalChat,
  group,
  currentUserId,
  presenceUsers,
  controls
}: RoomOverlayControlsProps) {
  const [showRoomActions, setShowRoomActions] = useState(false)
  const [showManageMembers, setShowManageMembers] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isPersonalRoom = room.kind === 'personal'
  const showPresence = Object.keys(presenceUsers).length > 0

  const {
    canDeleteRoom,
    canManageChannelMembers,
    canShowRoomActions,
    onDelete,
    onTogglePersonalAI,
    deletePending
  } = controls

  useEffect(() => {
    setShowRoomActions(false)
    setShowManageMembers(false)
    setShowDeleteConfirm(false)
  }, [room.id, room.kind])

  if (!showPresence && !canShowRoomActions) {
    return null
  }

  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-transparent backdrop-blur-md backdrop-brightness-95"
        style={{
          maskImage:
            'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.9) 60%, rgba(0, 0, 0, 0) 100%)'
        }}
      />

      <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-start gap-2 sm:right-4 sm:top-4">
        {showPresence && (
          <div className="pointer-events-auto">
            <PresenceAvatars
              presenceUsers={presenceUsers}
              currentUserId={currentUserId}
              maxVisible={5}
            />
          </div>
        )}

        {canShowRoomActions && (
          <Popover open={showRoomActions} onOpenChange={setShowRoomActions}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="pointer-events-auto h-9 w-9 cursor-pointer rounded-full border-border bg-background/90 shadow-sm backdrop-blur"
                title={`Actions for ${room.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions for {room.name}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1" sideOffset={6}>
              {isPersonalRoom && personalChat && (
                <Button
                  variant="ghost"
                  className="h-8 w-full cursor-pointer justify-start gap-2 px-2 text-xs"
                  onClick={() => void onTogglePersonalAI?.()}
                >
                  <Bot className="h-3.5 w-3.5" />
                  {personalChat.ai_enabled ? 'Disable AI' : 'Enable AI'}
                </Button>
              )}
              {canManageChannelMembers && (
                <Button
                  variant="ghost"
                  className="h-8 w-full cursor-pointer justify-start gap-2 px-2 text-xs"
                  onClick={() => {
                    setShowRoomActions(false)
                    setShowManageMembers(true)
                  }}
                >
                  <Users className="h-3.5 w-3.5" />
                  Manage members
                </Button>
              )}
              {canDeleteRoom && (
                <Button
                  variant="ghost"
                  className="h-8 w-full cursor-pointer justify-start gap-2 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => {
                    setShowRoomActions(false)
                    setShowDeleteConfirm(true)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {isPersonalRoom ? 'Delete chat' : 'Delete channel'}
                </Button>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>

      <ConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={isPersonalRoom ? 'Delete chat?' : 'Delete channel?'}
        description={
          isPersonalRoom
            ? `This will permanently delete ${room.name} and all its messages. This action cannot be undone.`
            : `This will permanently delete #${room.name} and all its messages. This action cannot be undone.`
        }
        confirmText={isPersonalRoom ? 'Delete chat' : 'Delete channel'}
        variant="destructive"
        onConfirm={onDelete}
        loading={deletePending}
      />

      {!isPersonalRoom && canManageChannelMembers && group && (
        <MemberManagementDialog
          open={showManageMembers}
          onOpenChange={setShowManageMembers}
          group={group}
          room={room}
        />
      )}
    </>
  )
}
