import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { errorResponse } from '@/lib/errors'
import { resolveRoomAccess } from '@/lib/services/domain'
import {
  FileContextServiceError,
  processUploadedFilesForRoom
} from '@/lib/services/ai/file-context-service'

const channelIdSchema = z.uuid('channelId must be a valid UUID')

export const POST = withNonAnonymousAuth(
  async (request: NextRequest, { user }) => {
    try {
      const formData = await request.formData()
      const rawChannelId = formData.get('channelId')
      const parsedChannelId = channelIdSchema.safeParse(rawChannelId)

      if (!parsedChannelId.success) {
        return errorResponse('VALIDATION_ERROR', {
          field: 'channelId',
          message: parsedChannelId.error.issues[0]?.message
        })
      }

      const roomAccess = await resolveRoomAccess(parsedChannelId.data, user)
      if (!roomAccess.canWrite) {
        return NextResponse.json(
          {
            error: 'You do not have permission to upload files in this room'
          },
          {
            status: 403
          }
        )
      }

      if (roomAccess.room.kind !== 'personal') {
        return errorResponse('ATTACHMENTS_PERSONAL_ONLY')
      }

      const fileEntries = formData
        .getAll('files')
        .filter((entry): entry is File => entry instanceof File)

      const files = await Promise.all(
        fileEntries.map(async (file) => ({
          fileName: file.name,
          contentType: file.type || null,
          bytes: Buffer.from(await file.arrayBuffer())
        }))
      )

      const response = await processUploadedFilesForRoom({
        roomId: roomAccess.room.id,
        userId: user.id,
        files
      })

      return NextResponse.json(response)
    } catch (error) {
      if (error instanceof FileContextServiceError) {
        return errorResponse(error.errorCode, error.details)
      }

      console.error('Error processing AI files:', error)
      return errorResponse('FILE_PROCESSING_FAILED')
    }
  }
)
