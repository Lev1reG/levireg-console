import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { meQuery } from '#/lib/auth'

export const Route = createFileRoute('/_authed/')({ component: Home })

function Home() {
  const { data: me } = useSuspenseQuery(meQuery)
  return <p className="p-8">Signed in as {me.name}.</p>
}
