import ky from 'ky'
import type { Options } from 'ky'
import type { ApiMessage, ChatMessage } from '@/lib/types/database'
import { getApiEndpointUrl, shouldUseExternalApi } from '@/lib/api/endpoints'
import type {
  AccessTokenResponse,
  RoomsResponse,
  GroupsResponse,
  GroupByIdResponse,
  CreateRoomRequest,
  CreateRoomResponse,
  DeleteRoomResponse,
  DeleteGroupResponse,
  RoomByIdResponse,
  MissedMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  UnsendMessageRequest,
  UnsendMessageResponse,
  GenerateRoomRequest,
  GenerateRoomResponse,
  MarkMessageAsReceivedRequest,
  StreamAIMessageRequest,
  CreateGroupRequest,
  CreateGroupResponse,
  GroupUsersResponse,
  GroupMembersResponse,
  RoomMembersResponse,
  CreateChannelRequest,
  CreateChannelResponse,
  UpdateGroupMemberRequest,
  JoinGroupResponse,
  PersonalChatsResponse,
  PersonalChatResponse,
  StartPersonalChatRequest,
  StartPersonalChatResponse,
  UpdatePersonalChatRequest,
  AIUsageStatusResponse,
  AIPersonalizationResponse,
  UpdateAIPersonalizationRequest,
  ProcessAiFilesResponse
} from '@/lib/types/api'

let cachedAccessToken: string | null = null
let cachedAccessTokenExpiresAtMs = 0
let accessTokenRequest: Promise<string | null> | null = null

const getAccessToken = async (): Promise<string | null> => {
  const now = Date.now()
  const refreshSkewMs = 10_000

  if (cachedAccessToken && cachedAccessTokenExpiresAtMs > now + refreshSkewMs) {
    return cachedAccessToken
  }

  if (accessTokenRequest) {
    return accessTokenRequest
  }

  accessTokenRequest = (async () => {
    const response = await ky.get('/api/auth/access-token', {
      cache: 'no-store'
    })

    if (!response.ok) {
      cachedAccessToken = null
      cachedAccessTokenExpiresAtMs = 0
      return null
    }

    const data = await response.json<AccessTokenResponse>()
    cachedAccessToken = data.accessToken || null
    cachedAccessTokenExpiresAtMs = data.expiresAtMs ?? now + 60_000
    return cachedAccessToken
  })()
    .catch(() => {
      cachedAccessToken = null
      cachedAccessTokenExpiresAtMs = 0
      return null
    })
    .finally(() => {
      accessTokenRequest = null
    })

  return accessTokenRequest
}

const withExternalAuth = async (
  endpoint: Parameters<typeof getApiEndpointUrl>[0],
  options: Options = {}
): Promise<Options> => {
  if (!shouldUseExternalApi(endpoint)) {
    return options
  }

  const token = await getAccessToken()
  if (!token) {
    throw new Error('External API auth token unavailable')
  }

  const headers = new Headers()
  const existingHeaders = options.headers

  if (existingHeaders instanceof Headers) {
    existingHeaders.forEach((value, key) => headers.set(key, value))
  } else if (Array.isArray(existingHeaders)) {
    existingHeaders.forEach(([key, value]) => headers.set(key, value))
  } else if (existingHeaders) {
    Object.entries(existingHeaders).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.set(key, value)
      }
    })
  }

  headers.set('Authorization', `Bearer ${token}`)

  return {
    ...options,
    headers
  }
}

export const getRooms = async (): Promise<RoomsResponse> => {
  const endpoint = 'rooms.list'
  const url = getApiEndpointUrl(endpoint, '/api/rooms')
  return ky.get(url, await withExternalAuth(endpoint)).json<RoomsResponse>()
}

export const getRoomById = async (
  roomId: string,
  signal?: AbortSignal
): Promise<RoomByIdResponse> => {
  const endpoint = 'rooms.byId'
  return ky
    .get(
      getApiEndpointUrl(endpoint, `/api/rooms/${roomId}`),
      await withExternalAuth(endpoint, { signal })
    )
    .json<RoomByIdResponse>()
}

export const createRoom = async (
  data: CreateRoomRequest
): Promise<CreateRoomResponse> => {
  const endpoint = 'rooms.create'
  const response = await ky
    .post(
      getApiEndpointUrl(endpoint, '/api/rooms'),
      await withExternalAuth(endpoint, { json: data })
    )
    .json<{ room: CreateRoomResponse['room'] }>()

  return {
    success: true,
    room: response.room
  }
}

export const deleteRoom = async (
  roomId: string
): Promise<DeleteRoomResponse> => {
  const endpoint = 'rooms.delete'
  const searchParams = new URLSearchParams({ id: roomId })
  return ky
    .delete(
      getApiEndpointUrl(endpoint, `/api/rooms?${searchParams.toString()}`),
      await withExternalAuth(endpoint)
    )
    .json<DeleteRoomResponse>()
}

export const getMissedMessages = async (
  roomId: string,
  userId: string,
  signal?: AbortSignal
): Promise<MissedMessagesResponse> => {
  const endpoint = 'rooms.rejoin'
  const searchParams = new URLSearchParams({ userId })

  return ky
    .get(
      getApiEndpointUrl(
        endpoint,
        `/api/rooms/${roomId}/rejoin?${searchParams.toString()}`
      ),
      await withExternalAuth(endpoint, {
        signal
      })
    )
    .json<MissedMessagesResponse>()
}

export const sendMessage = async (
  data: SendMessageRequest
): Promise<SendMessageResponse> => {
  const endpoint = 'messages.send'
  return ky
    .post(
      getApiEndpointUrl(endpoint, '/api/messages/send'),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<SendMessageResponse>()
}

export const unsendMessage = async (
  data: UnsendMessageRequest
): Promise<UnsendMessageResponse> => {
  const endpoint = 'messages.unsend'
  return ky
    .post(
      getApiEndpointUrl(endpoint, '/api/messages/unsend'),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<UnsendMessageResponse>()
}

export const generateRoomSuggestion = async (
  data: GenerateRoomRequest
): Promise<GenerateRoomResponse> => {
  const endpoint = 'rooms.generate'
  return ky
    .post(
      getApiEndpointUrl(endpoint, '/api/rooms/generate'),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<GenerateRoomResponse>()
}

export const getGroups = async (): Promise<GroupsResponse> => {
  const endpoint = 'groups.list'
  const url = getApiEndpointUrl(endpoint, '/api/groups')
  return ky.get(url, await withExternalAuth(endpoint)).json<GroupsResponse>()
}

export const getGroupById = async (
  groupId: string,
  signal?: AbortSignal
): Promise<GroupByIdResponse> => {
  const endpoint = 'groups.byId'
  return ky
    .get(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}`),
      await withExternalAuth(endpoint, { signal })
    )
    .json<GroupByIdResponse>()
}

export const deleteGroup = async (
  groupId: string
): Promise<DeleteGroupResponse> => {
  const endpoint = 'groups.byId'
  return ky
    .delete(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}`),
      await withExternalAuth(endpoint)
    )
    .json<DeleteGroupResponse>()
}

export const createGroup = async (
  data: CreateGroupRequest
): Promise<CreateGroupResponse> => {
  const endpoint = 'groups.create'
  return ky
    .post(
      getApiEndpointUrl(endpoint, '/api/groups'),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<CreateGroupResponse>()
}

export const joinGroup = async (
  groupId: string
): Promise<JoinGroupResponse> => {
  const endpoint = 'groups.join'
  return ky
    .post(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}/join`),
      await withExternalAuth(endpoint)
    )
    .json<JoinGroupResponse>()
}

export const searchGroupUsers = async (
  q?: string,
  limit: number = 20,
  signal?: AbortSignal
): Promise<GroupUsersResponse> => {
  const endpoint = 'groups.users'
  const searchParams = new URLSearchParams()
  if (q?.trim()) {
    searchParams.set('q', q.trim())
  }
  searchParams.set('limit', String(limit))
  const path = `/api/groups/users${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  return ky
    .get(
      getApiEndpointUrl(endpoint, path),
      await withExternalAuth(endpoint, { signal })
    )
    .json<GroupUsersResponse>()
}

export const getGroupMembers = async (
  groupId: string
): Promise<GroupMembersResponse> => {
  const endpoint = 'groups.members'
  return ky
    .get(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}/members`),
      await withExternalAuth(endpoint)
    )
    .json<GroupMembersResponse>()
}

export const addGroupMembers = async (
  groupId: string,
  userIds: string[]
): Promise<GroupMembersResponse> => {
  const endpoint = 'groups.members'
  return ky
    .post(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}/members`),
      await withExternalAuth(endpoint, {
        json: { userIds }
      })
    )
    .json<GroupMembersResponse>()
}

export const updateGroupMember = async (
  groupId: string,
  userId: string,
  data: UpdateGroupMemberRequest
): Promise<GroupMembersResponse> => {
  const endpoint = 'groups.members'
  return ky
    .patch(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}/members/${userId}`),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<GroupMembersResponse>()
}

export const removeGroupMember = async (
  groupId: string,
  userId: string
): Promise<GroupMembersResponse> => {
  const endpoint = 'groups.members'
  return ky
    .delete(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}/members/${userId}`),
      await withExternalAuth(endpoint)
    )
    .json<GroupMembersResponse>()
}

export const createGroupChannel = async (
  groupId: string,
  data: Omit<CreateChannelRequest, 'groupId'>
): Promise<CreateChannelResponse> => {
  const endpoint = 'groups.channels'
  return ky
    .post(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}/channels`),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<CreateChannelResponse>()
}

export const deleteGroupChannel = async (
  groupId: string,
  roomId: string
): Promise<DeleteRoomResponse> => {
  const endpoint = 'groups.channels'
  return ky
    .delete(
      getApiEndpointUrl(endpoint, `/api/groups/${groupId}/channels/${roomId}`),
      await withExternalAuth(endpoint)
    )
    .json<DeleteRoomResponse>()
}

export const getRoomMembers = async (
  groupId: string,
  roomId: string
): Promise<RoomMembersResponse> => {
  const endpoint = 'groups.channels'
  return ky
    .get(
      getApiEndpointUrl(
        endpoint,
        `/api/groups/${groupId}/channels/${roomId}/members`
      ),
      await withExternalAuth(endpoint)
    )
    .json<RoomMembersResponse>()
}

export const addRoomMembers = async (
  groupId: string,
  roomId: string,
  userIds: string[]
): Promise<RoomMembersResponse> => {
  const endpoint = 'groups.channels'
  return ky
    .post(
      getApiEndpointUrl(
        endpoint,
        `/api/groups/${groupId}/channels/${roomId}/members`
      ),
      await withExternalAuth(endpoint, {
        json: { userIds }
      })
    )
    .json<RoomMembersResponse>()
}

export const removeRoomMember = async (
  groupId: string,
  roomId: string,
  userId: string
): Promise<RoomMembersResponse> => {
  const endpoint = 'groups.channels'
  return ky
    .delete(
      getApiEndpointUrl(
        endpoint,
        `/api/groups/${groupId}/channels/${roomId}/members/${userId}`
      ),
      await withExternalAuth(endpoint)
    )
    .json<RoomMembersResponse>()
}

export const getPersonalChats = async ({
  q,
  limit = 50,
  offset = 0,
  signal
}: {
  q?: string
  limit?: number
  offset?: number
  signal?: AbortSignal
} = {}): Promise<PersonalChatsResponse> => {
  const endpoint = 'personal.list'
  const searchParams = new URLSearchParams()
  if (q?.trim()) {
    searchParams.set('q', q.trim())
  }
  searchParams.set('limit', String(limit))
  searchParams.set('offset', String(offset))
  const path = `/api/personal/chats?${searchParams.toString()}`

  return ky
    .get(
      getApiEndpointUrl(endpoint, path),
      await withExternalAuth(endpoint, { signal })
    )
    .json<PersonalChatsResponse>()
}

export const getPersonalChatById = async (
  chatId: string,
  signal?: AbortSignal
): Promise<PersonalChatResponse> => {
  const endpoint = 'personal.byId'
  return ky
    .get(
      getApiEndpointUrl(endpoint, `/api/personal/chats/${chatId}`),
      await withExternalAuth(endpoint, { signal })
    )
    .json<PersonalChatResponse>()
}

export const startPersonalChat = async (
  data: StartPersonalChatRequest
): Promise<StartPersonalChatResponse> => {
  const endpoint = 'personal.start'
  return ky
    .post(
      getApiEndpointUrl(endpoint, '/api/personal/chats/start'),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<StartPersonalChatResponse>()
}

export const updatePersonalChat = async (
  chatId: string,
  data: UpdatePersonalChatRequest
): Promise<PersonalChatResponse> => {
  const endpoint = 'personal.byId'
  return ky
    .patch(
      getApiEndpointUrl(endpoint, `/api/personal/chats/${chatId}`),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<PersonalChatResponse>()
}

export const deletePersonalChat = async (
  chatId: string
): Promise<{ success: boolean }> => {
  const endpoint = 'personal.byId'
  return ky
    .delete(
      getApiEndpointUrl(endpoint, `/api/personal/chats/${chatId}`),
      await withExternalAuth(endpoint)
    )
    .json<{ success: boolean }>()
}

export const getAIUsageStatus = async (): Promise<AIUsageStatusResponse> => {
  const endpoint = 'ai.usage'
  return ky
    .get(
      getApiEndpointUrl(endpoint, '/api/ai/usage'),
      await withExternalAuth(endpoint)
    )
    .json<AIUsageStatusResponse>()
}

export const getAIPersonalization =
  async (): Promise<AIPersonalizationResponse> => {
    const endpoint = 'ai.personalization'
    return ky
      .get(
        getApiEndpointUrl(endpoint, '/api/ai/personalization'),
        await withExternalAuth(endpoint)
      )
      .json<AIPersonalizationResponse>()
  }

export const updateAIPersonalization = async (
  data: UpdateAIPersonalizationRequest
): Promise<AIPersonalizationResponse> => {
  const endpoint = 'ai.personalization'
  return ky
    .put(
      getApiEndpointUrl(endpoint, '/api/ai/personalization'),
      await withExternalAuth(endpoint, {
        json: data
      })
    )
    .json<AIPersonalizationResponse>()
}

export const processAiFiles = async (
  formData: FormData
): Promise<ProcessAiFilesResponse> => {
  const endpoint = 'ai.files.process'
  return ky
    .post(
      getApiEndpointUrl(endpoint, '/api/ai/files/process'),
      await withExternalAuth(endpoint, {
        body: formData
      })
    )
    .json<ProcessAiFilesResponse>()
}

export const markMessageAsReceived = async (
  data: MarkMessageAsReceivedRequest
): Promise<void> => {
  const endpoint = 'messages.markReceived'
  await ky.post(
    getApiEndpointUrl(endpoint, '/api/messages/mark-received'),
    await withExternalAuth(endpoint, {
      json: data
    })
  )
}

export const streamAIMessage = async (
  data: StreamAIMessageRequest
): Promise<Response> => {
  const endpoint = 'ai.stream'
  return ky.post(
    getApiEndpointUrl(endpoint, '/api/ai/stream'),
    await withExternalAuth(endpoint, {
      json: data
    })
  )
}

export const transformApiMessage = (msg: ApiMessage): ChatMessage => {
  return {
    id: msg.id,
    content: msg.content,
    user: {
      id: msg.user.id,
      name: msg.user.name,
      avatar_url: msg.user.avatar_url
    },
    createdAt: msg.createdAt,
    roomId: msg.channelId,
    isAI: msg.isAI || false,
    isPrivate: msg.isPrivate || false,
    requesterId: msg.requesterId,
    isDeleted: msg.isDeleted || false,
    deletedAt: msg.deletedAt,
    deletedBy: msg.deletedBy,
    hasAIResponse: msg.hasAIResponse || false,
    clientMsgId: msg.clientMsgId,
    streamSourceId: msg.streamSourceId,
    isPending: false,
    isQueued: false,
    isRetrying: false,
    isFailed: false
  }
}
