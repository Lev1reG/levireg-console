import { LayoutDashboard, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  title: string
  to: string
  icon: LucideIcon
  superadminOnly?: true
}
export type NavGroup = { label: string; items: NavItem[] }

// Add a menu = add an entry here.
export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ title: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
      { title: 'Users', to: '/users', icon: Users, superadminOnly: true },
    ],
  },
]
