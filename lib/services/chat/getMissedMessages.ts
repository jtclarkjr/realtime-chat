import {
  fetchMessagesAfterTimestamp,
  fetchRecentMessagesForRoom,
  getMessageTimestampById,
  getUserDisplayNameById
} from '@/lib/supabase/db/chat'
import { getServiceClient } from '@/lib/supabase/server'
import { userService } from '@/lib/services/user/user-service'
import {
  markMessageReceived,
  trackLatestMessage,
  getUserLastReceivedMessageId,
  markUserCaughtUp
} from '@/lib/redis'
import type {
  DatabaseMessage,
  MissedMessagesResponse
} from '@/lib/types/database'
import { transformDatabaseMessage } from './transformDatabaseMessage'

export const getMissedMessages = async (
  userId: string,
  roomId: string
): Promise<MissedMessagesResponse> => {
  const supabase = getServiceClient()

  try {
    // Get user's last received message ID from Redis
    const lastReceivedId = await getUserLastReceivedMessageId(userId, roomId)

    if (!lastReceivedId) {
      // User is new or been away for 30+ days
      // Get recent messages from database (exclude private messages not for this user)
      const recentMessages = await fetchRecentMessagesForRoom(
        roomId,
        userId,
        50
      )

      // Mark user as caught up with the latest message BEFORE transformation
      if (recentMessages.length > 0) {
        // The most recent message is the first one since we ordered by created_at DESC
        const latestMessage = recentMessages[0]
        await trackLatestMessage(roomId, latestMessage.id)
        await markMessageReceived(userId, roomId, latestMessage.id)
      }

      // Get unique user IDs for avatar fetching (exclude AI messages)
      const userIds = [
        ...new Set(
          recentMessages
            .filter((msg) => !msg.is_ai_message)
            .map((msg) => msg.user_id)
        )
      ]

      // Fetch user profiles for avatars
      const userProfiles = await userService.getUserProfiles(userIds)

      // Transform and reverse to get chronological order
      const transformedMessages = await Promise.all(
        recentMessages.toReversed().map(async (msg: DatabaseMessage) => {
          const userProfile = userProfiles.get(msg.user_id)
          const userName = await getUserDisplayNameById(supabase, msg.user_id)
          return transformDatabaseMessage(
            msg,
            userProfile?.avatar_url,
            userName
          )
        })
      )

      return {
        type: transformedMessages.length > 0 ? 'missed_messages' : 'caught_up',
        messages: transformedMessages,
        count: transformedMessages.length
      }
    }

    // Get the timestamp of the last received message
    const lastMessageTimestamp = await getMessageTimestampById(
      supabase,
      lastReceivedId
    )

    // Get messages after their last received message (exclude private messages not for this user)
    const missedMessages = await fetchMessagesAfterTimestamp(
      roomId,
      userId,
      lastMessageTimestamp
    )

    // Get unique user IDs for avatar fetching (exclude AI messages)
    const userIds = [
      ...new Set(
        missedMessages
          .filter((msg) => !msg.is_ai_message)
          .map((msg) => msg.user_id)
      )
    ]

    // Fetch user profiles for avatars
    const userProfiles = await userService.getUserProfiles(userIds)

    const transformedMessages = await Promise.all(
      missedMessages.map(async (msg: DatabaseMessage) => {
        const userProfile = userProfiles.get(msg.user_id)
        const userName = await getUserDisplayNameById(supabase, msg.user_id)
        return transformDatabaseMessage(msg, userProfile?.avatar_url, userName)
      })
    )

    // Mark user as caught up
    await markUserCaughtUp(userId, roomId)

    // If no missed messages, get recent messages for context
    if (transformedMessages.length === 0) {
      const recentMessages = await fetchRecentMessagesForRoom(
        roomId,
        userId,
        20
      )

      if (recentMessages.length > 0) {
        // Get unique user IDs for avatar fetching (exclude AI messages)
        const recentUserIds = [
          ...new Set(
            recentMessages
              .filter((msg) => !msg.is_ai_message)
              .map((msg) => msg.user_id)
          )
        ]

        // Fetch user profiles for avatars
        const recentUserProfiles =
          await userService.getUserProfiles(recentUserIds)

        const recentTransformed = await Promise.all(
          recentMessages.toReversed().map(async (msg: DatabaseMessage) => {
            const userProfile = recentUserProfiles.get(msg.user_id)
            const userName = await getUserDisplayNameById(supabase, msg.user_id)
            return transformDatabaseMessage(
              msg,
              userProfile?.avatar_url,
              userName
            )
          })
        )

        return {
          type: 'recent_messages',
          messages: recentTransformed,
          count: recentTransformed.length
        }
      }
    }

    return {
      type: transformedMessages.length > 0 ? 'missed_messages' : 'caught_up',
      messages: transformedMessages,
      count: transformedMessages.length
    }
  } catch (error) {
    console.error('Error getting missed messages:', error)
    return { type: 'caught_up', messages: [], count: 0 }
  }
}
