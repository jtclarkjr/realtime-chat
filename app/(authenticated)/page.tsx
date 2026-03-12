import {
  getConversationsWithLastMessage,
  getInitialNavigationData
} from '@/lib/actions/navigation-actions'
import { createClient } from '@/lib/supabase/server'
import { toPublicUser } from '@/lib/auth/public-user'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { RecentRooms } from '@/components/dashboard/recent-rooms'
import { ChannelSearchCard } from '@/components/dashboard/channel-search-card'
import { WelcomeCard } from '@/components/dashboard/welcome-card'

// Use ISR for better performance
export const revalidate = 30

export default async function DashboardPage() {
  // Check authentication server-side
  const headersList = await headers()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const request = new Request(baseUrl, {
    headers: Object.fromEntries(headersList.entries())
  })
  const { supabase } = createClient(request)
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const userData = toPublicUser(user)
  const [roomsWithLastMessage, navigationData] = await Promise.all([
    getConversationsWithLastMessage(),
    getInitialNavigationData()
  ])

  return (
    <div className="h-full overflow-auto">
      <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
        <WelcomeCard user={userData} />
        <ChannelSearchCard
          initialGroups={navigationData.groups}
          initialPersonalChats={navigationData.personalChats}
          canCreateChannel={!userData.isAnonymous}
        />
        <RecentRooms initialRooms={roomsWithLastMessage} />
      </div>
    </div>
  )
}
