'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { queryKeys } from '@/lib/query/query-keys'

interface RoomsRealtimeSyncProps {
  userId: string
}

export function RoomsRealtimeSync({ userId }: RoomsRealtimeSyncProps) {
  const queryClient = useQueryClient()
  const supabaseRef = useRef(createClient())

  useEffect(() => {
    const supabase = supabaseRef.current
    const invalidateCatalog = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.groups.all })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.personalChats.all
      })
    }

    const channel = supabase.channel(`rooms-sync-${userId}`)

    ;(
      ['rooms', 'groups', 'group_memberships', 'room_memberships'] as const
    ).forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table
        },
        invalidateCatalog
      )
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, userId])

  return null
}
