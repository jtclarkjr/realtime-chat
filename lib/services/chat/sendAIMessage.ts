import { getServiceClient } from '@/lib/supabase/server'
import { getUserDisplayNameById, insertMessage } from '@/lib/supabase/db/chat'
import { AI_USER_ID } from '@/lib/services/user/ai-user-setup'
import { trackLatestMessage } from '@/lib/redis'
import { resolveRoomAccess, touchRoomLastActivity } from '@/lib/services/domain'
import type {
  DatabaseMessageInsert,
  ChatMessageWithDB,
  SendAIMessageRequest
} from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'
import { transformDatabaseMessage } from './transformDatabaseMessage'

export const sendAIMessage = async (
  request: SendAIMessageRequest,
  viewer?: User
): Promise<ChatMessageWithDB> => {
  // Validate required fields
  if (!request.roomId || !request.content?.trim()) {
    throw new Error('Missing required fields for AI message')
  }

  // Ensure AI_USER_ID is available
  if (!AI_USER_ID) {
    throw new Error('AI_USER_ID is not configured')
  }

  // Save AI message to database
  const roomAccess = viewer
    ? await resolveRoomAccess(request.roomId, viewer, {
        autoJoinForWrite: true
      })
    : null
  if (roomAccess && !roomAccess.canWrite) {
    throw new Error(
      'You do not have permission to send AI responses in this room'
    )
  }

  const effectiveIsPrivate =
    roomAccess?.room.kind === 'personal' ? false : (request.isPrivate ?? false)
  const aiMessageInsert: DatabaseMessageInsert = {
    room_id: request.roomId,
    user_id: AI_USER_ID,
    content: request.content,
    is_ai_message: true,
    is_private: effectiveIsPrivate,
    requester_id: effectiveIsPrivate ? request.requesterId : null
  }

  let message
  try {
    message = await insertMessage(aiMessageInsert)
  } catch (error) {
    console.error('Error saving AI message to database:', error)
    throw new Error('Failed to save AI message', { cause: error })
  }

  // For AI messages, use a stable fallback if no display name is set
  const supabase = getServiceClient()
  let aiUserName = await getUserDisplayNameById(supabase, AI_USER_ID)
  if (!aiUserName || aiUserName === 'Unknown User') {
    aiUserName = 'AI Assistant'
  }

  // Track this as the latest message in Redis
  await trackLatestMessage(request.roomId, message.id)
  await touchRoomLastActivity(request.roomId)

  return transformDatabaseMessage(message, null, aiUserName)
}
