'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  addGroupMembers,
  addRoomMembers,
  removeGroupMember,
  removeRoomMember,
  updateGroupMember
} from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { UpdateGroupMemberRequest } from '@/lib/types/api'
import type { GroupMembersResponse, RoomMembersResponse } from '@/lib/types/api'

export function useAddGroupMembers() {
  const queryClient = useQueryClient()

  return useMutation<
    GroupMembersResponse,
    Error,
    { groupId: string; userIds: string[] }
  >({
    mutationFn: ({ groupId, userIds }) => addGroupMembers(groupId, userIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.members(variables.groupId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    }
  })
}

export function useUpdateGroupMember() {
  const queryClient = useQueryClient()

  return useMutation<
    GroupMembersResponse,
    Error,
    { groupId: string; userId: string; data: UpdateGroupMemberRequest }
  >({
    mutationFn: ({ groupId, userId, data }) =>
      updateGroupMember(groupId, userId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.members(variables.groupId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
    }
  })
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient()

  return useMutation<
    GroupMembersResponse,
    Error,
    { groupId: string; userId: string }
  >({
    mutationFn: ({ groupId, userId }) => removeGroupMember(groupId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.members(variables.groupId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
    }
  })
}

export function useAddRoomMembers() {
  const queryClient = useQueryClient()

  return useMutation<
    RoomMembersResponse,
    Error,
    { groupId: string; roomId: string; userIds: string[] }
  >({
    mutationFn: ({ groupId, roomId, userIds }) =>
      addRoomMembers(groupId, roomId, userIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.roomMembers(variables.roomId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
    }
  })
}

export function useRemoveRoomMember() {
  const queryClient = useQueryClient()

  return useMutation<
    RoomMembersResponse,
    Error,
    { groupId: string; roomId: string; userId: string }
  >({
    mutationFn: ({ groupId, roomId, userId }) =>
      removeRoomMember(groupId, roomId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.roomMembers(variables.roomId)
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
    }
  })
}
