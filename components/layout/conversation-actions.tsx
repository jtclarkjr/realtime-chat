'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  useCreateChannel,
  useCreateGroup,
  useStartPersonalChat
} from '@/lib/query/mutations'
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user'
import type { GroupView } from '@/lib/types/database'
import { getRoomHref } from '@/lib/utils/chat-routes'

type ConversationActionMode = 'group' | 'channel' | 'personal'

const DEFAULT_AI_MODEL_VALUE = '__default__'

interface ConversationActionsProps {
  groups: GroupView[]
  defaultMode?: ConversationActionMode
  trigger?: React.ReactNode
  onComplete?: () => void
}

const personalAiModels = [
  { value: DEFAULT_AI_MODEL_VALUE, label: 'Default model' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' }
]

export function ConversationActions({
  groups,
  defaultMode = 'group',
  trigger,
  onComplete
}: ConversationActionsProps) {
  const router = useRouter()
  const user = useAuthenticatedUser()
  const writableGroups = useMemo(
    () => groups.filter((group) => group.permissions.can_write),
    [groups]
  )

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<ConversationActionMode>(defaultMode)

  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupVisibility, setGroupVisibility] = useState<'public' | 'private'>(
    'public'
  )

  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [channelName, setChannelName] = useState('')
  const [channelDescription, setChannelDescription] = useState('')
  const [channelVisibility, setChannelVisibility] = useState<
    'public' | 'private'
  >('public')

  const [chatName, setChatName] = useState('')
  const [chatPrompt, setChatPrompt] = useState('')
  const [chatAIEnabled, setChatAIEnabled] = useState(true)
  const [chatAIModel, setChatAIModel] = useState(DEFAULT_AI_MODEL_VALUE)

  const createGroupMutation = useCreateGroup()
  const createChannelMutation = useCreateChannel()
  const startPersonalChatMutation = useStartPersonalChat()

  useEffect(() => {
    if (!selectedGroupId && writableGroups[0]) {
      setSelectedGroupId(writableGroups[0].group.id)
    }
  }, [selectedGroupId, writableGroups])

  const selectedGroup = writableGroups.find(
    (group) => group.group.id === selectedGroupId
  )
  const canCreatePrivateChannel = selectedGroup?.group.visibility === 'private'

  const isPending =
    createGroupMutation.isPending ||
    createChannelMutation.isPending ||
    startPersonalChatMutation.isPending
  let submitLabel = 'Start chat'

  if (mode === 'group') {
    submitLabel = createGroupMutation.isPending
      ? 'Creating group...'
      : 'Create group'
  } else if (mode === 'channel') {
    submitLabel = createChannelMutation.isPending
      ? 'Creating channel...'
      : 'Create channel'
  } else if (startPersonalChatMutation.isPending) {
    submitLabel = 'Starting chat...'
  }

  const resetForm = () => {
    setMode(defaultMode)
    setGroupName('')
    setGroupDescription('')
    setGroupVisibility('public')
    setSelectedGroupId(writableGroups[0]?.group.id || '')
    setChannelName('')
    setChannelDescription('')
    setChannelVisibility('public')
    setChatName('')
    setChatPrompt('')
    setChatAIEnabled(true)
    setChatAIModel(DEFAULT_AI_MODEL_VALUE)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      if (mode === 'group') {
        const response = await createGroupMutation.mutateAsync({
          name: groupName.trim(),
          description: groupDescription.trim() || undefined,
          visibility: groupVisibility
        })

        if (!response.success || !response.group) {
          throw new Error(response.error || 'Failed to create group')
        }

        toast.success(`Created group ${response.group.name}`)
        setOpen(false)
        onComplete?.()
        return
      }

      if (mode === 'channel') {
        const response = await createChannelMutation.mutateAsync({
          groupId: selectedGroupId,
          name: channelName.trim(),
          description: channelDescription.trim() || undefined,
          visibility:
            canCreatePrivateChannel && channelVisibility === 'private'
              ? 'private'
              : 'public'
        })

        if (!response.success || !response.room) {
          throw new Error(response.error || 'Failed to create channel')
        }

        toast.success(`Created channel #${response.room.name}`)
        setOpen(false)
        onComplete?.()
        router.push(getRoomHref(response.room))
        return
      }

      const response = await startPersonalChatMutation.mutateAsync({
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        name: chatName.trim() || undefined,
        content: chatPrompt.trim(),
        aiEnabled: chatAIEnabled,
        aiModel:
          chatAIModel === DEFAULT_AI_MODEL_VALUE ? undefined : chatAIModel
      })

      if (!response.success || !response.chat) {
        throw new Error(response.error || 'Failed to start personal chat')
      }

      toast.success('Started personal chat')
      setOpen(false)
      onComplete?.()
      router.push(getRoomHref(response.chat))
    } catch (error) {
      console.error('Conversation action failed:', error)
      toast.error(error instanceof Error ? error.message : 'Request failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline" size="icon">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Create conversation</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create a conversation</DialogTitle>
          <DialogDescription>
            Add a new group, create a channel inside a group, or start a
            personal AI chat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {(['group', 'channel', 'personal'] as const).map((option) => (
              <Button
                key={option}
                type="button"
                variant={mode === option ? 'default' : 'outline'}
                className="capitalize"
                onClick={() => setMode(option)}
                disabled={isPending}
              >
                {option}
              </Button>
            ))}
          </div>

          {mode === 'group' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="group-name" className="text-sm font-medium">
                  Group name
                </label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="e.g. Product Team"
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="group-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>
                <Input
                  id="group-description"
                  value={groupDescription}
                  onChange={(event) => setGroupDescription(event.target.value)}
                  placeholder="Optional description"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <Select
                  value={groupVisibility}
                  onValueChange={(value: 'public' | 'private') =>
                    setGroupVisibility(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {mode === 'channel' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group</label>
                <Select
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                  disabled={writableGroups.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {writableGroups.map((group) => (
                      <SelectItem key={group.group.id} value={group.group.id}>
                        {group.group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {writableGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Create or join a writable group first.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="channel-name" className="text-sm font-medium">
                  Channel name
                </label>
                <Input
                  id="channel-name"
                  value={channelName}
                  onChange={(event) => setChannelName(event.target.value)}
                  placeholder="e.g. launch"
                  disabled={isPending || writableGroups.length === 0}
                  required
                />
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
                  value={channelDescription}
                  onChange={(event) =>
                    setChannelDescription(event.target.value)
                  }
                  placeholder="Optional description"
                  disabled={isPending || writableGroups.length === 0}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Visibility</label>
                <Select
                  value={channelVisibility}
                  onValueChange={(value: 'public' | 'private') =>
                    setChannelVisibility(value)
                  }
                  disabled={
                    isPending ||
                    writableGroups.length === 0 ||
                    !canCreatePrivateChannel
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    {canCreatePrivateChannel && (
                      <SelectItem value="private">Private</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {!canCreatePrivateChannel && selectedGroup && (
                  <p className="text-xs text-muted-foreground">
                    Private channels are only available inside private groups.
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === 'personal' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="personal-name" className="text-sm font-medium">
                  Chat name
                </label>
                <Input
                  id="personal-name"
                  value={chatName}
                  onChange={(event) => setChatName(event.target.value)}
                  placeholder="Optional title"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="personal-prompt"
                  className="text-sm font-medium"
                >
                  First prompt
                </label>
                <textarea
                  id="personal-prompt"
                  value={chatPrompt}
                  onChange={(event) => setChatPrompt(event.target.value)}
                  placeholder="What do you want help with?"
                  className="min-h-32 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  disabled={isPending}
                  required
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div>
                  <div className="text-sm font-medium">Auto-run AI reply</div>
                  <div className="text-xs text-muted-foreground">
                    Immediately start the first AI response after the chat
                    opens.
                  </div>
                </div>
                <Button
                  type="button"
                  variant={chatAIEnabled ? 'default' : 'outline'}
                  onClick={() => setChatAIEnabled((value) => !value)}
                  disabled={isPending}
                >
                  {chatAIEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">AI model</label>
                <Select value={chatAIModel} onValueChange={setChatAIModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {personalAiModels.map((option) => (
                      <SelectItem key={option.label} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                (mode === 'group' && !groupName.trim()) ||
                (mode === 'channel' &&
                  (!selectedGroupId || !channelName.trim())) ||
                (mode === 'personal' && !chatPrompt.trim())
              }
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
