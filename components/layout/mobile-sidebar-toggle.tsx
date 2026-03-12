'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/lib/stores/ui-store'

export function MobileSidebarToggle() {
  const setMobileDrawerOpen = useUIStore((state) => state.setMobileDrawerOpen)

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed left-4 top-4 z-30 h-10 w-10 rounded-full border-border bg-background/95 shadow-md backdrop-blur md:hidden"
      onClick={() => setMobileDrawerOpen(true)}
      title="Open menu"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  )
}
