import { Card, CardContent } from '#/components/ui/card'
import { Skeleton } from '#/components/ui/skeleton'
import type { components } from '#/lib/api.gen'
import { formatDate } from './format'
import { RoleBadge, StatusBadge } from './user-badges'

type User = components['schemas']['User']

export function UsersCards({ users }: { users: User[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {users.map((u) => (
        <li key={u.username}>
          <Card size="sm">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">
                    @{u.username}
                  </div>
                </div>
                <StatusBadge user={u} />
              </div>
              <div className="truncate text-sm">{u.email}</div>
              <div className="flex items-center gap-2">
                <RoleBadge role={u.role} />
              </div>
              <div className="text-xs text-muted-foreground">
                Registered {formatDate(u.created_at)}
              </div>
              {u.approved_at && (
                <div className="text-xs text-muted-foreground">
                  Approved {formatDate(u.approved_at)}
                </div>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}

export function UsersCardsSkeleton() {
  return (
    <ul className="flex flex-col gap-3">
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i}>
          <Card size="sm">
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
