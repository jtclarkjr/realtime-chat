import { NextResponse } from 'next/server'
import { withNonAnonymousAuth } from '@/lib/auth/middleware'
import { getAIUsageStatus } from '@/lib/services/ai/usage-service'

export const GET = withNonAnonymousAuth(async (_request, { user }) => {
  try {
    const usage = await getAIUsageStatus(user.id)
    return NextResponse.json(usage)
  } catch (error) {
    console.error('Error loading AI usage status:', error)
    return NextResponse.json(
      { error: 'Failed to load AI usage status' },
      { status: 500 }
    )
  }
})
