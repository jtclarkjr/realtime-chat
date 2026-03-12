import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { createChannelSchema, validateRequestBody } from '@/lib/validation'
import { createChannelForViewer } from '@/lib/services/domain'

interface RouteParams {
  params: Promise<{
    groupId: string
  }>
}

export const POST = withNonAnonymousAuth(
  async (request: NextRequest, { user }, { params }: RouteParams) => {
    const validation = await validateRequestBody(request, createChannelSchema)
    if (!validation.success) {
      return validation.response
    }

    try {
      const { groupId } = await params
      const room = await createChannelForViewer(groupId, user, {
        groupId,
        ...validation.data,
        description: validation.data.description || undefined
      })
      return NextResponse.json({ success: true, room })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create channel'
      let status = 500
      if (
        message.includes('permission') ||
        message.includes('Private channels')
      ) {
        status = 403
      } else if (message.includes('already exists')) {
        status = 409
      }
      return NextResponse.json({ success: false, error: message }, { status })
    }
  }
)
