import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { initials } from '#/components/app-sidebar'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { meQuery } from '#/lib/auth'

export const Route = createFileRoute('/_authed/')({
  staticData: { crumb: 'Dashboard' },
  component: Home,
})

const placeholder =
  'border-dashed bg-transparent text-sm text-muted-foreground shadow-none'

function Home() {
  const { data: me } = useSuspenseQuery(meQuery)
  return (
    <main className="flex max-w-6xl flex-col gap-6 p-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Signed in as {me.name}.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials(me.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{me.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              Session active
            </div>
          </CardContent>
        </Card>
        {[0, 1].map((i) => (
          <Card key={i} className={`min-h-36 ${placeholder}`}>
            <CardContent>[Widget area]</CardContent>
          </Card>
        ))}
      </div>
      <Card className={`min-h-72 ${placeholder}`}>
        <CardContent>[Main content area]</CardContent>
      </Card>
    </main>
  )
}
