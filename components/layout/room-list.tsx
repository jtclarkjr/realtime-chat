'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Trash2,
  Users
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { MemberManagementDialog } from '@/components/layout/member-management-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { PillSwitcher } from '@/components/ui/pill-switcher'
import { useDeleteGroup } from '@/lib/query/mutations'
import { useGroups, usePersonalChats } from '@/lib/query/queries'
import { useUIStore } from '@/lib/stores/ui-store'
import type {
  DatabaseRoom,
  GroupView,
  PersonalChat
} from '@/lib/types/database'
import type { SidebarSection } from '@/lib/types/ui'
import type { PublicUser } from '@/lib/types/user'
import {
  ANONYMOUS_SIDEBAR_SECTION_OPTIONS,
  SIDEBAR_SECTION_OPTIONS
} from '@/lib/constants/sidebar'
import { cn } from '@/lib/utils'
import { RoomListItem } from './room-list-item'

interface RoomListProps {
  activeRoomId: string | null
  activeSection: SidebarSection
  collapsed: boolean
  initialGroups: GroupView[]
  initialGroupChannels: DatabaseRoom[]
  initialPersonalChats: PersonalChat[]
  user: PublicUser
  onSectionChange: (section: SidebarSection) => void
  onNavigate?: () => void
}

export function RoomList({
  activeRoomId,
  activeSection,
  collapsed,
  initialGroups,
  initialGroupChannels,
  initialPersonalChats,
  user,
  onSectionChange,
  onNavigate
}: RoomListProps) {
  const router = useRouter()
  const {
    openCreateChannelDialog,
    setCreateGroupDialogOpen,
    expandedGroupId,
    toggleExpandedGroup
  } = useUIStore()
  const groupsQuery = useGroups({
    initialData: initialGroups.length > 0 ? initialGroups : undefined,
    enabled: activeSection === 'groups'
  })
  const personalChatsQuery = usePersonalChats({
    initialData:
      initialPersonalChats.length > 0 ? initialPersonalChats : undefined,
    enabled: activeSection === 'personal' && !user.isAnonymous
  })
  const deleteGroupMutation = useDeleteGroup()
  const [groupToManageId, setGroupToManageId] = useState<string | null>(null)
  const [groupToDeleteId, setGroupToDeleteId] = useState<string | null>(null)

  const effectiveGroups = groupsQuery.data ?? initialGroups
  const effectivePersonalChats = personalChatsQuery.data ?? initialPersonalChats

  const sectionOptions = user.isAnonymous
    ? ANONYMOUS_SIDEBAR_SECTION_OPTIONS
    : SIDEBAR_SECTION_OPTIONS
  const activeSectionOption =
    sectionOptions.find((option) => option.value === activeSection) ||
    sectionOptions[0]
  const ActiveSectionIcon = activeSectionOption?.icon

  const loading =
    activeSection === 'groups'
      ? groupsQuery.isLoading &&
        initialGroups.length === 0 &&
        initialGroupChannels.length === 0
      : !user.isAnonymous &&
        personalChatsQuery.isLoading &&
        initialPersonalChats.length === 0

  const groupToManage = useMemo(
    () =>
      effectiveGroups.find((group) => group.group.id === groupToManageId) ||
      null,
    [effectiveGroups, groupToManageId]
  )
  const groupToDelete = useMemo(
    () =>
      effectiveGroups.find((group) => group.group.id === groupToDeleteId) ||
      null,
    [effectiveGroups, groupToDeleteId]
  )

  const handleCreatePersonal = () => {
    router.push('/personal')
    onNavigate?.()
  }

  const handleDeleteGroup = async () => {
    if (!groupToDelete) {
      return
    }

    try {
      const response = await deleteGroupMutation.mutateAsync({
        groupId: groupToDelete.group.id
      })
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete group')
      }

      const deletingActiveChannel = groupToDelete.channels.some(
        (entry) => entry.room.id === activeRoomId
      )

      toast.success(`Deleted ${groupToDelete.group.name}`)
      setGroupToDeleteId(null)

      if (deletingActiveChannel) {
        router.push('/')
        onNavigate?.()
      }
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete group'
      )
    }
  }

  let headerContent: ReactNode
  if (collapsed && ActiveSectionIcon) {
    headerContent = (
      <div
        className="flex h-7 w-7 items-center justify-center text-muted-foreground"
        aria-label={activeSectionOption.label}
        title={activeSectionOption.label}
      >
        <ActiveSectionIcon className="h-4 w-4" />
      </div>
    )
  } else if (user.isAnonymous) {
    headerContent = (
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Groups
      </h2>
    )
  } else {
    headerContent = (
      <PillSwitcher
        ariaLabel="Sidebar sections"
        value={activeSection}
        options={sectionOptions}
        onValueChange={onSectionChange}
        collapsed
        className="w-fit"
      />
    )
  }

  let listContent: ReactNode = null
  if (activeSection === 'groups') {
    listContent = (
      <div className="space-y-1">
        {effectiveGroups.length === 0 && !collapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Create your first group from the plus button.
          </div>
        )}
        {effectiveGroups.map((group) => {
          const canCreateChannel =
            !user.isAnonymous && group.permissions.can_write
          const canManageMembers = group.permissions.can_admin
          const canDeleteGroup = group.permissions.is_owner
          const isExpanded = collapsed || expandedGroupId === group.group.id

          return (
            <div key={group.group.id} className="space-y-1">
              {!collapsed && (
                <div className="flex items-center gap-1 px-2">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/50"
                    onClick={() => toggleExpandedGroup(group.group.id)}
                    aria-expanded={expandedGroupId === group.group.id}
                    aria-controls={`group-panel-${group.group.id}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.group.name}
                    </span>
                  </button>

                  {(canCreateChannel || canManageMembers || canDeleteGroup) && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 cursor-pointer"
                          title={`Actions for ${group.group.name}`}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                          <span className="sr-only">
                            Actions for {group.group.name}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="end"
                        className="w-44 p-1"
                        sideOffset={6}
                      >
                        <div className="flex flex-col">
                          {canCreateChannel && (
                            <Button
                              variant="ghost"
                              className="h-8 cursor-pointer justify-start gap-2 px-2 text-xs"
                              onClick={() =>
                                openCreateChannelDialog(
                                  group.group.id,
                                  group.group.visibility
                                )
                              }
                            >
                              <Plus className="h-3 w-3" />
                              Add channel
                            </Button>
                          )}
                          {canManageMembers && (
                            <Button
                              variant="ghost"
                              className="h-8 cursor-pointer justify-start gap-2 px-2 text-xs"
                              onClick={() => setGroupToManageId(group.group.id)}
                            >
                              <Users className="h-3 w-3" />
                              Manage members
                            </Button>
                          )}
                          {canDeleteGroup && (
                            <Button
                              variant="ghost"
                              className="h-8 cursor-pointer justify-start gap-2 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => setGroupToDeleteId(group.group.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete group
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}

              <div
                id={`group-panel-${group.group.id}`}
                className={cn(!collapsed && !isExpanded && 'hidden')}
              >
                {group.channels.length === 0 && !collapsed ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No channels yet.
                  </div>
                ) : (
                  group.channels.map((entry) => (
                    <RoomListItem
                      key={entry.room.id}
                      room={entry.room}
                      isActive={entry.room.id === activeRoomId}
                      collapsed={collapsed}
                      onNavigate={onNavigate}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  } else if (!user.isAnonymous) {
    listContent = (
      <div className="space-y-1">
        {effectivePersonalChats.length === 0 && !collapsed ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Start a personal AI chat from the plus button.
          </div>
        ) : (
          effectivePersonalChats.map((chat) => (
            <RoomListItem
              key={chat.id}
              room={chat}
              isActive={chat.id === activeRoomId}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 p-3">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-9 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-3 py-2">
          <div
            className={cn(
              'flex items-center gap-2',
              collapsed ? 'justify-center' : 'justify-between'
            )}
          >
            {headerContent}

            {!collapsed && !user.isAnonymous && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer"
                onClick={() => {
                  if (activeSection === 'groups') {
                    setCreateGroupDialogOpen(true)
                  } else {
                    handleCreatePersonal()
                  }
                }}
                title={
                  activeSection === 'groups'
                    ? 'Create group'
                    : 'Start personal chat'
                }
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">
                  {activeSection === 'groups'
                    ? 'Create group'
                    : 'Start personal chat'}
                </span>
              </Button>
            )}
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-2"
          role="list"
          aria-label="Conversation list"
        >
          {listContent}
        </div>
      </div>

      {groupToManage && (
        <MemberManagementDialog
          open={!!groupToManage}
          onOpenChange={(open) => {
            if (!open) {
              setGroupToManageId(null)
            }
          }}
          group={groupToManage}
          room={null}
        />
      )}

      <ConfirmationDialog
        open={!!groupToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setGroupToDeleteId(null)
          }
        }}
        title="Delete group?"
        description={
          groupToDelete
            ? `This will permanently delete ${groupToDelete.group.name}, ${groupToDelete.channels.length} channel(s), and all related messages. This action cannot be undone.`
            : ''
        }
        confirmText="Delete group"
        variant="destructive"
        onConfirm={handleDeleteGroup}
        loading={deleteGroupMutation.isPending}
      />
    </>
  )
}
