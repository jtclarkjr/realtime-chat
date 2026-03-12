'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useCreateChannel, useGenerateRoom } from '@/lib/query/mutations'
import { roomNameSchema } from '@/lib/validation/schemas'
import type { DatabaseRoom } from '@/lib/types/database'
import { getRoomHref } from '@/lib/utils/chat-routes'

interface AddChannelDialogProps {
  groupId: string
  groupVisibility: 'public' | 'private'
  existingRooms: DatabaseRoom[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const roomNameExists = (name: string, existingRooms: DatabaseRoom[]) =>
  existingRooms.some(
    (room) => room.name.toLowerCase() === name.trim().toLowerCase()
  )

export function AddChannelDialog({
  groupId,
  groupVisibility,
  existingRooms,
  open,
  onOpenChange
}: AddChannelDialogProps) {
  const router = useRouter()
  const createChannelMutation = useCreateChannel()
  const generateRoomMutation = useGenerateRoom()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [error, setError] = useState<string | null>(null)
  const [hasMetMinNameLength, setHasMetMinNameLength] = useState(false)

  useEffect(() => {
    if (groupVisibility === 'public') {
      setVisibility('public')
    }
  }, [groupVisibility, open])

  const reset = () => {
    setName('')
    setDescription('')
    setVisibility('public')
    setError(null)
    setHasMetMinNameLength(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      reset()
    }
  }

  const nameError = (() => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return null
    }

    const result = roomNameSchema.safeParse(name)
    if (!result.success) {
      const issue = result.error.issues[0]
      const isMinError = issue?.code === 'too_small' && issue.minimum === 2

      if (!hasMetMinNameLength && isMinError) {
        return null
      }

      return issue?.message || 'Invalid channel name'
    }

    if (roomNameExists(result.data, existingRooms)) {
      return 'A channel with this name already exists'
    }

    return null
  })()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const validation = roomNameSchema.safeParse(name)
    if (!validation.success) {
      return
    }

    if (roomNameExists(validation.data, existingRooms)) {
      return
    }

    try {
      setError(null)
      const response = await createChannelMutation.mutateAsync({
        groupId,
        name: validation.data,
        description: description.trim() || undefined,
        visibility: groupVisibility === 'public' ? 'public' : visibility
      })

      if (!response.success || !response.room) {
        throw new Error(response.error || 'Failed to create channel')
      }

      toast.success(`Created channel #${response.room.name}`)
      handleOpenChange(false)
      router.push(getRoomHref(response.room))
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to create channel'
      )
    }
  }

  const handleGenerate = async () => {
    try {
      setError(null)
      const response = await generateRoomMutation.mutateAsync({
        existingRoomNames: existingRooms.map((room) => room.name),
        currentName: name.trim() || undefined,
        currentDescription: description.trim() || undefined
      })

      if (response.suggestion) {
        setName(response.suggestion.name)
        setDescription(response.suggestion.description)
        setHasMetMinNameLength(true)
      }
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : 'Failed to generate channel suggestion'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create channel</DialogTitle>
          <DialogDescription>
            Create a new channel for this group or let AI generate a starting
            point.
          </DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          onClick={handleGenerate}
          disabled={
            createChannelMutation.isPending || generateRoomMutation.isPending
          }
          className="w-full justify-center gap-2"
        >
          <Sparkles
            className={
              generateRoomMutation.isPending
                ? 'h-4 w-4 animate-spin'
                : 'h-4 w-4'
            }
          />
          {generateRoomMutation.isPending ? 'Generating...' : 'Generate'}
        </Button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="channel-name" className="text-sm font-medium">
              Channel name
            </label>
            <Input
              id="channel-name"
              value={name}
              onChange={(event) => {
                const nextValue = event.target.value
                setName(nextValue)
                setError(null)
                if (nextValue.trim().length >= 2) {
                  setHasMetMinNameLength(true)
                }
              }}
              placeholder="e.g. launch"
              disabled={
                createChannelMutation.isPending ||
                generateRoomMutation.isPending
              }
              required
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="channel-description"
              className="text-sm font-medium"
            >
              Description
            </label>
            <Input
              id="channel-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                setError(null)
              }}
              placeholder="Optional channel description"
              disabled={
                createChannelMutation.isPending ||
                generateRoomMutation.isPending
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <Select
              value={groupVisibility === 'public' ? 'public' : visibility}
              onValueChange={(value: 'public' | 'private') =>
                setVisibility(value)
              }
              disabled={groupVisibility === 'public'}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                {groupVisibility === 'private' && (
                  <SelectItem value="private">Private</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={
                createChannelMutation.isPending ||
                generateRoomMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createChannelMutation.isPending ||
                generateRoomMutation.isPending ||
                !name.trim() ||
                !!nameError ||
                !groupId
              }
            >
              {createChannelMutation.isPending
                ? 'Creating...'
                : 'Create channel'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
