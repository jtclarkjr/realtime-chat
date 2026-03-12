'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user'
import { useCreateGroup } from '@/lib/query/mutations'
import { useGroupUsers } from '@/lib/query/queries'
import type { UserDirectoryEntry } from '@/lib/types/database'
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

interface AddGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const normalizeGroupName = (value: string) => value.trim().normalize('NFC')

const validateGroupName = (value: string): string | null => {
  const normalized = normalizeGroupName(value)
  if (!normalized) {
    return 'Group name is required'
  }
  if (normalized.length < 2) {
    return 'Group name must be at least 2 characters'
  }
  if (normalized.length > 80) {
    return 'Group name must be 80 characters or less'
  }

  return null
}

export function AddGroupDialog({ open, onOpenChange }: AddGroupDialogProps) {
  const user = useAuthenticatedUser()
  const createGroupMutation = useCreateGroup()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<UserDirectoryEntry[]>(
    []
  )
  const [nameTouched, setNameTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: directoryUsers = [], isLoading: loadingDirectoryUsers } =
    useGroupUsers({
      query: memberSearch,
      enabled: open && visibility === 'private'
    })

  const selectableUsers = useMemo(() => {
    const selectedIds = new Set(
      selectedMembers.map((member) => member.user_id.toLowerCase())
    )

    return directoryUsers.filter(
      (entry) =>
        entry.user_id !== user.id &&
        !selectedIds.has(entry.user_id.toLowerCase())
    )
  }, [directoryUsers, selectedMembers, user.id])

  const nameError = validateGroupName(name)

  const reset = () => {
    setName('')
    setDescription('')
    setVisibility('public')
    setMemberSearch('')
    setSelectedMembers([])
    setNameTouched(false)
    setError(null)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      reset()
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setNameTouched(true)

    const validationError = validateGroupName(name)
    if (validationError) {
      return
    }

    try {
      setError(null)
      const response = await createGroupMutation.mutateAsync({
        name: normalizeGroupName(name),
        description: description.trim() || undefined,
        visibility,
        memberUserIds:
          visibility === 'private'
            ? selectedMembers.map((member) => member.user_id)
            : undefined
      })

      if (!response.success || !response.group) {
        throw new Error(response.error || 'Failed to create group')
      }

      toast.success(`Created group ${response.group.name}`)
      handleOpenChange(false)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to create group'
      )
    }
  }

  const addMember = (entry: UserDirectoryEntry) => {
    setSelectedMembers((current) => [...current, entry])
    setMemberSearch('')
  }

  const removeMember = (userId: string) => {
    setSelectedMembers((current) =>
      current.filter((member) => member.user_id !== userId)
    )
  }

  let directoryContent: ReactNode
  if (loadingDirectoryUsers) {
    directoryContent = (
      <p className="px-2 py-1 text-sm text-muted-foreground">
        Loading users...
      </p>
    )
  } else if (selectableUsers.length === 0) {
    directoryContent = (
      <p className="px-2 py-1 text-sm text-muted-foreground">
        {memberSearch.trim()
          ? 'No matching users available.'
          : 'Search to find users to add.'}
      </p>
    )
  } else {
    directoryContent = selectableUsers.slice(0, 8).map((entry) => (
      <button
        key={entry.user_id}
        type="button"
        onClick={() => addMember(entry)}
        className="flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">
            {entry.display_name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {entry.email || entry.user_id}
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground">Add</span>
      </button>
    ))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create group</DialogTitle>
          <DialogDescription>
            Groups are top-level containers for shared channels.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="group-name" className="text-sm font-medium">
              Group name
            </label>
            <Input
              id="group-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameTouched(true)
                setError(null)
              }}
              onBlur={() => setNameTouched(true)}
              placeholder="e.g. Product Team"
              disabled={createGroupMutation.isPending}
              required
            />
            {nameTouched && nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="group-description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="group-description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value)
                setError(null)
              }}
              placeholder="Optional group description"
              disabled={createGroupMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <Select
              value={visibility}
              onValueChange={(value: 'public' | 'private') => {
                setVisibility(value)
                setError(null)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visibility === 'private' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <label
                  htmlFor="private-group-members"
                  className="text-sm font-medium"
                >
                  Add members
                </label>
                <Input
                  id="private-group-members"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                  placeholder="Search users by name or email"
                  disabled={createGroupMutation.isPending}
                />
              </div>

              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => removeMember(member.user_id)}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <span>{member.display_name}</span>
                      <X className="h-3 w-3" />
                      <span className="sr-only">
                        Remove {member.display_name}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
                {directoryContent}
              </div>
            </div>
          )}

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
              disabled={createGroupMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createGroupMutation.isPending || !!nameError}
            >
              {createGroupMutation.isPending ? 'Creating...' : 'Create group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
