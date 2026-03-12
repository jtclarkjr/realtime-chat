import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth, validateUserAccess } from '@/lib/auth/middleware'
import { startPersonalChatSchema, validateRequestBody } from '@/lib/validation'
import { startPersonalChatForViewer } from '@/lib/services/domain'

export const POST = withNonAnonymousAuth(
  async (request: NextRequest, { user }) => {
    const validation = await validateRequestBody(
      request,
      startPersonalChatSchema
    )
    if (!validation.success) {
      return validation.response
    }

    if (!validateUserAccess(user.id, validation.data.userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only start personal chats for yourself'
        },
        { status: 403 }
      )
    }

    try {
      return NextResponse.json(
        await startPersonalChatForViewer(user, validation.data)
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to start personal chat'
      return NextResponse.json(
        { success: false, error: message },
        { status: 500 }
      )
    }
  }
)
