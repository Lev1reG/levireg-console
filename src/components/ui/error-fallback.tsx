import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Button } from './button'

export function ErrorFallback({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  // Without this, useSuspenseQuery rethrows the cached error on retry
  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold text-destructive">
        Failed to load data
      </p>
      <p className="text-sm text-muted-foreground">
        {(error instanceof Error && error.message) || 'Something went wrong'}
      </p>
      <Button onClick={() => router.invalidate()}>Try again</Button>
    </div>
  )
}
