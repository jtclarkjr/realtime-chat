import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { resolveRoomAccess } from '@/lib/services/domain'
import { errorResponse } from '@/lib/errors'

interface RouteParams {
  params: Promise<{
    roomId: string
  }>
}

export const GET = withAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { roomId } = await params

      if (!roomId) {
        return errorResponse('MISSING_ROOM_ID')
      }

      const access = await resolveRoomAccess(roomId, user)
      if (!access.canRead) {
        return NextResponse.json(
          { error: 'Channel not found or unauthorized' },
          { status: 404 }
        )
      }

      return NextResponse.json({ room: access.room })
    } catch (error) {
      console.error('Unexpected error fetching room by id:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)
