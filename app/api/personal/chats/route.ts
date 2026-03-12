import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { personalChatsQuerySchema, validateData } from '@/lib/validation'
import { listPersonalChatsForViewer } from '@/lib/services/domain'

export const GET = withNonAnonymousAuth(
  async (request: NextRequest, { user }) => {
    const { searchParams } = new URL(request.url)
    const validation = validateData(
      {
        q: searchParams.get('q') || undefined,
        limit: searchParams.get('limit') || undefined,
        offset: searchParams.get('offset') || undefined
      },
      personalChatsQuerySchema
    )

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      )
    }

    try {
      return NextResponse.json(
        await listPersonalChatsForViewer(user, {
          query: validation.data.q,
          limit: validation.data.limit,
          offset: validation.data.offset
        })
      )
    } catch (error) {
      console.error('Error listing personal chats:', error)
      return NextResponse.json(
        { error: 'Failed to load personal chats' },
        { status: 500 }
      )
    }
  }
)
