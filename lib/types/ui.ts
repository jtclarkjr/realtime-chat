import type { LucideIcon } from 'lucide-react'

export type SidebarSection = 'groups' | 'personal'

export type PillSwitcherOption<T extends string> = {
  value: T
  label: string
  icon?: LucideIcon
}
