import { useRef } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#/components/ui/alert-dialog'
import type { components } from '#/lib/api.gen'
import type { Action } from './use-moderation'

type User = components['schemas']['User']
export type Target = { action: Action; user: User }

const COPY = {
  approve: {
    title: (u: string) => `Approve @${u}?`,
    body: "This user will be able to sign in. Approval is one-way and can't be undone.",
    confirm: 'Approve',
  },
  reject: {
    title: (u: string) => `Reject and delete @${u}?`,
    body: "This user will be permanently deleted and can't be restored. The username and email will be free to use again.",
    confirm: 'Reject and delete',
  },
} as const

export function ModerationDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: Target | null
  onCancel: () => void
  onConfirm: (target: Target) => void
}) {
  // Keep the last target so the text doesn't blank during the close animation.
  const shown = useRef(target)
  if (target) shown.current = target
  const t = shown.current
  const copy = t && COPY[t.action]
  const cancelRef = useRef<HTMLButtonElement>(null)
  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={(open) => !open && onCancel()}
    >
      <AlertDialogContent initialFocus={cancelRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t && copy?.title(t.user.username)}
          </AlertDialogTitle>
          <AlertDialogDescription>{copy?.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel ref={cancelRef}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={t?.action === 'reject' ? 'destructive' : 'default'}
            onClick={() => target && onConfirm(target)}
          >
            {copy?.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
