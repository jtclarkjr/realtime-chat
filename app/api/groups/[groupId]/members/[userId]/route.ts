import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { updateGroupMemberSchema, validateRequestBody } from '@/lib/validation'
import {
  removeGroupMemberForViewer,
  updateGroupMemberForViewer
} from '@/lib/services/domain'

interface RouteParams {
  params: Promise<{
    groupId: string
    userId: string
  }>
}

export const PATCH = withNonAnonymousAuth(
  async (request: NextRequest, { user }, { params }: RouteParams) => {
    const validation = await validateRequestBody(
      request,
      updateGroupMemberSchema
    )
    if (!validation.success) {
      return validation.response
    }

    try {
      const { groupId, userId } = await params
      return NextResponse.json(
        await updateGroupMemberForViewer(groupId, userId, user, validation.data)
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update member'
      const status =
        message.includes('permission') || message.includes('Owner') ? 403 : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)

export const DELETE = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { groupId, userId } = await params
      return NextResponse.json(
        await removeGroupMemberForViewer(groupId, userId, user)
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove member'
      const status =
        message.includes('permission') || message.includes('Owner') ? 403 : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)
