import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withNonAnonymousAuth } from '@/lib/auth/middleware'
import { resolveRoomAccess } from '@/lib/services/domain'
import { getServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    groupId: string
    channelId: string
  }>
}

export const GET = withAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { groupId, channelId } = await params
      const access = await resolveRoomAccess(channelId, user)
      if (
        access.room.kind !== 'group' ||
        access.room.group_id !== groupId ||
        !access.canRead
      ) {
        return NextResponse.json(
          { error: 'Channel not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ room: access.room })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load channel'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
)

export const DELETE = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { groupId, channelId } = await params
      const access = await resolveRoomAccess(channelId, user)
      if (
        access.room.kind !== 'group' ||
        access.room.group_id !== groupId ||
        !access.canWrite
      ) {
        return NextResponse.json(
          { success: false, error: 'Channel not found or unauthorized' },
          { status: 404 }
        )
      }

      const canDelete =
        access.permissions?.can_admin ||
        access.permissions?.is_owner ||
        access.room.created_by === user.id
      if (!canDelete) {
        return NextResponse.json(
          {
            success: false,
            error: 'You do not have permission to delete this channel'
          },
          { status: 403 }
        )
      }

      const supabase = getServiceClient()
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', channelId)
      if (messagesError) {
        console.error('Error deleting channel messages:', messagesError)
        throw new Error('Failed to delete channel messages')
      }

      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', channelId)
      if (error) {
        console.error('Error deleting channel:', error)
        throw new Error('Failed to delete channel')
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete channel'
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      )
    }
  }
)
