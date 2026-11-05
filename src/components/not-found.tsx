import { Link } from '@tanstack/react-router'
import { buttonVariants } from './ui/button'

export function NotFound() {
  return (
    <main className="flex min-h-[60svh] flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <p
          aria-hidden="true"
          className="text-[clamp(72px,16vw,112px)] leading-none font-semibold tracking-tighter"
        >
          404
        </p>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you are looking for does not exist.
          </p>
        </div>
        <Link to="/" className={buttonVariants({ size: 'lg' })}>
          Back to Dashboard
        </Link>
      </div>
    </main>
  )
}
