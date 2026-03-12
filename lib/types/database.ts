import { Database } from './supabase'
import { createServerClient } from '@supabase/ssr'

// Supabase client types
export type SupabaseServerClient = ReturnType<typeof createServerClient>

// Supabase table row types
export type DatabaseMessage = Database['public']['Tables']['messages']['Row']
export type DatabaseMessageInsert =
  Database['public']['Tables']['messages']['Insert']
export type DatabaseMessageUpdate =
  Database['public']['Tables']['messages']['Update']
export type LatestVisibleMessage = Pick<
  DatabaseMessage,
  | 'room_id'
  | 'content'
  | 'created_at'
  | 'user_id'
  | 'is_ai_message'
  | 'is_private'
  | 'requester_id'
  | 'deleted_at'
>

export type DatabaseRoom = Database['public']['Tables']['rooms']['Row']
export type DatabaseRoomInsert = Database['public']['Tables']['rooms']['Insert']
export type DatabaseRoomUpdate = Database['public']['Tables']['rooms']['Update']
export type DatabaseGroup = Database['public']['Tables']['groups']['Row']
export type DatabaseGroupInsert =
  Database['public']['Tables']['groups']['Insert']
export type DatabaseGroupUpdate =
  Database['public']['Tables']['groups']['Update']
export type GroupMembership =
  Database['public']['Tables']['group_memberships']['Row']
export type RoomMembership =
  Database['public']['Tables']['room_memberships']['Row']

export interface GroupPermissions {
  is_member: boolean
  is_owner: boolean
  can_read: boolean
  can_write: boolean
  can_admin: boolean
}

export interface GroupMemberEntry {
  membership: GroupMembership
  profile: UserDirectoryEntry | null
}

export interface RoomMemberEntry {
  membership: RoomMembership
  profile: UserDirectoryEntry | null
}

export interface GroupView {
  group: DatabaseGroup
  permissions: GroupPermissions
  channels: Array<{
    room: DatabaseRoom
    permissions: GroupPermissions
  }>
}

export interface PersonalChat extends DatabaseRoom {
  kind: 'personal'
  owner_user_id: string
}

export interface UserDirectoryEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  email: string | null
  last_seen_at: string | null
}

// API message types from external source
export interface ApiMessage {
  id: string
  content: string
  user: {
    id: string
    name: string
    avatar_url?: string
  }
  createdAt: string
  channelId: string
  isAI?: boolean
  isPrivate?: boolean
  requesterId?: string
  isDeleted?: boolean
  deletedAt?: string
  deletedBy?: string
  hasAIResponse?: boolean
  clientMsgId?: string
  streamSourceId?: string
}

// Application layer message types
export interface ChatMessageWithDB {
  id: string
  content: string
  user: {
    id: string
    name: string
    avatar_url?: string
  }
  createdAt: string
  channelId: string
  groupId?: string
  isAI?: boolean
  isPrivate?: boolean
  requesterId?: string
  isDeleted?: boolean
  deletedAt?: string
  deletedBy?: string
  hasAIResponse?: boolean
}

// Chat message interface used in components and hooks
export interface ChatMessage {
  id: string
  content: string
  user: {
    id?: string
    name: string
    avatar_url?: string
  }
  createdAt: string
  roomId?: string
  groupId?: string
  isAI?: boolean
  isStreaming?: boolean
  isPrivate?: boolean
  requesterId?: string // ID of user who requested the AI response (for private messages)
  isFailed?: boolean
  isRetrying?: boolean
  isQueued?: boolean
  isPending?: boolean
  retryAttempts?: number
  isDeleted?: boolean
  deletedAt?: string
  deletedBy?: string
  hasAIResponse?: boolean
  isOptimistic?: boolean
  isOptimisticConfirmed?: boolean
  optimisticTimestamp?: number
  serverId?: string
  serverTimestamp?: string
  clientMsgId?: string // Client-generated ID for deterministic deduplication
  streamSourceId?: string
}

// Response types
export interface MissedMessagesResponse {
  type: 'missed_messages' | 'caught_up' | 'recent_messages'
  messages: ChatMessageWithDB[]
  count: number
}

// Request types
export interface SendMessageRequest {
  roomId: string
  userId: string
  username: string
  content: string
  isPrivate?: boolean
}

export interface SendAIMessageRequest {
  roomId: string
  content: string
  isPrivate?: boolean
  requesterId?: string
}

export interface MarkReceivedRequest {
  userId: string
  roomId: string
  messageId: string
}

export type UnsendMessageRequest = MarkReceivedRequest

export interface RoomWithLastMessage extends DatabaseRoom {
  lastMessage?: {
    content: string
    timestamp: string
    userName: string
    isAI: boolean
  }
}
