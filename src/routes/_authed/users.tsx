import { useEffect, useState } from 'react'
import {
  createFileRoute,
  redirect,
  stripSearchParams,
  useNavigate,
} from '@tanstack/react-router'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { ModerationDialog } from '#/components/users/moderation-dialog'
import type { Target } from '#/components/users/moderation-dialog'
import { useModeration } from '#/components/users/use-moderation'
import { UsersCards, UsersCardsSkeleton } from '#/components/users/users-cards'
import { UsersFooter } from '#/components/users/users-footer'
import { UsersTable, UsersTableSkeleton } from '#/components/users/users-table'
import { ForbiddenError } from '#/lib/api'
import { meQuery } from '#/lib/auth'
import {
  DEFAULT_SEARCH,
  pastEndPage,
  usersCountQuery,
  usersListQuery,
  usersSearchSchema,
} from '#/lib/users'
import type { Status } from '#/lib/users'

const REFRESH_TOAST_ID = 'users-refresh'

export const Route = createFileRoute('/_authed/users')({
  staticData: { crumb: 'Users' },
  validateSearch: usersSearchSchema,
  search: { middlewares: [stripSearchParams(DEFAULT_SEARCH)] },
  loaderDeps: ({ search }) => search,
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.query({
      ...meQuery,
      staleTime: 'static',
    })
    if (me.role !== 'superadmin') throw new ForbiddenError()
  },
  loader: async ({ context, deps }) => {
    const { queryClient } = context
    void queryClient.prefetchQuery(usersCountQuery('pending'))
    void queryClient.prefetchQuery(usersCountQuery('approved'))
    const { data, meta } = await queryClient.query({
      ...usersListQuery(deps),
      staleTime: 'static',
    })
    const last = pastEndPage(data.length, meta)
    if (last) {
      throw redirect({
        to: '/users',
        search: { ...deps, page: last },
        replace: true,
      })
    }
  },
  pendingMs: 150,
  pendingComponent: UsersSkeleton,
  component: Users,
})

function Header() {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <CreateButton className="hidden md:inline-flex" />
    </div>
  )
}

// Wired to the Create User dialog in its own ticket.
function CreateButton({ className }: { className?: string }) {
  return (
    <Button className={className}>
      <Plus data-icon="inline-start" />
      Create User
    </Button>
  )
}

function UsersSkeleton() {
  return (
    <main className="flex max-w-6xl flex-col gap-4 p-4 md:p-8">
      <Header />
      <CreateButton className="h-11 w-full md:hidden" />
      <Skeleton className="h-8 w-full md:w-72" />
      <div className="hidden md:block">
        <UsersTableSkeleton />
      </div>
      <div className="md:hidden">
        <UsersCardsSkeleton />
      </div>
    </main>
  )
}

function CountBadge({ n }: { n: number | undefined }) {
  return n === undefined ? null : (
    <span className="text-xs tabular-nums text-muted-foreground">{n}</span>
  )
}

function Users() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/users' })
  const list = useSuspenseQuery(usersListQuery(search))
  const { data: pending } = useQuery(usersCountQuery('pending'))
  const { data: approved } = useQuery(usersCountQuery('approved'))
  const { data: users, meta } = list.data
  const all =
    pending === undefined || approved === undefined
      ? undefined
      : pending + approved

  const { busy, run } = useModeration()
  const [target, setTarget] = useState<Target | null>(null)
  const onAction = (action: Target['action'], user: Target['user']) =>
    setTarget({ action, user })

  // After an approve/reject refetch empties the last page, step back.
  const last = pastEndPage(users.length, meta)
  useEffect(() => {
    if (last)
      void navigate({ search: { ...search, page: last }, replace: true })
  }, [last, navigate, search])

  const refreshFailed = list.isRefetchError
  const { refetch } = list
  useEffect(() => {
    if (!refreshFailed) {
      toast.dismiss(REFRESH_TOAST_ID)
      return
    }
    toast.error("Couldn't refresh the list.", {
      id: REFRESH_TOAST_ID,
      duration: Infinity,
      action: { label: 'Try again', onClick: () => void refetch() },
    })
  }, [refreshFailed, refetch])

  const counts: Record<Status, number | undefined> = { all, pending, approved }

  return (
    <main className="flex max-w-6xl flex-col gap-4 p-4 md:p-8">
      <Header />
      <CreateButton className="h-11 w-full md:hidden" />
      <Tabs
        value={search.status}
        onValueChange={(status) =>
          void navigate({
            search: { ...search, status: status as Status, page: 1 },
          })
        }
      >
        <TabsList className="h-11! w-full md:h-8! md:w-fit">
          {(['all', 'pending', 'approved'] as const).map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
              <CountBadge n={counts[s]} />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {meta.total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
          <p className="font-medium">
            {search.status === 'all'
              ? 'No users yet'
              : `No ${search.status} users`}
          </p>
          <p className="text-sm text-muted-foreground">
            Users you create or approve will show up here.
          </p>
          <CreateButton />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <UsersTable users={users} busy={busy} onAction={onAction} />
          </div>
          <div className="md:hidden">
            <UsersCards users={users} busy={busy} onAction={onAction} />
          </div>
          <UsersFooter search={search} total={meta.total} />
        </>
      )}
      <ModerationDialog
        target={target}
        onCancel={() => setTarget(null)}
        onConfirm={(t) => {
          setTarget(null)
          void run(t.action, t.user.username)
        }}
      />
    </main>
  )
}
