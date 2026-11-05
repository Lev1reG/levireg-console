import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import type { QueryMeta } from '@tanstack/react-query'
import axios from 'axios'
import { routeTree } from './routeTree.gen'
import { Spinner } from './components/ui/spinner'
import { ErrorFallback } from './components/ui/error-fallback'
import { NotFound } from './components/not-found'
import { apiCode } from './lib/api'

export function getRouter() {
  const onError = (error: unknown, meta?: QueryMeta) => {
    if (apiCode(error) !== 'unauthorized' || meta?.skipAuthRedirect) return
    // Several 401s can land together; only the first one redirects
    if (router.state.location.pathname === '/login') return
    queryClient.clear()
    void router.navigate({
      to: '/login',
      search: { redirect: router.state.location.href },
    })
  }

  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => onError(error, query.meta),
    }),
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => onError(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Client errors (incl. unauthorized) never succeed on retry
        retry: (failureCount, error) => {
          const status = axios.isAxiosError(error)
            ? error.response?.status
            : undefined
          return (status === undefined || status >= 500) && failureCount < 3
        },
      },
    },
  })

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    // Query owns the cache, so router never treats preloaded data as fresh
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: Spinner,
    defaultErrorComponent: ErrorFallback,
    defaultNotFoundComponent: NotFound,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  })

  return router
}

declare module '@tanstack/react-router' {
  // Breadcrumb label; routes without one are skipped.
  interface StaticDataRouteOption {
    crumb?: string
  }
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
