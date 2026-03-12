import type { User } from '@supabase/supabase-js'
import { getServiceClient } from '@/lib/supabase/server'
import { insertMessage, getUserDisplayNameById } from '@/lib/supabase/db/chat'
import {
  resolveRoomAccess,
  touchRoomLastActivity,
  type AuthViewer
} from './access'
import { transformDatabaseMessage } from '@/lib/services/chat/transformDatabaseMessage'
import type {
  PersonalChatResponse,
  PersonalChatsResponse,
  StartPersonalChatRequest,
  StartPersonalChatResponse,
  UpdatePersonalChatRequest
} from '@/lib/types/api'
import type { PersonalChat } from '@/lib/types/database'
import { purgeFileContextsForRoom } from '@/lib/services/ai/file-context-service'

const toViewer = (user: User): AuthViewer => ({
  id: user.id,
  is_anonymous: user.is_anonymous
})

const deriveChatName = (input: StartPersonalChatRequest): string => {
  const explicitName = input.name?.trim()
  if (explicitName) {
    return explicitName
  }

  const preview = input.content.trim().replace(/\s+/g, ' ')
  if (preview.length <= 60) {
    return preview
  }

  return `${preview.slice(0, 57)}...`
}

export async function listPersonalChatsForViewer(
  user: User,
  options: {
    query?: string
    limit?: number
    offset?: number
  } = {}
): Promise<PersonalChatsResponse> {
  const limit = options.limit ?? 50
  const offset = options.offset ?? 0
  const supabase = getServiceClient()
  let query = supabase
    .from('rooms')
    .select('*', { count: 'exact' })
    .eq('kind', 'personal')
    .eq('owner_user_id', user.id)
    .order('last_activity_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options.query?.trim()) {
    query = query.ilike('name', `%${options.query.trim()}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing personal chats:', error)
    throw new Error('Failed to load personal chats')
  }

  const total = count || 0
  const nextOffset = offset + limit < total ? offset + limit : null

  return {
    chats: (data || []) as PersonalChat[],
    pagination: {
      offset,
      limit,
      total,
      hasMore: nextOffset !== null,
      nextOffset
    }
  }
}

export async function getPersonalChatForViewer(
  chatId: string,
  user: User
): Promise<PersonalChatResponse> {
  const access = await resolveRoomAccess(chatId, toViewer(user))
  if (access.room.kind !== 'personal' || !access.canRead) {
    throw new Error('Personal chat not found or unauthorized')
  }

  return {
    chat: access.room as PersonalChat
  }
}

export async function startPersonalChatForViewer(
  user: User,
  input: StartPersonalChatRequest
): Promise<StartPersonalChatResponse> {
  const supabase = getServiceClient()
  const nowIso = new Date().toISOString()
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .insert({
      name: deriveChatName(input),
      description: null,
      kind: 'personal',
      group_id: null,
      visibility: 'private',
      created_by: user.id,
      owner_user_id: user.id,
      ai_enabled: input.aiEnabled ?? true,
      ai_model: input.aiModel?.trim() || null,
      last_activity_at: nowIso,
      updated_at: nowIso
    })
    .select('*')
    .single()

  if (roomError || !room) {
    console.error('Error creating personal chat:', roomError)
    throw new Error('Failed to create personal chat')
  }

  const message = await insertMessage({
    room_id: room.id,
    user_id: user.id,
    content: input.content.trim(),
    is_ai_message: false,
    is_private: false,
    requester_id: null
  })
  await touchRoomLastActivity(room.id)

  const userName = await getUserDisplayNameById(supabase, user.id)

  return {
    success: true,
    chat: room as PersonalChat,
    message: transformDatabaseMessage(message, input.avatarUrl, userName)
  }
}

export async function updatePersonalChatForViewer(
  chatId: string,
  user: User,
  input: UpdatePersonalChatRequest
): Promise<PersonalChatResponse> {
  const access = await resolveRoomAccess(chatId, toViewer(user))
  if (access.room.kind !== 'personal' || !access.canWrite) {
    throw new Error('Personal chat not found or unauthorized')
  }

  const supabase = getServiceClient()
  const updates: Record<string, string | boolean | null> = {
    updated_at: new Date().toISOString()
  }

  if (typeof input.name === 'string') {
    updates.name = input.name.trim()
  }
  if (typeof input.aiEnabled === 'boolean') {
    updates.ai_enabled = input.aiEnabled
  }
  if (input.aiModel !== undefined) {
    updates.ai_model = input.aiModel?.trim() || null
  }

  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', chatId)
    .select('*')
    .single()

  if (error || !data) {
    console.error('Error updating personal chat:', error)
    throw new Error('Failed to update personal chat')
  }

  return {
    chat: data as PersonalChat
  }
}

export async function deletePersonalChatForViewer(
  chatId: string,
  user: User
): Promise<{ success: boolean }> {
  const access = await resolveRoomAccess(chatId, toViewer(user))
  if (access.room.kind !== 'personal' || !access.canWrite) {
    throw new Error('Personal chat not found or unauthorized')
  }

  const supabase = getServiceClient()
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('room_id', chatId)

  if (messagesError) {
    console.error('Error deleting personal chat messages:', messagesError)
    throw new Error('Failed to delete personal chat messages')
  }

  await purgeFileContextsForRoom(chatId)

  const { error } = await supabase.from('rooms').delete().eq('id', chatId)

  if (error) {
    console.error('Error deleting personal chat:', error)
    throw new Error('Failed to delete personal chat')
  }

  return { success: true }
}

export function getAllowedPersonalAiModels(): string[] {
  return [
    ...new Set(
      [
        process.env.AI_STREAM_DEFAULT_MODEL,
        process.env.AI_STREAM_CODE_MODEL,
        'claude-sonnet-4-5',
        'claude-haiku-4-5'
      ].filter(Boolean) as string[]
    )
  ]
}
