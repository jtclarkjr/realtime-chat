import { RoomClient } from '@/app/(authenticated)/room/[id]/room-client'

interface GroupChannelPageProps {
  params: Promise<{
    groupId: string
    channelId: string
  }>
}

export default async function GroupChannelPage({
  params
}: GroupChannelPageProps) {
  const { channelId } = await params
  return <RoomClient roomId={channelId} />
}
