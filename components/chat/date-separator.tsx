'use client'

interface DateSeparatorProps {
  date: string
}

const formatDate = (dateString: string): string => {
  const messageDate = new Date(dateString)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  // Reset time components for proper date comparison
  const messageDateOnly = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  )
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const yesterdayOnly = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  )

  if (messageDateOnly.getTime() === todayOnly.getTime()) {
    return 'Today'
  } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday'
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
}

export const DateSeparator = ({ date }: DateSeparatorProps) => {
  return (
    <div className="relative flex justify-center my-3">
      <div className="px-2.5 py-1 bg-background/70 backdrop-blur-sm text-muted-foreground text-xs font-medium rounded-full border border-border/40 shadow-sm">
        {formatDate(date)}
      </div>
    </div>
  )
}
