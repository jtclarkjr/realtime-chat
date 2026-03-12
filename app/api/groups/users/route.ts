import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { listUsersQuerySchema, validateData } from '@/lib/validation'
import { searchGroupUsersForViewer } from '@/lib/services/domain'

export const GET = withNonAnonymousAuth(
  async (request: NextRequest, { user }) => {
    const { searchParams } = new URL(request.url)
    const validation = validateData(
      {
        q: searchParams.get('q') || undefined,
        limit: searchParams.get('limit') || undefined
      },
      listUsersQuerySchema
    )

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    try {
      const response = await searchGroupUsersForViewer(
        user,
        validation.data.q,
        validation.data.limit
      )
      return NextResponse.json(response)
    } catch (error) {
      console.error('Error searching group users:', error)
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      )
    }
  }
)
