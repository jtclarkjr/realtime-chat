import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withNonAnonymousAuth } from '@/lib/auth/middleware'
import { getGroupForViewer } from '@/lib/services/domain'
import { getServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    groupId: string
  }>
}

export const GET = withAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { groupId } = await params
      const group = await getGroupForViewer(groupId, user)
      return NextResponse.json({ group })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load group'
      const status =
        message.includes('not found') || message.includes('unauthorized')
          ? 404
          : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)

export const DELETE = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { groupId } = await params
      const groupView = await getGroupForViewer(groupId, user)
      if (!groupView.permissions.is_owner) {
        return NextResponse.json(
          {
            success: false,
            error: 'Only the group owner can delete the group'
          },
          { status: 403 }
        )
      }

      const supabase = getServiceClient()
      const { error: roomMessagesError } = await supabase
        .from('messages')
        .delete()
        .in(
          'room_id',
          (
            (await supabase.from('rooms').select('id').eq('group_id', groupId))
              .data || []
          ).map((room) => room.id)
        )

      if (roomMessagesError) {
        console.error('Error deleting group messages:', roomMessagesError)
        throw new Error('Failed to delete group messages')
      }

      const { error } = await supabase.from('groups').delete().eq('id', groupId)
      if (error) {
        console.error('Error deleting group:', error)
        throw new Error('Failed to delete group')
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete group'
      const status = message.includes('owner') ? 403 : 500
      return NextResponse.json({ success: false, error: message }, { status })
    }
  }
)
