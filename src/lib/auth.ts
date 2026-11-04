import { queryOptions } from '@tanstack/react-query'
import { api } from './api'

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { skipAuthRedirect?: boolean }
    mutationMeta: { skipAuthRedirect?: boolean }
  }
}

// Signed in means this query succeeded. Its callers own the redirect.
export const meQuery = queryOptions({
  queryKey: ['auth', 'me'],
  queryFn: () => api('get', '/api/v1/auth/me'),
  meta: { skipAuthRedirect: true },
})
