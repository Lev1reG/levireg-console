import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { Button } from '#/components/ui/button'
import { api, apiCode } from '#/lib/api'
import { meQuery } from '#/lib/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    try {
      await context.queryClient.ensureQueryData(meQuery)
    } catch (e) {
      if (apiCode(e) === 'unauthorized') {
        throw redirect({ to: '/login', search: { redirect: location.href } })
      }
      throw e
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { data: me } = useSuspenseQuery(meQuery)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const signOut = useMutation({
    mutationFn: () => api('post', '/api/v1/auth/logout'),
    meta: { skipAuthRedirect: true },
    // Local state goes even if the call fails. Returning the promise holds
    // the mutation's re-render until /login commits, so no stray me refetch.
    onSettled: () => {
      queryClient.clear()
      return navigate({ to: '/login' })
    },
  })

  return (
    <>
      <header className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-semibold">levireg / console</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{me.name}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            Sign out
          </Button>
        </div>
      </header>
      <Outlet />
    </>
  )
}
