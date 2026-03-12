import { NextRequest, NextResponse } from 'next/server'
import { sendMessage } from '@/lib/services/chat'
import { userService } from '@/lib/services/user/user-service'
import { withNonAnonymousAuth, validateUserAccess } from '@/lib/auth/middleware'
import { sendMessageSchema, validateRequestBody } from '@/lib/validation'
import type { SendMessageRequest } from '@/lib/types/api'
import { errorResponse } from '@/lib/errors'

export const POST = withNonAnonymousAuth(
  async (request: NextRequest, { user, supabase }) => {
    try {
      // Validate request body with Zod schema
      const validation = await validateRequestBody(request, sendMessageSchema)
      if (!validation.success) {
        return validation.response
      }

      const body = validation.data as SendMessageRequest

      // Validate that the user is sending messages as themselves
      if (!validateUserAccess(user.id, body.userId)) {
        return errorResponse('SEND_AS_SELF_ONLY')
      }

      const message = await sendMessage(
        {
          roomId: body.roomId,
          userId: body.userId,
          username: body.username,
          content: body.content,
          isPrivate: body.isPrivate
        },
        user
      )

      // Only broadcast non-private messages via Supabase Realtime
      if (!message.isPrivate) {
        // Get sender's avatar for the broadcast
        const senderProfile = await userService.getUserProfile(body.userId)

        const broadcastMessage = {
          ...message,
          user: {
            ...message.user,
            avatar_url: senderProfile?.avatar_url || undefined
          },
          // Echo back the client-generated ID for deterministic deduplication
          clientMsgId: body.optimisticId
        }

        await supabase
          .channel(body.roomId)
          .httpSend('message', broadcastMessage)
      }

      return NextResponse.json({
        success: true,
        message
      })
    } catch (error) {
      console.error('Error sending message:', error)
      if (error instanceof Error && error.message.includes('permission')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return errorResponse('MESSAGE_SEND_FAILED')
    }
  }
)
