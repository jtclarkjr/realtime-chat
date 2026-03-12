import { RoomClient } from '@/app/(authenticated)/room/[id]/room-client'

interface PersonalChatPageProps {
  params: Promise<{
    chatId: string
  }>
}

export default async function PersonalChatPage({
  params
}: PersonalChatPageProps) {
  const { chatId } = await params
  return <RoomClient roomId={chatId} />
}
