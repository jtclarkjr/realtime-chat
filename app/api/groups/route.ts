import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withNonAnonymousAuth } from '@/lib/auth/middleware'
import { createGroupSchema, validateRequestBody } from '@/lib/validation'
import {
  createGroupForViewer,
  listGroupsForViewer
} from '@/lib/services/domain'

export const GET = withAuth(async (_request, { user }) => {
  try {
    const groups = await listGroupsForViewer(user)
    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Error listing groups:', error)
    return NextResponse.json(
      { error: 'Failed to load groups' },
      { status: 500 }
    )
  }
})

export const POST = withNonAnonymousAuth(
  async (request: NextRequest, { user }) => {
    const validation = await validateRequestBody(request, createGroupSchema)
    if (!validation.success) {
      return validation.response
    }

    try {
      const group = await createGroupForViewer(user, {
        ...validation.data,
        description: validation.data.description || undefined
      })
      return NextResponse.json({ success: true, group })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create group'
      const status = message.includes('already exists') ? 409 : 500
      return NextResponse.json({ success: false, error: message }, { status })
    }
  }
)
