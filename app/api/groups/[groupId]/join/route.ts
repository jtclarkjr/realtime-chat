import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { joinPublicGroupForViewer } from '@/lib/services/domain'

interface RouteParams {
  params: Promise<{
    groupId: string
  }>
}

export const POST = withNonAnonymousAuth(
  async (_request: NextRequest, { user }, { params }: RouteParams) => {
    try {
      const { groupId } = await params
      const membership = await joinPublicGroupForViewer(groupId, user)
      return NextResponse.json({ success: true, membership })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to join group'
      const status = message.includes('public') ? 403 : 500
      return NextResponse.json({ success: false, error: message }, { status })
    }
  }
)
