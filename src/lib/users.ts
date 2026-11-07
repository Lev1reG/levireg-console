import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { apiPage } from './api'

export const PER_PAGE_OPTIONS = [10, 20, 50, 100] as const
export type Status = 'all' | 'pending' | 'approved'

export const DEFAULT_SEARCH = { status: 'all', page: 1, per_page: 20 } as const

// Bad values fall back to defaults; /users never shows an error page for them.
export const usersSearchSchema = z.object({
  status: z.enum(['all', 'pending', 'approved']).catch('all'),
  page: z.number().int().min(1).catch(1),
  per_page: z
    .number()
    .refine((n) => (PER_PAGE_OPTIONS as readonly number[]).includes(n))
    .catch(20),
})

export type UsersSearch = z.infer<typeof usersSearchSchema>

export const usersListQuery = ({ status, page, per_page }: UsersSearch) =>
  queryOptions({
    queryKey: ['users', 'list', { status, page, perPage: per_page }],
    queryFn: () =>
      apiPage('get', '/api/v1/users', {
        query: {
          status: status === 'all' ? undefined : status,
          page,
          per_page,
        },
      }),
  })

export const usersCountQuery = (status: 'pending' | 'approved') =>
  queryOptions({
    queryKey: ['users', 'count', status],
    queryFn: async () =>
      (
        await apiPage('get', '/api/v1/users', {
          query: { status, per_page: 1 },
        })
      ).meta.total,
  })

// Last page that has rows when the current page is past the end; else undefined.
export function pastEndPage(
  count: number,
  meta: { total: number; per_page: number },
) {
  return count === 0 && meta.total > 0
    ? Math.ceil(meta.total / meta.per_page)
    : undefined
}
