import { getServiceClient } from '@/lib/supabase/server'
import type { UserDirectoryEntry } from '@/lib/types/database'

const normalizeDirectoryEntry = (
  entry: UserDirectoryEntry
): UserDirectoryEntry => ({
  user_id: entry.user_id,
  display_name: entry.display_name,
  avatar_url: entry.avatar_url,
  email: entry.email,
  last_seen_at: entry.last_seen_at
})

export async function searchChatUsers(
  viewerId: string | null,
  query?: string,
  limit: number = 50
): Promise<UserDirectoryEntry[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase.rpc('search_chat_users', {
    viewer_uuid: viewerId,
    search_query: query?.trim() || null,
    max_results: limit
  })

  if (error) {
    console.error('Error searching chat users:', error)
    throw new Error('Failed to search users')
  }

  return (data || []).map((entry) =>
    normalizeDirectoryEntry(entry as UserDirectoryEntry)
  )
}

export async function getChatUserProfiles(
  userIds: string[]
): Promise<Map<string, UserDirectoryEntry>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  if (uniqueIds.length === 0) {
    return new Map()
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase.rpc('get_chat_user_profiles', {
    user_ids: uniqueIds
  })

  if (error) {
    console.error('Error fetching chat user profiles:', error)
    throw new Error('Failed to fetch user profiles')
  }

  return new Map(
    (data || []).map((entry) => {
      const normalized = normalizeDirectoryEntry(entry as UserDirectoryEntry)
      return [normalized.user_id, normalized] as const
    })
  )
}
