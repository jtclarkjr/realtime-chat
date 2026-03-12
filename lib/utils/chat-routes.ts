import type { DatabaseRoom } from '@/lib/types/database'

type RouteParamsLike =
  | Record<string, string | string[] | undefined>
  | null
  | undefined

export type ConversationMode = 'group' | 'personal' | null

export interface ConversationRouteContext {
  mode: ConversationMode
  roomId: string | null
  groupId: string | null
}

export function getRoomHref(
  room: Pick<DatabaseRoom, 'id' | 'kind' | 'group_id'>
): string {
  if (room.kind === 'personal') {
    return `/personal/${room.id}`
  }

  if (room.group_id) {
    return `/group/${room.group_id}/channel/${room.id}`
  }

  return `/room/${room.id}`
}

export function getConversationRouteContext(
  params?: RouteParamsLike
): ConversationRouteContext {
  const groupId = getParamValue(params?.groupId)
  const channelId = getParamValue(params?.channelId)
  const chatId = getParamValue(params?.chatId)
  const legacyRoomId = getParamValue(params?.id)

  if (groupId && channelId) {
    return {
      mode: 'group',
      roomId: channelId,
      groupId
    }
  }

  if (chatId) {
    return {
      mode: 'personal',
      roomId: chatId,
      groupId: null
    }
  }

  if (legacyRoomId) {
    return {
      mode: null,
      roomId: legacyRoomId,
      groupId: null
    }
  }

  return {
    mode: null,
    roomId: null,
    groupId: null
  }
}

export function getConversationRouteContextFromPathname(
  pathname: string
): ConversationRouteContext {
  const segments = pathname.split('/').filter(Boolean)

  if (segments[0] === 'group' && segments[2] === 'channel') {
    return {
      mode: 'group',
      groupId: segments[1] || null,
      roomId: segments[3] || null
    }
  }

  if (segments[0] === 'personal') {
    return {
      mode: segments[1] ? 'personal' : null,
      groupId: null,
      roomId: segments[1] || null
    }
  }

  if (segments[0] === 'room') {
    return {
      mode: null,
      groupId: null,
      roomId: segments[1] || null
    }
  }

  return {
    mode: null,
    groupId: null,
    roomId: null
  }
}

function getParamValue(value: string | string[] | undefined): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  if (Array.isArray(value) && value[0]) {
    return value[0]
  }

  return null
}
