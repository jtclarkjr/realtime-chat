'use server'

import { getAuthenticatedUser } from '@/lib/auth/server-user'
import { getLastMessagesByRoom } from '@/lib/services/chat'
import {
  listGroupsForViewer,
  listPersonalChatsForViewer
} from '@/lib/services/domain'
import type {
  DatabaseRoom,
  GroupView,
  PersonalChat
} from '@/lib/types/database'
import { getRoomHref } from '@/lib/utils/chat-routes'

export interface RoomWithLastMessage extends DatabaseRoom {
  lastMessage?: {
    content: string
    timestamp: string
    userName: string
    isAI: boolean
  }
}

export interface InitialNavigationData {
  groups: GroupView[]
  groupChannels: DatabaseRoom[]
  personalChats: PersonalChat[]
  defaultRoomId: string | null
  defaultHref: string | null
}

export async function getInitialNavigationData(): Promise<InitialNavigationData> {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return {
        groups: [],
        groupChannels: [],
        personalChats: [],
        defaultRoomId: null,
        defaultHref: null
      }
    }

    const [groups, personalChatsResponse] = await Promise.all([
      listGroupsForViewer(user),
      listPersonalChatsForViewer(user, {
        limit: 50,
        offset: 0
      })
    ])

    const groupChannels = groups.flatMap((group) =>
      group.channels.map((entry) => entry.room)
    )
    const personalChats = personalChatsResponse.chats
    const defaultRoom = groupChannels[0] || personalChats[0] || null

    return {
      groups,
      groupChannels,
      personalChats,
      defaultRoomId: defaultRoom?.id || null,
      defaultHref: defaultRoom ? getRoomHref(defaultRoom) : null
    }
  } catch (error) {
    console.error('Error fetching initial navigation data:', error)
    return {
      groups: [],
      groupChannels: [],
      personalChats: [],
      defaultRoomId: null,
      defaultHref: null
    }
  }
}

export async function getConversationsWithLastMessage(): Promise<
  RoomWithLastMessage[]
> {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return []

    const { groups, personalChats } = await getInitialNavigationData()
    const rooms = [
      ...groups.flatMap((group) => group.channels.map((entry) => entry.room)),
      ...personalChats
    ]

    if (rooms.length === 0) {
      return []
    }

    const latestByRoom = await getLastMessagesByRoom(
      rooms.map((room) => room.id),
      user.id
    )

    return rooms.map((room) => {
      const lastMsg = latestByRoom.get(room.id)
      if (!lastMsg) {
        return room
      }

      return {
        ...room,
        lastMessage: {
          content: lastMsg.content,
          timestamp: lastMsg.timestamp,
          userName: lastMsg.userName,
          isAI: lastMsg.isAI
        }
      }
    })
  } catch (error) {
    console.error('Error fetching conversations with last messages:', error)
    return []
  }
}
