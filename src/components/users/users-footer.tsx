import { useLinkProps, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '#/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { PER_PAGE_OPTIONS } from '#/lib/users'
import type { UsersSearch } from '#/lib/users'

type Props = { search: UsersSearch; total: number }

// First, last and the neighbours of the current page; gaps become ellipses.
function pageWindow(page: number, last: number) {
  const pages = [
    ...new Set(
      [1, page - 1, page, page + 1, last].filter((p) => p >= 1 && p <= last),
    ),
  ].sort((a, b) => a - b)
  return pages.flatMap((p, i) =>
    i > 0 && p - pages[i - 1] > 1 ? ['gap' as const, p] : [p],
  )
}

function PageLink({
  page,
  search,
  ...props
}: { page: number; search: UsersSearch } & Omit<
  React.ComponentProps<typeof PaginationLink>,
  'href'
>) {
  const linkProps = useLinkProps({ to: '/users', search: { ...search, page } })
  return <PaginationLink {...linkProps} {...props} />
}

function range(search: UsersSearch, total: number) {
  const from = (search.page - 1) * search.per_page + 1
  return `Showing ${from}–${Math.min(search.page * search.per_page, total)} of ${total}`
}

export function UsersFooter({ search, total }: Props) {
  const navigate = useNavigate({ from: '/users' })
  const last = Math.max(1, Math.ceil(total / search.per_page))
  const { page } = search
  const go = (p: number) => ({ ...search, page: p })

  return (
    <>
      {/* Desktop */}
      <div className="hidden items-center justify-between gap-4 md:flex">
        <p className="text-sm text-muted-foreground">{range(search, total)}</p>
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PageLink
                  page={page - 1}
                  search={search}
                  size="default"
                  aria-label="Go to previous page"
                >
                  Previous
                </PageLink>
              </PaginationItem>
            )}
            {pageWindow(page, last).map((p, i) => (
              <PaginationItem key={p === 'gap' ? `gap-${i}` : p}>
                {p === 'gap' ? (
                  <PaginationEllipsis />
                ) : (
                  <PageLink page={p} search={search} isActive={p === page}>
                    {p}
                  </PageLink>
                )}
              </PaginationItem>
            ))}
            {page < last && (
              <PaginationItem>
                <PageLink
                  page={page + 1}
                  search={search}
                  size="default"
                  aria-label="Go to next page"
                >
                  Next
                </PageLink>
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Rows per page</span>
          <Select
            value={String(search.per_page)}
            onValueChange={(v) =>
              void navigate({
                search: { ...search, per_page: Number(v), page: 1 },
              })
            }
          >
            <SelectTrigger aria-label="Rows per page" className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        <p className="text-sm text-muted-foreground">{range(search, total)}</p>
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            className="h-11 min-w-24"
            disabled={page <= 1}
            onClick={() => void navigate({ search: go(page - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {page} of {last}
          </span>
          <Button
            variant="outline"
            className="h-11 min-w-24"
            disabled={page >= last}
            onClick={() => void navigate({ search: go(page + 1) })}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  )
}
