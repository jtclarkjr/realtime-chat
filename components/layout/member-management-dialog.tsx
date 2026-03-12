'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  useAddGroupMembers,
  useAddRoomMembers,
  useRemoveGroupMember,
  useRemoveRoomMember,
  useUpdateGroupMember
} from '@/lib/query/mutations'
import {
  useGroupMembers,
  useGroupUsers,
  useRoomMembers
} from '@/lib/query/queries'
import type { DatabaseRoom, GroupView } from '@/lib/types/database'

interface MemberManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupView
  room?: DatabaseRoom | null
}

type GroupRole = 'owner' | 'admin' | 'member' | 'viewer'

const roleToPermissions: Record<
  Exclude<GroupRole, 'owner'>,
  {
    canRead: boolean
    canWrite: boolean
    canAdmin: boolean
  }
> = {
  admin: {
    canRead: true,
    canWrite: true,
    canAdmin: true
  },
  member: {
    canRead: true,
    canWrite: true,
    canAdmin: false
  },
  viewer: {
    canRead: true,
    canWrite: false,
    canAdmin: false
  }
}

function getMemberRole(
  member:
    | GroupView['permissions']
    | {
        is_owner: boolean
        can_admin: boolean
        can_write: boolean
      }
): GroupRole {
  if (member.is_owner) return 'owner'
  if (member.can_admin) return 'admin'
  if (member.can_write) return 'member'
  return 'viewer'
}

export function MemberManagementDialog({
  open,
  onOpenChange,
  group,
  room
}: MemberManagementDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roomSearchQuery, setRoomSearchQuery] = useState('')

  const { data: groupMembers = [] } = useGroupMembers({
    groupId: group.group.id,
    enabled: open
  })
  const { data: groupUsers = [] } = useGroupUsers({
    query: searchQuery,
    enabled: open
  })
  const { data: roomMembers = [] } = useRoomMembers({
    groupId: group.group.id,
    roomId: room?.id || '',
    enabled: open && !!room && room.visibility === 'private'
  })
  const { data: roomCandidates = [] } = useGroupUsers({
    query: roomSearchQuery,
    enabled: open && !!room && room.visibility === 'private'
  })

  const addGroupMembersMutation = useAddGroupMembers()
  const updateGroupMemberMutation = useUpdateGroupMember()
  const removeGroupMemberMutation = useRemoveGroupMember()
  const addRoomMembersMutation = useAddRoomMembers()
  const removeRoomMemberMutation = useRemoveRoomMember()

  const existingGroupMemberIds = useMemo(
    () => new Set(groupMembers.map((member) => member.membership.user_id)),
    [groupMembers]
  )
  const existingRoomMemberIds = useMemo(
    () => new Set(roomMembers.map((member) => member.membership.user_id)),
    [roomMembers]
  )

  const groupCandidates = groupUsers.filter(
    (candidate) => !existingGroupMemberIds.has(candidate.user_id)
  )
  const privateRoomCandidates = roomCandidates.filter(
    (candidate) =>
      existingGroupMemberIds.has(candidate.user_id) &&
      !existingRoomMemberIds.has(candidate.user_id)
  )

  const handleAddGroupMember = async (userId: string) => {
    try {
      await addGroupMembersMutation.mutateAsync({
        groupId: group.group.id,
        userIds: [userId]
      })
      setSearchQuery('')
      toast.success('Group member added')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add member'
      )
    }
  }

  const handleRoleChange = async (userId: string, role: GroupRole) => {
    if (role === 'owner') {
      return
    }

    try {
      await updateGroupMemberMutation.mutateAsync({
        groupId: group.group.id,
        userId,
        data: roleToPermissions[role]
      })
      toast.success('Permissions updated')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update permissions'
      )
    }
  }

  const handleRemoveGroupMember = async (userId: string) => {
    try {
      await removeGroupMemberMutation.mutateAsync({
        groupId: group.group.id,
        userId
      })
      toast.success('Group member removed')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove member'
      )
    }
  }

  const handleAddRoomMember = async (userId: string) => {
    if (!room) return

    try {
      await addRoomMembersMutation.mutateAsync({
        groupId: group.group.id,
        roomId: room.id,
        userIds: [userId]
      })
      setRoomSearchQuery('')
      toast.success('Channel member added')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add channel member'
      )
    }
  }

  const handleRemoveRoomMember = async (userId: string) => {
    if (!room) return

    try {
      await removeRoomMemberMutation.mutateAsync({
        groupId: group.group.id,
        roomId: room.id,
        userId
      })
      toast.success('Channel member removed')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to remove channel member'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Manage access</DialogTitle>
          <DialogDescription>
            Review group membership and private channel membership for this
            conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <div>
              <h3 className="font-medium">{group.group.name} members</h3>
              <p className="text-sm text-muted-foreground">
                Group admins can read, write, and manage channels. Viewers can
                only read visible content.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="group-member-search"
                className="text-sm font-medium"
              >
                Add people to this group
              </label>
              <Input
                id="group-member-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search users by name or email"
              />
              {searchQuery.trim().length > 0 && (
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                  {groupCandidates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No matching users available.
                    </p>
                  ) : (
                    groupCandidates.map((candidate) => (
                      <div
                        key={candidate.user_id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {candidate.display_name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {candidate.email || candidate.user_id}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            handleAddGroupMember(candidate.user_id)
                          }
                          disabled={addGroupMembersMutation.isPending}
                        >
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              {groupMembers.map((member) => {
                const role = getMemberRole(member.membership)

                return (
                  <div
                    key={member.membership.user_id}
                    className="flex items-center gap-3 rounded-lg border border-border px-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {member.profile?.display_name ||
                          member.membership.user_id}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {member.profile?.email || member.membership.user_id}
                      </div>
                    </div>
                    {role === 'owner' ? (
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                        Owner
                      </span>
                    ) : (
                      <>
                        <Select
                          value={role}
                          onValueChange={(value: GroupRole) =>
                            handleRoleChange(member.membership.user_id, value)
                          }
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRemoveGroupMember(member.membership.user_id)
                          }
                          disabled={removeGroupMemberMutation.isPending}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="font-medium">
                {room?.visibility === 'private'
                  ? `${room.name} channel members`
                  : 'Channel access'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {room?.visibility === 'private'
                  ? 'Private channels require both group access and channel membership.'
                  : 'This channel inherits access from the group. Private channel member management appears here when relevant.'}
              </p>
            </div>

            {room?.visibility === 'private' ? (
              <>
                <div className="space-y-2">
                  <label
                    htmlFor="room-member-search"
                    className="text-sm font-medium"
                  >
                    Add group members to this private channel
                  </label>
                  <Input
                    id="room-member-search"
                    value={roomSearchQuery}
                    onChange={(event) => setRoomSearchQuery(event.target.value)}
                    placeholder="Search group members"
                  />
                  {roomSearchQuery.trim().length > 0 && (
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                      {privateRoomCandidates.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No matching group members available.
                        </p>
                      ) : (
                        privateRoomCandidates.map((candidate) => (
                          <div
                            key={candidate.user_id}
                            className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {candidate.display_name}
                              </div>
                              <div className="truncate text-xs text-muted-foreground">
                                {candidate.email || candidate.user_id}
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                handleAddRoomMember(candidate.user_id)
                              }
                              disabled={addRoomMembersMutation.isPending}
                            >
                              Add
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {roomMembers.map((member) => (
                    <div
                      key={member.membership.user_id}
                      className="flex items-center gap-3 rounded-lg border border-border px-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {member.profile?.display_name ||
                            member.membership.user_id}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {member.profile?.email || member.membership.user_id}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRemoveRoomMember(member.membership.user_id)
                        }
                        disabled={removeRoomMemberMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Public channels inherit their group membership automatically.
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
