import { getServiceClient } from '@/lib/supabase/server'
import { getUserDisplayNameById, insertMessage } from '@/lib/supabase/db/chat'
import { userService } from '@/lib/services/user/user-service'
import { trackLatestMessage } from '@/lib/redis'
import { resolveRoomAccess, touchRoomLastActivity } from '@/lib/services/domain'
import type {
  DatabaseMessageInsert,
  ChatMessageWithDB,
  SendMessageRequest
} from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'
import { transformDatabaseMessage } from './transformDatabaseMessage'

export const sendMessage = async (
  request: SendMessageRequest,
  viewer?: User
): Promise<ChatMessageWithDB> => {
  // Validate required fields
  if (!request.roomId || !request.userId || !request.content?.trim()) {
    throw new Error('Missing required fields for message')
  }

  // Save to database (id will be auto-generated)
  const roomAccess = viewer
    ? await resolveRoomAccess(request.roomId, viewer, {
        autoJoinForWrite: true
      })
    : null
  if (roomAccess && !roomAccess.canWrite) {
    throw new Error('You do not have permission to send messages in this room')
  }

  const effectiveIsPrivate =
    roomAccess?.room.kind === 'personal' ? false : (request.isPrivate ?? false)
  const messageInsert: DatabaseMessageInsert = {
    room_id: request.roomId,
    user_id: request.userId,
    content: request.content,
    is_ai_message: false,
    is_private: effectiveIsPrivate
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
  await touchRoomLastActivity(request.roomId)

  return transformDatabaseMessage(message, userProfile?.avatar_url, userName)
}
