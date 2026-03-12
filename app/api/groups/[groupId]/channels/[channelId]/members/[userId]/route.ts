import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { removeRoomMemberForViewer } from '@/lib/services/domain'

interface RouteParams {
  params: Promise<{
    groupId: string
    channelId: string
    userId: string
  }>
}

export const DELETE = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { channelId, userId } = await params
      return NextResponse.json(
        await removeRoomMemberForViewer(channelId, userId, user)
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to remove channel member'
      const status = message.includes('permission') ? 403 : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)
