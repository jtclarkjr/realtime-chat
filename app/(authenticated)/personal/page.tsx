import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/lib/auth/server-user'
import { PersonalStartComposer } from '@/components/personal/personal-start-composer'

export const revalidate = 30

export default async function PersonalChatsPage() {
  const user = await getAuthenticatedUser()
  if (!user || user.is_anonymous) {
    redirect('/')
  }

  return <PersonalStartComposer />
}
