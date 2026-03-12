'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ScrollDateIndicatorProps {
  date: string | null
  isVisible: boolean
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

export const ScrollDateIndicator = ({
  date,
  isVisible
}: ScrollDateIndicatorProps) => {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {isVisible && date && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{
              duration: 0.15,
              ease: 'easeOut'
            }}
            className="px-3 py-1.5 bg-background/85 backdrop-blur-md text-foreground text-sm font-medium rounded-full border border-border/50 shadow-lg"
          >
            {formatDate(date)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
