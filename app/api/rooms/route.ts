import { NextRequest, NextResponse } from 'next/server'
import { listFlattenedReadableGroupRooms } from '@/lib/services/domain'
import { withAuth, withNonAnonymousAuth } from '@/lib/auth/middleware'
import { deleteRoomQuerySchema, validateQueryParams } from '@/lib/validation'
import { errorResponse } from '@/lib/errors'

export const GET = withAuth(async (_request, { user }) => {
  try {
    const rooms = await listFlattenedReadableGroupRooms(user)

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error('Unexpected error fetching rooms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

export const POST = withNonAnonymousAuth(async (request: NextRequest, auth) => {
  void request
  void auth
  return errorResponse('VALIDATION_ERROR', [
    {
      field: 'root',
      message:
        'Legacy room creation is deprecated. Create groups or personal chats instead.'
    }
  ])
})

export const DELETE = withNonAnonymousAuth(
  async (request: NextRequest, _auth) => {
    const validation = validateQueryParams(request, deleteRoomQuerySchema)
    if (!validation.success) {
      return validation.response
    }

    return errorResponse('VALIDATION_ERROR', [
      {
        field: 'id',
        message:
          'Legacy room deletion is deprecated. Delete a group channel or personal chat instead.'
      }
    ])
  }
)
