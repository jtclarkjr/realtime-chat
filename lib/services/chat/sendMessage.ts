import { getServiceClient } from '@/lib/supabase/server'
import { getUserDisplayNameById, insertMessage } from '@/lib/supabase/db/chat'
import { userService } from '@/lib/services/user/user-service'
import { trackLatestMessage } from '@/lib/redis'
import type {
  DatabaseMessageInsert,
  ChatMessageWithDB,
  SendMessageRequest
} from '@/lib/types/database'
import { transformDatabaseMessage } from './transformDatabaseMessage'

export const sendMessage = async (
  request: SendMessageRequest
): Promise<ChatMessageWithDB> => {
  // Validate required fields
  if (!request.roomId || !request.userId || !request.content?.trim()) {
    throw new Error('Missing required fields for message')
  }

  // Save to database (id will be auto-generated)
  const messageInsert: DatabaseMessageInsert = {
    room_id: request.roomId,
    user_id: request.userId,
    content: request.content,
    is_ai_message: false,
    is_private: request.isPrivate || false
  }

  let message
  try {
    message = await insertMessage(messageInsert)
  } catch (error) {
    console.error('Error saving message to database:', error)
    throw new Error('Failed to save message', { cause: error })
  }

  // Get username from auth.users
  const supabase = getServiceClient()
  const userName = await getUserDisplayNameById(supabase, message.user_id)

  // Get user avatar if available
  const userProfile = await userService.getUserProfile(message.user_id)

  // Track this as the latest message in Redis
  await trackLatestMessage(request.roomId, message.id)

  return transformDatabaseMessage(message, userProfile?.avatar_url, userName)
}
