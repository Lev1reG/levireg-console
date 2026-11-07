import { Badge } from '#/components/ui/badge'
import type { components } from '#/lib/api.gen'

type User = components['schemas']['User']

export function StatusBadge({ user }: { user: User }) {
  return user.approved_at ? (
    <Badge>Approved</Badge>
  ) : (
    <Badge variant="secondary">Pending</Badge>
  )
}

export function RoleBadge({ role }: { role: User['role'] }) {
  return (
    <Badge variant="outline" className="capitalize">
      {role}
    </Badge>
  )
}
