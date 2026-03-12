import { NextRequest, NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import {
  validateRequestBody,
  updateAIPersonalizationSchema
} from '@/lib/validation'
import {
  getAIPersonalization,
  updateAIPersonalization
} from '@/lib/services/ai/personalization-service'

export const GET = withNonAnonymousAuth(async (_request, { user }) => {
  try {
    const personalization = await getAIPersonalization(user.id)
    return NextResponse.json(personalization)
  } catch (error) {
    console.error('Error loading AI personalization:', error)
    return NextResponse.json(
      { error: 'Failed to load personalization settings' },
      { status: 500 }
    )
  }
})

export const PUT = withNonAnonymousAuth(
  async (request: NextRequest, { user }) => {
    const validation = await validateRequestBody(
      request,
      updateAIPersonalizationSchema
    )
    if (!validation.success) {
      return validation.response
    }

    try {
      const personalization = await updateAIPersonalization(
        user.id,
        validation.data
      )
      return NextResponse.json(personalization)
    } catch (error) {
      console.error('Error saving AI personalization:', error)
      return NextResponse.json(
        { error: 'Failed to save personalization settings' },
        { status: 500 }
      )
    }
  }
)
