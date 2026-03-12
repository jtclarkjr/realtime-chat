import { getInitialNavigationData } from '@/lib/actions/navigation-actions'
import { createClient } from '@/lib/supabase/server'
import { toPublicUser } from '@/lib/auth/public-user'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthenticatedLayoutClient } from '@/components/layout/authenticated-layout-client'

// Use ISR for better performance while keeping data fresh
export const revalidate = 30 // Revalidate every 30 seconds

export default async function AuthenticatedLayout({
  children
}: {
  children: React.ReactNode
}) {
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

  // Extract only the data we need for the client
  const userData = toPublicUser(user)

  // Fetch initial room data server-side
  const { groups, groupChannels, personalChats, defaultRoomId } =
    await getInitialNavigationData()

  return (
    <AuthenticatedLayoutClient
      user={userData}
      initialGroups={groups}
      initialGroupChannels={groupChannels}
      initialPersonalChats={personalChats}
      initialDefaultRoomId={defaultRoomId}
    >
      {children}
    </AuthenticatedLayoutClient>
  )
}
