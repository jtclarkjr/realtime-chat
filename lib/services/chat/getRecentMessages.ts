import {
  fetchRecentMessagesForRoom,
  getUserDisplayNameById
} from '@/lib/supabase/db/chat'
import { userService } from '@/lib/services/user/user-service'
import type { DatabaseMessage, ChatMessageWithDB } from '@/lib/types/database'
import { transformDatabaseMessage } from './transformDatabaseMessage'
import { getServiceClient } from '@/lib/supabase/server'

export const getRecentMessages = async (
  roomId: string,
  userId?: string,
  limit: number = 50
): Promise<ChatMessageWithDB[]> => {
  try {
    const messages = await fetchRecentMessagesForRoom(roomId, userId, limit)
    const supabase = getServiceClient()

    // Get unique user IDs for avatar fetching (exclude AI messages)
    const userIds = [
      ...new Set(
        messages.filter((msg) => !msg.is_ai_message).map((msg) => msg.user_id)
      )
    ]

    // Fetch user profiles for avatars
    const userProfiles = await userService.getUserProfiles(userIds)

    return await Promise.all(
      messages.toReversed().map(async (msg: DatabaseMessage) => {
        const userProfile = userProfiles.get(msg.user_id)
        const userName = await getUserDisplayNameById(supabase, msg.user_id)
        return transformDatabaseMessage(msg, userProfile?.avatar_url, userName)
      })
    )
  } catch (error) {
    console.error('Error fetching recent messages:', error)
    return []
  }
}
