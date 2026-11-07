import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AppSidebar } from '#/components/app-sidebar'
import { AppTopbar } from '#/components/app-topbar'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { useSignOut } from '#/hooks/use-sign-out'
import { apiCode } from '#/lib/api'
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
  const signOut = useSignOut()

  return (
    <SidebarProvider>
      <AppSidebar
        role={me.role}
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
