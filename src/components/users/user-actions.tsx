import { Button } from '#/components/ui/button'
import { Loader2 } from 'lucide-react'
import type { components } from '#/lib/api.gen'
import type { Action } from './use-moderation'

type User = components['schemas']['User']

export type UserActionProps = {
  busy: Partial<Record<string, Action>>
  onAction: (action: Action, user: User) => void
}

export function UserActions({
  user,
  busy,
  onAction,
  className,
}: UserActionProps & { user: User; className?: string }) {
  if (user.approved_at !== null) return null
  const active = busy[user.username]
  const buttons = [
    { action: 'approve', label: 'Approve', variant: 'default' },
    { action: 'reject', label: 'Reject', variant: 'destructive' },
  ] as const
  return (
    <div className="flex gap-2">
      {buttons.map((b) => (
        <Button
          key={b.action}
          variant={b.variant}
          disabled={active !== undefined}
          onClick={() => onAction(b.action, user)}
          className={className}
        >
          {active === b.action && (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          )}
          {b.label}
        </Button>
      ))}
    </div>
  )
}
