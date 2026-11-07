import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiCode } from '#/lib/api'
import { meQuery } from '#/lib/auth'
import { errorMessage } from '#/lib/error-message'

export type Action = 'approve' | 'reject'

const USERS_KEY = ['users']

// Pessimistic approve/reject: a user stays busy until the ['users'] refetch settles.
export function useModeration() {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<Partial<Record<string, Action>>>({})

  const mutation = useMutation({
    mutationFn: ({ action, username }: { action: Action; username: string }) =>
      action === 'approve'
        ? api('post', '/api/v1/users/{username}/approve', {
            path: { username },
          })
        : api('post', '/api/v1/users/{username}/reject', {
            path: { username },
          }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: USERS_KEY })

  const run = async (action: Action, username: string) => {
    setBusy((b) => ({ ...b, [username]: action }))
    const handle = `@${username}`
    try {
      await mutation.mutateAsync({ action, username })
      toast.success(
        action === 'approve'
          ? `${handle} approved`
          : `${handle} rejected and deleted`,
      )
      await refresh()
    } catch (error) {
      const code = apiCode(error)
      if (code === 'user_not_found') {
        toast.info(`${handle} no longer exists. The row was removed.`)
        await refresh()
      } else if (code === 'user_not_pending') {
        toast.info(
          action === 'approve'
            ? `${handle} was already approved. The row has been updated.`
            : `${handle} was already approved and can't be rejected. The row has been updated.`,
        )
        await refresh()
      } else if (code === 'forbidden') {
        // The global onError refreshes `me`; the list refetch then 403s into No access.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: meQuery.queryKey }),
          refresh(),
        ])
      } else if (code !== 'unauthorized') {
        toast.error(errorMessage(error), {
          duration: Infinity,
          action: {
            label: 'Try again',
            onClick: () => void run(action, username),
          },
        })
      }
    } finally {
      setBusy(({ [username]: _, ...rest }) => rest)
    }
  }

  return { busy, run }
}
