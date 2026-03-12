import type { User } from '@supabase/supabase-js'
import { getServiceClient } from '@/lib/supabase/server'
import type {
  DatabaseGroup,
  DatabaseRoom,
  GroupMembership,
  GroupPermissions,
  RoomMembership
} from '@/lib/types/database'

export type AuthViewer = Pick<User, 'id' | 'is_anonymous'>

export type GroupAccessContext = {
  group: DatabaseGroup
  membership: GroupMembership | null
  permissions: GroupPermissions
}

export type RoomAccessContext = {
  room: DatabaseRoom
  group: DatabaseGroup | null
  membership: GroupMembership | null
  roomMembership: RoomMembership | null
  permissions: GroupPermissions | null
  canRead: boolean
  canWrite: boolean
}

const defaultPermissions = (): GroupPermissions => ({
  is_member: false,
  is_owner: false,
  can_read: false,
  can_write: false,
  can_admin: false
})

const normalizePermissions = (
  membership: GroupMembership | null,
  group: DatabaseGroup,
  viewer: AuthViewer
): GroupPermissions => {
  if (!membership) {
    if (group.visibility === 'public') {
      return {
        is_member: false,
        is_owner: false,
        can_read: true,
        can_write: viewer.is_anonymous !== true,
        can_admin: false
      }
    }

    return defaultPermissions()
  }

  const isOwner = membership.is_owner === true
  const canAdmin = isOwner || membership.can_admin === true
  const canWrite = canAdmin || membership.can_write === true
  const canRead = canWrite || membership.can_read === true

  return {
    is_member: true,
    is_owner: isOwner,
    can_read: canRead,
    can_write: canWrite,
    can_admin: canAdmin
  }
}

const requireRoom = async (roomId: string): Promise<DatabaseRoom> => {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !data) {
    throw new Error('Room not found')
  }

  return data
}

const requireGroup = async (groupId: string): Promise<DatabaseGroup> => {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (error || !data) {
    throw new Error('Group not found')
  }

  return data
}

const getGroupMembership = async (
  groupId: string,
  userId: string
): Promise<GroupMembership | null> => {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching group membership:', error)
    throw new Error('Failed to resolve group membership')
  }

  return data
}

const getRoomMembership = async (
  roomId: string,
  userId: string
): Promise<RoomMembership | null> => {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching room membership:', error)
    throw new Error('Failed to resolve room membership')
  }

  return data
}

async function ensurePublicGroupMembership(
  group: DatabaseGroup,
  viewer: AuthViewer
): Promise<GroupMembership | null> {
  if (group.visibility !== 'public' || viewer.is_anonymous === true) {
    return null
  }

  const existingMembership = await getGroupMembership(group.id, viewer.id)
  if (existingMembership) {
    return existingMembership
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('group_memberships')
    .insert({
      group_id: group.id,
      user_id: viewer.id,
      is_owner: false,
      can_read: true,
      can_write: true,
      can_admin: false
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error auto-joining public group:', error)
    throw new Error('Failed to join public group')
  }

  return data
}

export async function resolveGroupAccess(
  groupId: string,
  viewer: AuthViewer,
  options: {
    autoJoinForWrite?: boolean
  } = {}
): Promise<GroupAccessContext> {
  const group = await requireGroup(groupId)
  let membership = await getGroupMembership(groupId, viewer.id)

  if (!membership && options.autoJoinForWrite) {
    membership = await ensurePublicGroupMembership(group, viewer)
  }

  return {
    group,
    membership,
    permissions: normalizePermissions(membership, group, viewer)
  }
}

export async function resolveRoomAccess(
  roomId: string,
  viewer: AuthViewer,
  options: {
    autoJoinForWrite?: boolean
  } = {}
): Promise<RoomAccessContext> {
  const room = await requireRoom(roomId)

  if (room.kind === 'personal') {
    const ownerMatches =
      viewer.is_anonymous !== true && room.owner_user_id === viewer.id

    return {
      room,
      group: null,
      membership: null,
      roomMembership: null,
      permissions: null,
      canRead: ownerMatches,
      canWrite: ownerMatches
    }
  }

  if (!room.group_id) {
    throw new Error('Group room missing group_id')
  }

  const groupAccess = await resolveGroupAccess(room.group_id, viewer, {
    autoJoinForWrite: options.autoJoinForWrite
  })
  const roomMembership = await getRoomMembership(room.id, viewer.id)
  const permissions = groupAccess.permissions

  let canRead = permissions.can_read
  let canWrite = permissions.can_write

  if (room.visibility === 'private') {
    const canBypassPrivateMembership =
      permissions.can_admin ||
      permissions.is_owner ||
      room.created_by === viewer.id

    const hasPrivateMembership = !!roomMembership || canBypassPrivateMembership
    canRead = permissions.can_read && hasPrivateMembership
    canWrite = permissions.can_write && hasPrivateMembership
  }

  return {
    room,
    group: groupAccess.group,
    membership: groupAccess.membership,
    roomMembership,
    permissions,
    canRead,
    canWrite
  }
}

export async function touchRoomLastActivity(roomId: string): Promise<void> {
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('rooms')
    .update({
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', roomId)

  if (error) {
    console.error('Error touching room activity:', error)
    throw new Error('Failed to update room activity')
  }
}
