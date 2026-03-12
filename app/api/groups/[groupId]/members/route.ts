import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { memberUserIdsSchema, validateRequestBody } from '@/lib/validation'
import {
  addGroupMembersForViewer,
  listGroupMembersForViewer
} from '@/lib/services/domain'

interface RouteParams {
  params: Promise<{
    groupId: string
  }>
}

export const GET = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { groupId } = await params
      return NextResponse.json(await listGroupMembersForViewer(groupId, user))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load members'
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
      const { groupId } = await params
      return NextResponse.json(
        await addGroupMembersForViewer(groupId, user, validation.data.userIds)
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add members'
      const status = message.includes('permission') ? 403 : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
)
