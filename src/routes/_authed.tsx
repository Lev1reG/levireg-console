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
import { AppSidebar } from '#/components/app-sidebar'
import { AppTopbar } from '#/components/app-topbar'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { api, apiCode } from '#/lib/api'
import { meQuery } from '#/lib/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    try {
      await context.queryClient.query({ ...meQuery, staleTime: 'static' })
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
    <SidebarProvider>
      <AppSidebar
        name={me.name}
        username={me.username}
        onSignOut={() => signOut.mutate()}
        signingOut={signOut.isPending}
      />
      <SidebarInset>
        <AppTopbar />
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
