'use client'

import { useParams } from 'next/navigation'
import { getConversationRouteContext } from '@/lib/utils/chat-routes'

/**
 * Hook to get the active room ID from the URL
 * Returns the room ID from the URL params, or null if not in a room
 */
export function useActiveRoomId(): string | null {
  const params = useParams()
  return getConversationRouteContext(params).roomId
}
