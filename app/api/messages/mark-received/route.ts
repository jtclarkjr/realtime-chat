import { NextRequest, NextResponse } from 'next/server'
import { markAsReceived } from '@/lib/services/chat'
import { withAuth, validateUserAccess } from '@/lib/auth/middleware'
import { markReceivedSchema, validateRequestBody } from '@/lib/validation'
import type { MarkReceivedRequest } from '@/lib/types/database'
import { resolveRoomAccess } from '@/lib/services/domain'

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Validate request body with Zod schema
    const validation = await validateRequestBody(request, markReceivedSchema)
    if (!validation.success) {
      return validation.response
    }

    const body = validation.data as MarkReceivedRequest

    // Validate that the user is marking messages for themselves
    if (!validateUserAccess(user.id, body.userId)) {
      return NextResponse.json(
        { error: 'You can only mark messages as received for yourself' },
        { status: 403 }
      )
    }

    const access = await resolveRoomAccess(body.roomId, user)
    if (!access.canRead) {
      return NextResponse.json(
        { error: 'Channel not found or unauthorized' },
        { status: 404 }
      )
    }

    await markAsReceived(body.userId, body.roomId, body.messageId)

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error marking message as received:', error)
    return NextResponse.json(
      { error: 'Failed to mark message as received' },
      { status: 500 }
    )
  }
})
