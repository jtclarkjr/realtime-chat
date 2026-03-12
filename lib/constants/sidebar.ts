import { User, Users } from 'lucide-react'
import type { PillSwitcherOption, SidebarSection } from '@/lib/types/ui'

export const SIDEBAR_SECTION_OPTIONS: PillSwitcherOption<SidebarSection>[] = [
  { value: 'groups', label: 'Groups', icon: Users },
  { value: 'personal', label: 'Personal', icon: User }
]

export const ANONYMOUS_SIDEBAR_SECTION_OPTIONS = SIDEBAR_SECTION_OPTIONS.filter(
  (option) => option.value === 'groups'
)
