export const queryKeys = {
  rooms: {
    all: ['rooms'] as const,
    list: () => [...queryKeys.rooms.all, 'list'] as const,
    detail: (roomId: string) =>
      [...queryKeys.rooms.all, 'detail', roomId] as const
  },
  groups: {
    all: ['groups'] as const,
    list: () => [...queryKeys.groups.all, 'list'] as const,
    detail: (groupId: string) =>
      [...queryKeys.groups.all, 'detail', groupId] as const,
    users: (query: string) =>
      [...queryKeys.groups.all, 'users', query] as const,
    members: (groupId: string) =>
      [...queryKeys.groups.all, 'members', groupId] as const,
    roomMembers: (roomId: string) =>
      [...queryKeys.groups.all, 'room-members', roomId] as const
  },
  personalChats: {
    all: ['personal-chats'] as const,
    list: (query: string, limit: number, offset: number) =>
      [...queryKeys.personalChats.all, 'list', query, limit, offset] as const,
    detail: (chatId: string) =>
      [...queryKeys.personalChats.all, 'detail', chatId] as const
  },
  ai: {
    all: ['ai'] as const,
    usage: () => [...queryKeys.ai.all, 'usage'] as const,
    personalization: () => [...queryKeys.ai.all, 'personalization'] as const
  },
  messages: {
    all: ['messages'] as const,
    list: (roomId: string) =>
      [...queryKeys.messages.all, 'list', roomId] as const,
    missed: (roomId: string, userId: string) =>
      [...queryKeys.messages.all, 'missed', roomId, userId] as const,
    recent: (roomId: string) =>
      [...queryKeys.messages.all, 'recent', roomId] as const
  }
} as const
