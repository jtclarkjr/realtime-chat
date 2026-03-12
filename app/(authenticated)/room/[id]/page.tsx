import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/server-user'
import { resolveRoomAccess } from '@/lib/services/domain'
import { getRoomHref } from '@/lib/utils/chat-routes'

interface RoomPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { id } = await params
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  try {
    const access = await resolveRoomAccess(id, {
      id: user.id,
      is_anonymous: user.is_anonymous
    })

    if (!access.canRead) {
      notFound()
    }

    redirect(getRoomHref(access.room))
  } catch {
    notFound()
  }
}
