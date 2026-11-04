import { createFileRoute } from '@tanstack/react-router'

// Only same-origin paths survive, which prevents an open redirect
export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const { redirect } = search
    return typeof redirect === 'string' &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//')
      ? { redirect }
      : {}
  },
  component: Login,
})

// shortcut: bare stub, the real Sign in page lands in the next ticket
function Login() {
  return <h1 className="p-8 text-2xl font-semibold">Sign in</h1>
}
