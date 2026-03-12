'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { AddRoomDialog } from '@/components/add-room-dialog'
import { useRooms } from '@/lib/query/queries/use-rooms'
import type { DatabaseRoom } from '@/lib/types/database'

interface ChannelSearchCardProps {
  initialRooms: DatabaseRoom[]
  canCreateChannel: boolean
}

export function ChannelSearchCard({
  initialRooms,
  canCreateChannel
}: ChannelSearchCardProps) {
  const router = useRouter()
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [showAddRoom, setShowAddRoom] = useState(false)
  const { data: rooms = [] } = useRooms({
    initialData: initialRooms.length > 0 ? initialRooms : undefined,
    enabled: initialRooms.length === 0
  })

  const options = useMemo(
    () =>
      [...rooms]
        .toSorted((a, b) => a.name.localeCompare(b.name))
        .map((room) => ({
          value: room.id,
          label: room.name,
          description: room.description || undefined
        })),
    [rooms]
  )

  const handleSelect = (roomId: string) => {
    setSelectedRoomId(roomId)
    router.push(`/room/${roomId}`)
  }

  const handleRoomCreated = async (): Promise<void> => {
    setShowAddRoom(false)
  }

  if (options.length === 0) {
    return null
  }

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Find a channel</h2>
          {canCreateChannel && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0 cursor-pointer"
              aria-label="Create channel"
              title="Create channel"
              onClick={() => setShowAddRoom(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Search and jump directly to an existing channel
          </div>
          <Combobox
            options={options}
            value={selectedRoomId}
            onSelect={handleSelect}
            placeholder="Search channels..."
            searchPlaceholder="Type a channel name..."
            emptyMessage="No matching channels."
          />
        </div>
      </div>
      {canCreateChannel && (
        <AddRoomDialog
          open={showAddRoom}
          onOpenChange={setShowAddRoom}
          onRoomCreated={handleRoomCreated}
          existingRooms={rooms}
        />
      )}
    </>
  )
}
