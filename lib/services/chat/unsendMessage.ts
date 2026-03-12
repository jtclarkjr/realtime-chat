import type {
  ChatMessageWithDB,
  UnsendMessageRequest,
  SupabaseServerClient
} from '@/lib/types/database'
import { transformDatabaseMessage } from './transformDatabaseMessage'
import {
  getUserDisplayNameById,
  softDeleteMessage
} from '@/lib/supabase/db/chat'

export const unsendMessage = async (
  request: UnsendMessageRequest,
  authenticatedClient: SupabaseServerClient
): Promise<ChatMessageWithDB> => {
  if (!request.messageId || !request.userId || !request.roomId) {
    throw new Error('Missing required fields for unsend message')
  }

  let updatedMessage
  try {
    updatedMessage = await softDeleteMessage(authenticatedClient, request)
  } catch (error) {
    console.error('Error soft deleting message:', error)
    // Check if it's a permission error (RLS policy blocked the operation)
    const errorWithCode = error as { code?: string; message?: string }
    if (
      errorWithCode?.code === 'PGRST116' ||
      errorWithCode?.message?.includes('No rows found')
    ) {
      throw new Error(
        'Message not found or you do not have permission to unsend it',
        { cause: error }
      )
    }
    throw new Error('Failed to unsend message', { cause: error })
  }

  if (!updatedMessage) {
    throw new Error('Failed to unsend message')
  }

  // Get username for the unsent message
  const userName = await getUserDisplayNameById(
    authenticatedClient,
    updatedMessage.user_id
  )
  return transformDatabaseMessage(updatedMessage, null, userName)
}
