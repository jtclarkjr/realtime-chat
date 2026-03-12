'use client'

import { useGroups } from '@/lib/query/queries'
import { useUIStore } from '@/lib/stores/ui-store'
import type { GroupView } from '@/lib/types/database'
import { AddChannelDialog } from './add-channel-dialog'
import { AddGroupDialog } from './add-group-dialog'

interface NavigationDialogsProps {
  initialGroups: GroupView[]
}

export function NavigationDialogs({ initialGroups }: NavigationDialogsProps) {
  const {
    createGroupDialogOpen,
    setCreateGroupDialogOpen,
    createChannelDialogOpen,
    selectedGroupIdForChannel,
    selectedGroupVisibilityForChannel,
    closeCreateChannelDialog
  } = useUIStore()

  const { data: groups = [] } = useGroups({
    initialData: initialGroups.length > 0 ? initialGroups : undefined,
    enabled: createChannelDialogOpen
  })

  const selectedGroup = groups.find(
    (group) => group.group.id === selectedGroupIdForChannel
  )

  return (
    <>
      <AddGroupDialog
        open={createGroupDialogOpen}
        onOpenChange={setCreateGroupDialogOpen}
      />
      <AddChannelDialog
        groupId={selectedGroupIdForChannel}
        groupVisibility={
          selectedGroup?.group.visibility || selectedGroupVisibilityForChannel
        }
        existingRooms={selectedGroup?.channels.map((entry) => entry.room) || []}
        open={createChannelDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateChannelDialog()
          }
        }}
      />
    </>
  )
}
