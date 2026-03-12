import type {
  DatabaseRoom,
  DatabaseGroup,
  GroupMembership,
  GroupMemberEntry,
  RoomMemberEntry,
  GroupView,
  PersonalChat,
  UserDirectoryEntry,
  ApiMessage,
  SendMessageRequest as DB_SendMessageRequest,
  UnsendMessageRequest as DB_UnsendMessageRequest
} from './database'
import type {
  AIPersonalizationCharacteristics,
  AIPersonalizationSettings,
  BaseStyleTone,
  ResponseDetailMode,
  SettingsTab
} from './settings'

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// GET /api/rooms - Fetch all rooms
export interface RoomsResponse {
  rooms: DatabaseRoom[]
}

export interface GroupsResponse {
  groups: GroupView[]
}

// GET /api/rooms/{roomId} - Fetch room by ID
export interface RoomByIdResponse {
  room: DatabaseRoom
}

export interface GroupByIdResponse {
  group: GroupView
}

export interface CreateRoomRequest {
  name: string
  description?: string
}

export interface CreateRoomResponse {
  success: boolean
  room?: DatabaseRoom
  error?: string
}

export interface DeleteRoomResponse {
  success: boolean
  error?: string
}

export interface DeleteGroupResponse {
  success: boolean
  error?: string
}

export interface AccessTokenResponse {
  accessToken: string
  expiresAtMs: number | null
}

// GET /api/rooms/{roomId}/rejoin - Fetch missed messages
// Similar to DB_MissedMessagesResponse but uses ApiMessage[] from API
export interface MissedMessagesResponse {
  type: 'missed_messages' | 'caught_up' | 'recent_messages'
  messages: ApiMessage[]
  count?: number
}

// POST /api/messages/send - Send a message
// Extend the canonical DB request with client-only optimisticId
export interface SendMessageRequest extends DB_SendMessageRequest {
  optimisticId?: string
}

export interface SendMessageResponse {
  success: boolean
  message: {
    id: string
    created_at?: string
  }
  error?: string
}

// POST /api/messages/unsend - Unsend/delete a message
// Use canonical DB type
export type UnsendMessageRequest = DB_UnsendMessageRequest

export interface UnsendMessageResponse {
  success: boolean
  message: {
    deletedAt: string
    deletedBy: string
  }
  error?: string
}

// POST /api/rooms/generate - Generate AI room suggestion
export interface GenerateRoomRequest {
  existingRoomNames: string[]
  currentName?: string
  currentDescription?: string
}

export interface GenerateRoomResponse {
  suggestion: {
    name: string
    description: string
  }
  error?: string
}

export interface GroupUsersResponse {
  users: UserDirectoryEntry[]
}

export interface GroupMembersResponse {
  members: GroupMemberEntry[]
}

export interface RoomMembersResponse {
  members: RoomMemberEntry[]
}

export interface CreateGroupRequest {
  name: string
  description?: string
  visibility?: 'public' | 'private'
  memberUserIds?: string[]
}

export interface CreateGroupResponse {
  success: boolean
  group?: DatabaseGroup
  error?: string
}

export interface JoinGroupResponse {
  success: boolean
  membership?: GroupMembership
  error?: string
}

export interface CreateChannelRequest {
  groupId: string
  name: string
  description?: string
  visibility?: 'public' | 'private'
}

export interface CreateChannelResponse {
  success: boolean
  room?: DatabaseRoom
  error?: string
}

export interface UpdateGroupMemberRequest {
  canRead: boolean
  canWrite: boolean
  canAdmin: boolean
}

export interface StartPersonalChatRequest {
  userId: string
  username: string
  avatarUrl?: string
  content: string
  aiEnabled?: boolean
  aiModel?: string
  name?: string
  deferAiResponse?: boolean
}

export interface StartPersonalChatResponse {
  success: boolean
  chat?: PersonalChat
  message?: ApiMessage
  error?: string
}

export interface PersonalChatsResponse {
  chats: PersonalChat[]
  pagination: {
    offset: number
    limit: number
    total: number
    hasMore: boolean
    nextOffset: number | null
  }
}

export interface PersonalChatResponse {
  chat: PersonalChat
}

export interface UpdatePersonalChatRequest {
  name?: string
  aiEnabled?: boolean
  aiModel?: string | null
}

export interface ProcessAiFilesAcceptedFile {
  fileName: string
  mediaType: string
  sizeBytes: number
  sha256: string
  extractedChars: number
  truncated: boolean
}

export interface ProcessAiFilesRejectedFile {
  fileName: string
  reason: string
}

export interface ProcessAiFilesResponse {
  success: boolean
  fileContextId: string
  expiresAt: string
  acceptedFiles: ProcessAiFilesAcceptedFile[]
  rejectedFiles: ProcessAiFilesRejectedFile[]
  warnings: string[]
}

export interface AIUsageWindow {
  used: number
  limit: number
  percent: number
  remaining: number
  resetAt: string
  locked: boolean
}

export interface AIUsageStatusResponse {
  tier: 'free'
  daily: AIUsageWindow
  monthly: AIUsageWindow
  locked: boolean
  updatedAt: string
}

export interface UpdateAIPersonalizationRequest {
  baseStyleTone: BaseStyleTone
  responseDetailMode: ResponseDetailMode
  characteristics: AIPersonalizationCharacteristics
  customInstructions: string
  aboutYou: string
}

export interface AIPersonalizationResponse {
  personalization: AIPersonalizationSettings
  updatedAt: string | null
}

export type { SettingsTab }

// POST /api/messages/mark-received - Mark a message as received
export interface MarkMessageAsReceivedRequest {
  userId: string
  roomId: string
  messageId: string
}

// POST /api/ai/stream - Stream AI response
export interface StreamAIMessageRequest {
  roomId: string
  userId: string
  message: string
  responseFormat?: 'plain' | 'markdown'
  previousMessages: Array<{
    content: string
    isAi: boolean
    userName: string
  }>
  isPrivate: boolean
  triggerMessageId?: string
  fileContextId?: string
  targetMessageId?: string
  targetMessageContent?: string
  customPrompt?: string
  draftOnly?: boolean
}
