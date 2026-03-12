'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RealtimeChat } from '@/components/realtime-chat'
import { RoomOverlayControls } from '@/components/chat/room-overlay-controls'
import { RoomSkeleton } from '@/components/skeletons'
import { Button } from '@/components/ui/button'
import {
  useDeleteChannel,
  useDeletePersonalChat,
  useUpdatePersonalChat
} from '@/lib/query/mutations'
import { useGroupById, useRoomById } from '@/lib/query/queries'
import { deriveRoomControlsPermissions } from '@/lib/services/layout/room-controls-service'
import { useEffect, useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useUIStore } from '@/lib/stores/ui-store'
import type { PersonalChat } from '@/lib/types/database'
import type { PresenceState } from '@/lib/types/presence'
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user'

interface RoomClientProps {
  roomId: string
}

export function RoomClient({ roomId }: RoomClientProps) {
  const router = useRouter()
  const user = useAuthenticatedUser()
  const deleteChannelMutation = useDeleteChannel()
  const deletePersonalChatMutation = useDeletePersonalChat()
  const updatePersonalChatMutation = useUpdatePersonalChat()
  const { addRecentRoom, markAsRead, setRoomPresence, setRoomPresenceUsers } =
    useUIStore()
  const pendingInitialAI = useUIStore(
    (state) => state.pendingPersonalAI[roomId] || null
  )
  const {
    data: room,
    isLoading,
    isFetching,
    isError
  } = useRoomById({
    roomId,
    enabled: !!roomId
  })
  const activeRoomId = room?.id ?? roomId
  const [presenceUsers, setPresenceUsers] = useState<PresenceState>({})
  const { data: group } = useGroupById({
    groupId: room?.group_id || '',
    enabled: room?.kind === 'group' && !!room?.group_id
  })

  const userId = user.id
  const displayName = user.username

  const handlePresenceChange = useCallback(
    (users: PresenceState) => {
      setPresenceUsers(users)
      const onlineCount = Object.keys(users).length
      setRoomPresence(activeRoomId, onlineCount)
      setRoomPresenceUsers(activeRoomId, users)
    },
    [activeRoomId, setRoomPresence, setRoomPresenceUsers]
  )

  useEffect(() => {
    if (activeRoomId) {
      addRecentRoom(activeRoomId)
      markAsRead(activeRoomId)
    }
  }, [activeRoomId, addRecentRoom, markAsRead])

  useEffect(() => {
    setPresenceUsers({})
  }, [activeRoomId])

  useEffect(() => {
    router.prefetch('/')
  }, [router])

  if (isError) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Conversation Not Found</h1>
          <p className="text-muted-foreground">
            The conversation you&apos;re looking for doesn&apos;t exist or is no
            longer available.
          </p>
          <Button asChild>
            <Link href="/">Go Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!userId || !room || (isLoading && !room) || (isFetching && !room)) {
    return <RoomSkeleton />
  }

  const isPersonalRoom = room.kind === 'personal'
  const { canDeleteRoom, canManageChannelMembers, canShowRoomActions } =
    deriveRoomControlsPermissions({
      user,
      room,
      group: group ?? null,
      isPersonalRoom
    })

  const handleDeleteRoom = async (): Promise<void> => {
    if (isPersonalRoom) {
      try {
        const response = await deletePersonalChatMutation.mutateAsync({
          chatId: room.id
        })

        if (!response.success) {
          toast.error('Failed to delete chat')
          return
        }

        toast.success(`Deleted ${room.name}`)
        router.push('/personal')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to delete chat'
        )
      }

      return
    }

    if (!room.group_id) {
      toast.error('Unable to determine which group owns this channel')
      return
    }

    try {
      const response = await deleteChannelMutation.mutateAsync({
        groupId: room.group_id,
        roomId: room.id
      })

      if (!response.success) {
        toast.error('Failed to delete channel')
        return
      }

      toast.success(`Deleted #${room.name}`)
      router.push('/')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete channel'
      )
    }
  }

  const handleTogglePersonalAI = async (): Promise<void> => {
    if (!isPersonalRoom) {
      return
    }

    try {
      await updatePersonalChatMutation.mutateAsync({
        chatId: room.id,
        data: {
          aiEnabled: !room.ai_enabled
        }
      })
      toast.success(
        room.ai_enabled ? 'Personal AI disabled' : 'Personal AI enabled'
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update personal chat'
      )
    }
  }

  return (
    <div className="relative h-full flex flex-col bg-background">
      <RoomOverlayControls
        room={room}
        personalChat={isPersonalRoom ? (room as PersonalChat) : null}
        group={isPersonalRoom ? null : (group ?? null)}
        currentUserId={userId}
        presenceUsers={presenceUsers}
        controls={{
          canDeleteRoom,
          canManageChannelMembers,
          canShowRoomActions,
          onDelete: handleDeleteRoom,
          onTogglePersonalAI: isPersonalRoom
            ? handleTogglePersonalAI
            : undefined,
          deletePending:
            deletePersonalChatMutation.isPending ||
            deleteChannelMutation.isPending
        }}
      />
      <RealtimeChat
        roomId={activeRoomId}
        mode={room.kind}
        username={displayName}
        userId={userId}
        userAvatarUrl={user.avatarUrl}
        onPresenceChange={handlePresenceChange}
        isAnonymous={user.isAnonymous}
        initialAIEnabled={room.ai_enabled}
        allowPrivateAI={room.kind !== 'personal'}
        personalAIModel={room.kind === 'personal' ? room.ai_model : null}
        pendingInitialAI={room.kind === 'personal' ? pendingInitialAI : null}
      />
    </div>
  )
}
