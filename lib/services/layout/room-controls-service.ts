import type { DatabaseRoom, GroupView } from '@/lib/types/database'
import type { PublicUser } from '@/lib/types/user'

export function deriveRoomControlsPermissions({
  user,
  room,
  group,
  isPersonalRoom
}: {
  user: PublicUser
  room: DatabaseRoom
  group: GroupView | null
  isPersonalRoom: boolean
}) {
  const canDeleteRoom =
    !user.isAnonymous &&
    (isPersonalRoom ||
      (!!group &&
        (group.permissions.can_admin ||
          group.permissions.is_owner ||
          (room.created_by === user.id && group.permissions.can_write))))

  const canManageChannelMembers =
    !user.isAnonymous &&
    !isPersonalRoom &&
    !!group &&
    room.visibility === 'private' &&
    (group.permissions.can_admin ||
      group.permissions.is_owner ||
      room.created_by === user.id)

  const canShowRoomActions =
    canDeleteRoom || canManageChannelMembers || isPersonalRoom

  return {
    canDeleteRoom,
    canManageChannelMembers,
    canShowRoomActions
  }
}
