import type { User } from '@supabase/supabase-js'
import { getServiceClient } from '@/lib/supabase/server'
import { getChatUserProfiles, searchChatUsers } from '@/lib/supabase/db/users'
import {
  resolveGroupAccess,
  resolveRoomAccess,
  type AuthViewer
} from './access'
import type {
  CreateChannelRequest,
  CreateGroupRequest,
  GroupMembersResponse,
  RoomMembersResponse,
  UpdateGroupMemberRequest
} from '@/lib/types/api'
import type {
  DatabaseGroup,
  DatabaseRoom,
  GroupMembership,
  GroupPermissions,
  GroupView
} from '@/lib/types/database'

const compareByName = <T extends { name: string }>(a: T, b: T) =>
  a.name.localeCompare(b.name)

const toViewer = (user: User): AuthViewer => ({
  id: user.id,
  is_anonymous: user.is_anonymous
})

function derivePermissions(
  group: DatabaseGroup,
  membership: GroupMembership | null,
  viewer: AuthViewer
): GroupPermissions {
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

    return {
      is_member: false,
      is_owner: false,
      can_read: false,
      can_write: false,
      can_admin: false
    }
  }

  const isOwner = membership.is_owner
  const canAdmin = isOwner || membership.can_admin
  const canWrite = canAdmin || membership.can_write
  const canRead = canWrite || membership.can_read

  return {
    is_member: true,
    is_owner: isOwner,
    can_read: canRead,
    can_write: canWrite,
    can_admin: canAdmin
  }
}

function canReadGroupRoom(
  room: DatabaseRoom,
  permissions: GroupPermissions,
  roomMembership: boolean,
  viewerId: string
): boolean {
  if (room.visibility !== 'private') {
    return permissions.can_read
  }

  return (
    permissions.can_read &&
    (roomMembership ||
      permissions.can_admin ||
      permissions.is_owner ||
      room.created_by === viewerId)
  )
}

export async function listGroupsForViewer(user: User): Promise<GroupView[]> {
  const viewer = toViewer(user)
  const supabase = getServiceClient()
  const [
    { data: groups, error: groupsError },
    { data: rooms, error: roomsError }
  ] = await Promise.all([
    supabase.from('groups').select('*').order('name', { ascending: true }),
    supabase
      .from('rooms')
      .select('*')
      .eq('kind', 'group')
      .order('name', { ascending: true })
  ])

  if (groupsError || roomsError) {
    console.error('Error listing groups:', groupsError || roomsError)
    throw new Error('Failed to load groups')
  }

  const [
    { data: memberships, error: membershipsError },
    { data: roomMemberships, error: roomMembershipsError }
  ] = await Promise.all([
    supabase.from('group_memberships').select('*').eq('user_id', user.id),
    supabase.from('room_memberships').select('*').eq('user_id', user.id)
  ])

  if (membershipsError || roomMembershipsError) {
    console.error(
      'Error resolving memberships:',
      membershipsError || roomMembershipsError
    )
    throw new Error('Failed to resolve group memberships')
  }

  const membershipMap = new Map(
    (memberships || []).map((membership) => [membership.group_id, membership])
  )
  const roomMembershipSet = new Set(
    (roomMemberships || []).map((membership) => membership.room_id)
  )

  return (groups || [])
    .map((group) => {
      const membership = membershipMap.get(group.id) || null
      const permissions = derivePermissions(group, membership, viewer)
      if (!permissions.can_read) {
        return null
      }

      const channels = (rooms || [])
        .filter((room) => room.group_id === group.id)
        .filter((room) =>
          canReadGroupRoom(
            room,
            permissions,
            roomMembershipSet.has(room.id),
            user.id
          )
        )
        .toSorted(compareByName)
        .map((room) => ({
          room,
          permissions
        }))

      return {
        group,
        permissions,
        channels
      } satisfies GroupView
    })
    .filter((group): group is GroupView => !!group)
}

export async function listFlattenedReadableGroupRooms(
  user: User
): Promise<DatabaseRoom[]> {
  const groups = await listGroupsForViewer(user)
  return groups.flatMap((group) => group.channels.map((entry) => entry.room))
}

export async function getGroupForViewer(
  groupId: string,
  user: User
): Promise<GroupView> {
  const groups = await listGroupsForViewer(user)
  const group = groups.find((entry) => entry.group.id === groupId)

  if (!group) {
    throw new Error('Group not found or unauthorized')
  }

  return group
}

export async function createGroupForViewer(
  user: User,
  input: CreateGroupRequest
): Promise<DatabaseGroup> {
  const supabase = getServiceClient()
  const normalizedName = input.name.trim()
  const { data: existing } = await supabase
    .from('groups')
    .select('id')
    .ilike('name', normalizedName)

  if ((existing || []).length > 0) {
    throw new Error('A group with this name already exists')
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: normalizedName,
      description: input.description?.trim() || null,
      visibility: input.visibility || 'public',
      created_by: user.id
    })
    .select('*')
    .single()

  if (error || !group) {
    console.error('Error creating group:', error)
    throw new Error('Failed to create group')
  }

  const memberIds = [
    user.id,
    ...new Set(
      (input.memberUserIds || []).filter((userId) => userId !== user.id)
    )
  ]
  const memberships = memberIds.map((userId) => ({
    group_id: group.id,
    user_id: userId,
    is_owner: userId === user.id,
    can_read: true,
    can_write: true,
    can_admin: userId === user.id
  }))

  const { error: membershipError } = await supabase
    .from('group_memberships')
    .insert(memberships)

  if (membershipError) {
    console.error('Error creating group memberships:', membershipError)
    throw new Error('Failed to initialize group memberships')
  }

  return group
}

export async function joinPublicGroupForViewer(
  groupId: string,
  user: User
): Promise<GroupMembership> {
  const access = await resolveGroupAccess(groupId, toViewer(user))
  if (access.group.visibility !== 'public') {
    throw new Error('Only public groups can be joined directly')
  }

  if (access.membership) {
    return access.membership
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('group_memberships')
    .insert({
      group_id: groupId,
      user_id: user.id,
      is_owner: false,
      can_read: true,
      can_write: true,
      can_admin: false
    })
    .select('*')
    .single()

  if (error || !data) {
    console.error('Error joining group:', error)
    throw new Error('Failed to join group')
  }

  return data
}

export async function createChannelForViewer(
  groupId: string,
  user: User,
  input: CreateChannelRequest
): Promise<DatabaseRoom> {
  const access = await resolveGroupAccess(groupId, toViewer(user), {
    autoJoinForWrite: true
  })

  if (!access.permissions.can_write) {
    throw new Error(
      'You do not have permission to create channels in this group'
    )
  }

  if (input.visibility === 'private' && access.group.visibility !== 'private') {
    throw new Error('Private channels are only allowed inside private groups')
  }

  const supabase = getServiceClient()
  const normalizedName = input.name.trim()
  const { data: existing } = await supabase
    .from('rooms')
    .select('id')
    .eq('group_id', groupId)
    .eq('kind', 'group')
    .ilike('name', normalizedName)

  if ((existing || []).length > 0) {
    throw new Error('A channel with this name already exists in this group')
  }

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      name: normalizedName,
      description: input.description?.trim() || null,
      kind: 'group',
      group_id: groupId,
      visibility: input.visibility || 'public',
      created_by: user.id,
      owner_user_id: null,
      ai_enabled: false,
      ai_model: null
    })
    .select('*')
    .single()

  if (error || !data) {
    console.error('Error creating channel:', error)
    throw new Error('Failed to create channel')
  }

  return data
}

async function requireGroupAdmin(groupId: string, user: User) {
  const access = await resolveGroupAccess(groupId, toViewer(user))
  if (!access.permissions.can_admin && !access.permissions.is_owner) {
    throw new Error(
      'You do not have permission to manage members in this group'
    )
  }
  return access
}

export async function listGroupMembersForViewer(
  groupId: string,
  user: User
): Promise<GroupMembersResponse> {
  await requireGroupAdmin(groupId, user)
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('group_id', groupId)

  if (error) {
    console.error('Error listing group members:', error)
    throw new Error('Failed to load group members')
  }

  const profileMap = await getChatUserProfiles(
    (data || []).map((membership) => membership.user_id)
  )

  return {
    members: (data || [])
      .map((membership) => ({
        membership,
        profile: profileMap.get(membership.user_id) || null
      }))
      .toSorted((a, b) =>
        (a.profile?.display_name || '').localeCompare(
          b.profile?.display_name || ''
        )
      )
  }
}

export async function addGroupMembersForViewer(
  groupId: string,
  user: User,
  userIds: string[]
): Promise<GroupMembersResponse> {
  await requireGroupAdmin(groupId, user)
  const supabase = getServiceClient()
  const { error } = await supabase.from('group_memberships').upsert(
    userIds.map((userId) => ({
      group_id: groupId,
      user_id: userId,
      is_owner: false,
      can_read: true,
      can_write: true,
      can_admin: false
    })),
    {
      onConflict: 'group_id,user_id',
      ignoreDuplicates: false
    }
  )

  if (error) {
    console.error('Error adding group members:', error)
    throw new Error('Failed to add group members')
  }

  return listGroupMembersForViewer(groupId, user)
}

export async function updateGroupMemberForViewer(
  groupId: string,
  targetUserId: string,
  user: User,
  input: UpdateGroupMemberRequest
): Promise<GroupMembersResponse> {
  await requireGroupAdmin(groupId, user)
  const supabase = getServiceClient()
  const { data: currentMembership, error: membershipError } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)
    .single()

  if (membershipError || !currentMembership) {
    throw new Error('Member not found')
  }

  if (currentMembership.is_owner) {
    throw new Error('Owner permissions cannot be edited')
  }

  const { error } = await supabase
    .from('group_memberships')
    .update({
      can_read: input.canRead,
      can_write: input.canWrite,
      can_admin: input.canAdmin
    })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)

  if (error) {
    console.error('Error updating group member:', error)
    throw new Error('Failed to update member permissions')
  }

  return listGroupMembersForViewer(groupId, user)
}

export async function removeGroupMemberForViewer(
  groupId: string,
  targetUserId: string,
  user: User
): Promise<GroupMembersResponse> {
  await requireGroupAdmin(groupId, user)
  const supabase = getServiceClient()
  const { data: currentMembership, error: membershipError } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)
    .single()

  if (membershipError || !currentMembership) {
    throw new Error('Member not found')
  }

  if (currentMembership.is_owner) {
    throw new Error('Owner membership cannot be removed')
  }

  const { error } = await supabase
    .from('group_memberships')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)

  if (error) {
    console.error('Error removing group member:', error)
    throw new Error('Failed to remove group member')
  }

  const { error: privateRoomsError } = await supabase
    .from('room_memberships')
    .delete()
    .in(
      'room_id',
      (
        (
          await supabase
            .from('rooms')
            .select('id')
            .eq('group_id', groupId)
            .eq('visibility', 'private')
        ).data || []
      ).map((room) => room.id)
    )
    .eq('user_id', targetUserId)

  if (privateRoomsError) {
    console.error('Error pruning private room memberships:', privateRoomsError)
  }

  return listGroupMembersForViewer(groupId, user)
}

async function requirePrivateRoomManager(roomId: string, user: User) {
  const access = await resolveRoomAccess(roomId, toViewer(user))
  if (access.room.kind !== 'group' || access.room.visibility !== 'private') {
    throw new Error('Only private group channels have channel members')
  }
  if (
    !access.permissions?.can_admin &&
    !access.permissions?.is_owner &&
    access.room.created_by !== user.id
  ) {
    throw new Error('You do not have permission to manage this channel')
  }
  return access
}

export async function listRoomMembersForViewer(
  roomId: string,
  user: User
): Promise<RoomMembersResponse> {
  await requirePrivateRoomManager(roomId, user)
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('room_memberships')
    .select('*')
    .eq('room_id', roomId)

  if (error) {
    console.error('Error listing room members:', error)
    throw new Error('Failed to load channel members')
  }

  const profileMap = await getChatUserProfiles(
    (data || []).map((membership) => membership.user_id)
  )

  return {
    members: (data || [])
      .map((membership) => ({
        membership,
        profile: profileMap.get(membership.user_id) || null
      }))
      .toSorted((a, b) =>
        (a.profile?.display_name || '').localeCompare(
          b.profile?.display_name || ''
        )
      )
  }
}

export async function addRoomMembersForViewer(
  roomId: string,
  user: User,
  userIds: string[]
): Promise<RoomMembersResponse> {
  const access = await requirePrivateRoomManager(roomId, user)
  const groupId = access.room.group_id
  if (!groupId) {
    throw new Error('Private room missing group reference')
  }

  const supabase = getServiceClient()
  const { data: groupMembers, error: groupMembersError } = await supabase
    .from('group_memberships')
    .select('user_id')
    .eq('group_id', groupId)

  if (groupMembersError) {
    console.error(
      'Error loading group members for room membership:',
      groupMembersError
    )
    throw new Error('Failed to validate group membership')
  }

  const allowedUserIds = new Set(
    (groupMembers || []).map((member) => member.user_id)
  )
  const invalidUserId = userIds.find((userId) => !allowedUserIds.has(userId))
  if (invalidUserId) {
    throw new Error(
      'User must be a group member before being added to this channel'
    )
  }

  const { error } = await supabase.from('room_memberships').upsert(
    userIds.map((userId) => ({
      room_id: roomId,
      user_id: userId,
      added_by: user.id
    })),
    {
      onConflict: 'room_id,user_id',
      ignoreDuplicates: false
    }
  )

  if (error) {
    console.error('Error adding room members:', error)
    throw new Error('Failed to add channel members')
  }

  return listRoomMembersForViewer(roomId, user)
}

export async function removeRoomMemberForViewer(
  roomId: string,
  targetUserId: string,
  user: User
): Promise<RoomMembersResponse> {
  await requirePrivateRoomManager(roomId, user)
  const supabase = getServiceClient()
  const { error } = await supabase
    .from('room_memberships')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', targetUserId)

  if (error) {
    console.error('Error removing room member:', error)
    throw new Error('Failed to remove channel member')
  }

  return listRoomMembersForViewer(roomId, user)
}

export async function searchGroupUsersForViewer(
  user: User,
  query?: string,
  limit: number = 50
) {
  return {
    users: await searchChatUsers(user.id, query, limit)
  }
}
