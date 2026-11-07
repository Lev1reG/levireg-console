import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { apiCode } from '#/lib/api'
import { errorMessage } from '#/lib/error-message'
import { NoAccess } from '#/components/no-access'
import { Button } from './button'

export function ErrorFallback({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  // Without this, useSuspenseQuery rethrows the cached error on retry
  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  if (apiCode(error) === 'forbidden') return <NoAccess />

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold text-destructive">
        Failed to load data
      </p>
      <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
      <Button onClick={() => router.invalidate()}>Try again</Button>
    </div>
  )
}
