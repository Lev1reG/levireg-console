import { Link } from '@tanstack/react-router'
import { Lock } from 'lucide-react'
import { useSignOut } from '#/hooks/use-sign-out'
import { Button, buttonVariants } from './ui/button'

export function NoAccess() {
  const signOut = useSignOut()
  return (
    <main className="flex min-h-[60svh] flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <Lock aria-hidden className="size-10 text-muted-foreground" />
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">
            You don't have access to this page
          </h1>
          <p className="text-sm text-muted-foreground">
            This page can only be opened by Superadmins. Your account is a
            Member.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/" className={buttonVariants({ size: 'lg' })}>
            Back to Dashboard
          </Link>
          <Button
            variant="outline"
            size="lg"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            Sign out
          </Button>
        </div>
      </div>
    </main>
  )
}
