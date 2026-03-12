import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PresenceState } from '@/lib/types/presence'
import type { SidebarSection } from '@/lib/types/ui'

interface UIState {
  // Hydration state for persisted store
  hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void

  // Sidebar state
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  sidebarSection: SidebarSection
  setSidebarSection: (section: SidebarSection) => void
  expandedGroupId: string | null
  openExpandedGroup: (groupId: string) => void
  toggleExpandedGroup: (groupId: string) => void
  clearExpandedGroup: () => void

  // Navigation dialogs (not persisted)
  createGroupDialogOpen: boolean
  setCreateGroupDialogOpen: (open: boolean) => void
  createChannelDialogOpen: boolean
  selectedGroupIdForChannel: string
  selectedGroupVisibilityForChannel: 'public' | 'private'
  openCreateChannelDialog: (
    groupId: string,
    visibility: 'public' | 'private'
  ) => void
  closeCreateChannelDialog: () => void

  // Unread counts per room
  unreadCounts: Record<string, number>
  incrementUnread: (roomId: string) => void
  decrementUnread: (roomId: string) => void
  clearUnread: (roomId: string) => void
  markAsRead: (roomId: string) => void
  dismissNotification: (roomId: string) => void
  setUnreadCount: (roomId: string, count: number) => void

  // Recent rooms for dashboard
  recentRooms: string[]
  addRecentRoom: (roomId: string) => void

  // Recently read rooms for notifications
  readRooms: string[]
  addReadRoom: (roomId: string) => void

  // Mobile drawer state (not persisted)
  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void

  // Presence cache per room (not persisted)
  roomPresence: Record<string, number> // roomId -> online count
  setRoomPresence: (roomId: string, count: number) => void

  // Full presence state per room (not persisted)
  roomPresenceUsers: Record<string, PresenceState> // roomId -> presence users
  setRoomPresenceUsers: (roomId: string, users: PresenceState) => void

  // Pending first-response AI bootstrap for freshly created personal chats
  pendingPersonalAI: Record<
    string,
    {
      content: string
      triggerMessageId?: string
      fileContextId?: string
      requiresFileContext?: boolean
    }
  >
  setPendingPersonalAI: (
    roomId: string,
    payload: {
      content: string
      triggerMessageId?: string
      fileContextId?: string
      requiresFileContext?: boolean
    }
  ) => void
  clearPendingPersonalAI: (roomId: string) => void
  consumePendingPersonalAI: (roomId: string) => {
    content: string
    triggerMessageId?: string
    fileContextId?: string
    requiresFileContext?: boolean
  } | null
}

type PersistedState = Pick<
  UIState,
  | 'sidebarCollapsed'
  | 'sidebarSection'
  | 'expandedGroupId'
  | 'unreadCounts'
  | 'recentRooms'
  | 'readRooms'
>

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Hydration state
      hasHydrated: false,
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),

      // Sidebar state
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      sidebarSection: 'groups',
      setSidebarSection: (sidebarSection) => set({ sidebarSection }),
      expandedGroupId: null,
      openExpandedGroup: (expandedGroupId) => set({ expandedGroupId }),
      toggleExpandedGroup: (groupId) =>
        set((state) => ({
          expandedGroupId: state.expandedGroupId === groupId ? null : groupId
        })),
      clearExpandedGroup: () => set({ expandedGroupId: null }),

      // Navigation dialogs (not persisted)
      createGroupDialogOpen: false,
      setCreateGroupDialogOpen: (createGroupDialogOpen) =>
        set({ createGroupDialogOpen }),
      createChannelDialogOpen: false,
      selectedGroupIdForChannel: '',
      selectedGroupVisibilityForChannel: 'public',
      openCreateChannelDialog: (
        selectedGroupIdForChannel,
        selectedGroupVisibilityForChannel
      ) =>
        set({
          createChannelDialogOpen: true,
          selectedGroupIdForChannel,
          selectedGroupVisibilityForChannel
        }),
      closeCreateChannelDialog: () =>
        set({
          createChannelDialogOpen: false,
          selectedGroupIdForChannel: '',
          selectedGroupVisibilityForChannel: 'public'
        }),

      // Unread counts
      unreadCounts: {},
      incrementUnread: (roomId) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [roomId]: (state.unreadCounts[roomId] || 0) + 1
          },
          readRooms: state.readRooms.filter((id) => id !== roomId)
        })),
      decrementUnread: (roomId) =>
        set((state) => {
          const current = state.unreadCounts[roomId] || 0
          if (current <= 1) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [roomId]: _, ...rest } = state.unreadCounts
            return { unreadCounts: rest }
          }

          return {
            unreadCounts: {
              ...state.unreadCounts,
              [roomId]: current - 1
            }
          }
        }),
      clearUnread: (roomId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [roomId]: _, ...rest } = state.unreadCounts
          return { unreadCounts: rest }
        }),
      markAsRead: (roomId) =>
        set((state) => {
          const hadUnread = (state.unreadCounts[roomId] || 0) > 0
          if (!hadUnread) {
            return state
          }

          return {
            unreadCounts: {
              ...state.unreadCounts,
              [roomId]: 0
            },
            readRooms: [
              roomId,
              ...state.readRooms.filter((id) => id !== roomId)
            ].slice(0, 20)
          }
        }),
      dismissNotification: (roomId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [roomId]: _, ...rest } = state.unreadCounts
          return {
            unreadCounts: rest,
            readRooms: state.readRooms.filter((id) => id !== roomId)
          }
        }),
      setUnreadCount: (roomId, count) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [roomId]: count
          }
        })),

      // Recent rooms
      recentRooms: [],
      addRecentRoom: (roomId) =>
        set((state) => {
          const filtered = state.recentRooms.filter((id) => id !== roomId)
          return {
            recentRooms: [roomId, ...filtered].slice(0, 10) // Keep last 10
          }
        }),

      // Recently read rooms (persisted)
      readRooms: [],
      addReadRoom: (roomId) =>
        set((state) => ({
          readRooms: [
            roomId,
            ...state.readRooms.filter((id) => id !== roomId)
          ].slice(0, 20)
        })),

      // Mobile drawer (not persisted)
      mobileDrawerOpen: false,
      setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),

      // Presence cache (not persisted)
      roomPresence: {},
      setRoomPresence: (roomId, count) =>
        set((state) => ({
          roomPresence: {
            ...state.roomPresence,
            [roomId]: count
          }
        })),

      // Full presence state (not persisted)
      roomPresenceUsers: {},
      setRoomPresenceUsers: (roomId, users) =>
        set((state) => ({
          roomPresenceUsers: {
            ...state.roomPresenceUsers,
            [roomId]: users
          }
        })),

      pendingPersonalAI: {},
      setPendingPersonalAI: (roomId, payload) =>
        set((state) => ({
          pendingPersonalAI: {
            ...state.pendingPersonalAI,
            [roomId]: payload
          }
        })),
      clearPendingPersonalAI: (roomId) =>
        set((state) => {
          const { [roomId]: _pendingPayload, ...rest } = state.pendingPersonalAI
          return {
            pendingPersonalAI: rest
          }
        }),
      consumePendingPersonalAI: (roomId) => {
        const payload = get().pendingPersonalAI[roomId] || null
        set((state) => {
          const { [roomId]: _pendingPayload, ...rest } = state.pendingPersonalAI
          return {
            pendingPersonalAI: rest
          }
        })
        return payload
      }
    }),
    {
      name: 'ui-storage',
      skipHydration: true,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        ({
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarSection: state.sidebarSection,
          expandedGroupId: state.expandedGroupId,
          unreadCounts: state.unreadCounts,
          recentRooms: state.recentRooms,
          readRooms: state.readRooms
        }) as PersistedState,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
