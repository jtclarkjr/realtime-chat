import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { memberUserIdsSchema, validateRequestBody } from '@/lib/validation'
import {
  addRoomMembersForViewer,
  listRoomMembersForViewer
} from '@/lib/services/domain'

interface RouteParams {
  params: Promise<{
    groupId: string
    channelId: string
  }>
}

export const GET = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { channelId } = await params
      return NextResponse.json(await listRoomMembersForViewer(channelId, user))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to load channel members'
      const status = message.includes('permission') ? 403 : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)

export const POST = withNonAnonymousAuth(
  async (request: NextRequest, { user }, { params }: RouteParams) => {
    const validation = await validateRequestBody(request, memberUserIdsSchema)
    if (!validation.success) {
      return validation.response
    }

    try {
      const { channelId } = await params
      return NextResponse.json(
        await addRoomMembersForViewer(channelId, user, validation.data.userIds)
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add channel members'
      const status = message.includes('permission') ? 403 : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)
