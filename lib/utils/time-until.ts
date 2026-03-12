export function formatTimeUntil(resetAt: string): string {
  const target = new Date(resetAt).getTime()
  if (Number.isNaN(target)) return 'Unknown'

  const diffMs = Math.max(target - Date.now(), 0)
  const totalMinutes = Math.floor(diffMs / (60 * 1000))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`

  return `${minutes}m`
}
