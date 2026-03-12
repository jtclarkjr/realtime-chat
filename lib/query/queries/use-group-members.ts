'use client'

import { useQuery } from '@tanstack/react-query'
import { getGroupMembers } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { GroupMemberEntry } from '@/lib/types/database'

interface UseGroupMembersOptions {
  groupId: string
  enabled?: boolean
  initialData?: GroupMemberEntry[]
}

export function useGroupMembers({
  groupId,
  enabled = true,
  initialData
}: UseGroupMembersOptions) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: async () => {
      const response = await getGroupMembers(groupId)
      return response.members
    },
    enabled: enabled && !!groupId,
    initialData,
    staleTime: 30 * 1000
  })
}
