'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import { useGroups, usePersonalChats } from '@/lib/query/queries'
import type { GroupView, PersonalChat } from '@/lib/types/database'
import { getRoomHref } from '@/lib/utils/chat-routes'

interface ChannelSearchCardProps {
  initialGroups: GroupView[]
  initialPersonalChats: PersonalChat[]
  canCreateChannel: boolean
}

export function ChannelSearchCard({
  initialGroups,
  initialPersonalChats,
  canCreateChannel
}: ChannelSearchCardProps) {
  const router = useRouter()
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const { data: groups = [] } = useGroups({
    initialData: initialGroups.length > 0 ? initialGroups : undefined,
    enabled: initialGroups.length === 0
  })
  const { data: personalChats = [] } = usePersonalChats({
    initialData:
      initialPersonalChats.length > 0 ? initialPersonalChats : undefined,
    enabled: canCreateChannel && initialPersonalChats.length === 0
  })
  const rooms = useMemo(
    () => [
      ...groups.flatMap((group) => group.channels.map((entry) => entry.room)),
      ...personalChats
    ],
    [groups, personalChats]
  )

  const options = useMemo(
    () =>
      [...rooms]
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .map((room) => ({
          value: room.id,
          label: room.name,
          description:
            room.kind === 'personal'
              ? 'Personal AI chat'
              : room.description || undefined
        })),
    [rooms]
  )

  const handleSelect = (roomId: string) => {
    setSelectedRoomId(roomId)
    const room = rooms.find((entry) => entry.id === roomId)
    router.push(room ? getRoomHref(room) : `/room/${roomId}`)
  }

  if (options.length === 0) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Find a conversation</h2>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          Search and jump directly to an existing group channel or personal chat
        </div>
        <Combobox
          options={options}
          value={selectedRoomId}
          onSelect={handleSelect}
          placeholder="Search conversations..."
          searchPlaceholder="Type a conversation name..."
          emptyMessage="No matching conversations."
        />
      </div>
    </div>
  )
}
