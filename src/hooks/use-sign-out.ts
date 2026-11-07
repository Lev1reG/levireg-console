import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/lib/api'

export function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => api('post', '/api/v1/auth/logout'),
    meta: { skipAuthRedirect: true },
    // Local state goes even if the call fails. Returning the promise holds
    // the mutation's re-render until /login commits, so no stray me refetch.
    onSettled: () => {
      queryClient.clear()
      return navigate({ to: '/login' })
    },
  })
}
