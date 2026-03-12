import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { updatePersonalChatSchema, validateRequestBody } from '@/lib/validation'
import {
  deletePersonalChatForViewer,
  getPersonalChatForViewer,
  updatePersonalChatForViewer
} from '@/lib/services/domain'

interface RouteParams {
  params: Promise<{
    chatId: string
  }>
}

export const GET = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { chatId } = await params
      return NextResponse.json(await getPersonalChatForViewer(chatId, user))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load personal chat'
      const status = message.includes('unauthorized') ? 403 : 404
      return NextResponse.json({ error: message }, { status })
    }
  }
)

export const PATCH = withNonAnonymousAuth(
  async (request: NextRequest, { user }, { params }: RouteParams) => {
    const validation = await validateRequestBody(
      request,
      updatePersonalChatSchema
    )
    if (!validation.success) {
      return validation.response
    }

    try {
      const { chatId } = await params
      return NextResponse.json(
        await updatePersonalChatForViewer(chatId, user, validation.data)
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update personal chat'
      const status = message.includes('unauthorized') ? 403 : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)

export const DELETE = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { chatId } = await params
      return NextResponse.json(await deletePersonalChatForViewer(chatId, user))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete personal chat'
      const status = message.includes('unauthorized') ? 403 : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)
