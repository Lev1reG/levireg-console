import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Skeleton } from '#/components/ui/skeleton'
import type { components } from '#/lib/api.gen'
import { formatDate } from './format'
import { RoleBadge, StatusBadge } from './user-badges'

type User = components['schemas']['User']

const heads = ['User', 'Email', 'Role', 'Status', 'Registered', 'Approved']

export function UsersTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {heads.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u.username}>
            <TableCell>
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-muted-foreground">@{u.username}</div>
            </TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell>
              <RoleBadge role={u.role} />
            </TableCell>
            <TableCell>
              <StatusBadge user={u} />
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(u.created_at)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {u.approved_at ? formatDate(u.approved_at) : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function UsersTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {heads.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }, (_, i) => (
          <TableRow key={i}>
            {heads.map((h) => (
              <TableCell key={h}>
                <Skeleton className="h-5 w-full max-w-32" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
