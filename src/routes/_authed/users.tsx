import { createFileRoute } from '@tanstack/react-router'
import { ForbiddenError } from '#/lib/api'
import { meQuery } from '#/lib/auth'

export const Route = createFileRoute('/_authed/users')({
  staticData: { crumb: 'Users' },
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.query({
      ...meQuery,
      staleTime: 'static',
    })
    if (me.role !== 'superadmin') throw new ForbiddenError()
  },
  component: Users,
})

function Users() {
  return (
    <main className="flex max-w-6xl flex-col gap-1.5 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
      <p className="text-sm text-muted-foreground">
        User management is coming soon.
      </p>
    </main>
  )
}
