// PROTOTYPE, throwaway. Answers "Sign-in page layout" (levireg-console#6):
// three variants of the /login page, switchable via `?variant=`, with a fake
// sign-in whose outcome is picked via `?outcome=` in the floating bar.
// Nothing here calls the API. Do not merge to main.
import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { AlertCircle, ChevronLeft, ChevronRight, Clock, Lock } from 'lucide-react'

import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'

const VARIANTS = {
  A: 'Centered card, alert on top',
  B: 'Split panel, message by the button',
  C: 'Bare form, outcome screens',
} as const
type Variant = keyof typeof VARIANTS

const OUTCOMES = [
  'ok',
  'invalid_credentials',
  'user_pending',
  'rate_limited',
  'validation_failed',
  'internal_error',
] as const
type Outcome = (typeof OUTCOMES)[number]

export const Route = createFileRoute('/prototype/login')({
  validateSearch: (s: Record<string, unknown>) => ({
    variant: (s.variant as Variant | undefined) ?? 'A',
    outcome: (s.outcome as Outcome | undefined) ?? 'invalid_credentials',
  }),
  component: Prototype,
})

// Copy under review. Server `message` would be ignored in favour of these.
const COPY: Record<Exclude<Outcome, 'ok' | 'validation_failed'>, string> = {
  invalid_credentials: 'Wrong username or password.',
  user_pending:
    'Your account is waiting for approval. You can sign in once a Superadmin approves it.',
  rate_limited: 'Too many sign-in attempts. Wait a minute and try again.',
  internal_error: 'Something went wrong on our side. Try again.',
}

// Fake 422 `errors` body, keyed by request field.
const FAKE_FIELD_ERRORS = {
  username: 'must be 3 to 32 characters',
  password: 'must be at least 8 characters',
}

const schema = z.object({
  username: z.string().trim().min(1, 'Enter your username.'),
  password: z.string().min(1, 'Enter your password.'),
})

type Status =
  | { kind: 'idle' }
  | { kind: 'error'; code: Outcome }
  | { kind: 'signed_in'; username: string }

function useFakeSignIn(outcome: Outcome) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const form = useForm({
    defaultValues: { username: '', password: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      setStatus({ kind: 'idle' })
      await new Promise((r) => setTimeout(r, 1200))
      if (outcome === 'ok') {
        setStatus({ kind: 'signed_in', username: value.username })
        return
      }
      if (outcome === 'validation_failed') {
        formApi.setErrorMap({
          onSubmit: {
            form: undefined,
            fields: {
              username: { message: `Username ${FAKE_FIELD_ERRORS.username}.` },
              password: { message: `Password ${FAKE_FIELD_ERRORS.password}.` },
            },
          },
        })
      }
      if (outcome === 'invalid_credentials') formApi.setFieldValue('password', '')
      setStatus({ kind: 'error', code: outcome })
    },
  })
  return { form, status, reset: () => setStatus({ kind: 'idle' }) }
}

type SignIn = ReturnType<typeof useFakeSignIn>

function Prototype() {
  const { variant, outcome } = Route.useSearch()
  // Remount per variant/outcome so each starts clean.
  return <Host key={`${variant}-${outcome}`} variant={variant} outcome={outcome} />
}

function Host({ variant, outcome }: { variant: Variant; outcome: Outcome }) {
  const signIn = useFakeSignIn(outcome)
  return (
    <>
      {variant === 'A' && <VariantA {...signIn} />}
      {variant === 'B' && <VariantB {...signIn} />}
      {variant === 'C' && <VariantC {...signIn} />}
      {import.meta.env.DEV && (
        <PrototypeSwitcher variant={variant} outcome={outcome} status={signIn.status} />
      )}
    </>
  )
}

// Shared input renderer: the question is page layout, not the input itself.
function TextField({
  form,
  name,
  label,
  type = 'text',
  autoComplete,
  extraError,
}: {
  form: SignIn['form']
  name: 'username' | 'password'
  label: string
  type?: string
  autoComplete: string
  extraError?: string
}) {
  return (
    <form.Field name={name}>
      {(field) => {
        const isInvalid =
          (field.state.meta.isTouched && !field.state.meta.isValid) || !!extraError
        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type={type}
              autoComplete={autoComplete}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
            />
            {isInvalid && (
              <FieldError
                errors={
                  extraError ? [{ message: extraError }] : field.state.meta.errors
                }
              />
            )}
          </Field>
        )
      }}
    </form.Field>
  )
}

function SubmitButton({
  form,
  label = 'Sign in',
  disabled,
  className,
}: {
  form: SignIn['form']
  label?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <form.Subscribe selector={(s) => s.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting || disabled} className={className}>
          {isSubmitting ? 'Signing in…' : label}
        </Button>
      )}
    </form.Subscribe>
  )
}

function onSubmitHandler(form: SignIn['form']) {
  return (e: React.FormEvent) => {
    e.preventDefault()
    void form.handleSubmit()
  }
}

function SignedIn({ username }: { username: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      Signed in as <strong>{username}</strong>. Real page redirects to{' '}
      <code>redirect</code> or <code>/</code>.
    </p>
  )
}

/* ---------- A: centered card, every non-field error in one Alert on top ---------- */

function VariantA({ form, status }: SignIn) {
  const code = status.kind === 'error' ? status.code : null
  const alert = code && code !== 'validation_failed' && code !== 'ok' ? COPY[code] : null
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in to levireg console</CardTitle>
          <CardDescription>Use your levireg account.</CardDescription>
        </CardHeader>
        <CardContent>
          {status.kind === 'signed_in' ? (
            <SignedIn username={status.username} />
          ) : (
            <form id="login" onSubmit={onSubmitHandler(form)} noValidate>
              <FieldGroup>
                {alert && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{alert}</AlertDescription>
                  </Alert>
                )}
                <TextField form={form} name="username" label="Username" autoComplete="username" />
                <TextField
                  form={form}
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                />
              </FieldGroup>
            </form>
          )}
        </CardContent>
        {status.kind !== 'signed_in' && (
          <CardFooter>
            <SubmitButton form={form} className="w-full" />
          </CardFooter>
        )}
      </Card>
    </main>
  )
}

/* ---------- B: split panel; invalid_credentials on the password field,
   other errors beside the button, rate_limited locks the button with a countdown ---------- */

function VariantB({ form, status }: SignIn) {
  const code = status.kind === 'error' ? status.code : null
  const [lockedFor, setLockedFor] = useState(0)

  useEffect(() => {
    if (code === 'rate_limited') setLockedFor(60)
  }, [code])
  useEffect(() => {
    if (lockedFor <= 0) return
    const t = setTimeout(() => setLockedFor((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [lockedFor])

  const message =
    code === 'user_pending' || code === 'internal_error' ? COPY[code] : null

  return (
    <main className="grid min-h-svh md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground md:flex">
        <span className="font-semibold tracking-tight">levireg / console</span>
        <p className="text-2xl leading-snug font-medium">
          Dashboard for levireg services.
        </p>
        <span className="text-sm opacity-70">levireg.dev</span>
      </aside>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
          {status.kind === 'signed_in' ? (
            <SignedIn username={status.username} />
          ) : (
            <form onSubmit={onSubmitHandler(form)} noValidate>
              <FieldGroup>
                <TextField form={form} name="username" label="Username" autoComplete="username" />
                <TextField
                  form={form}
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  extraError={code === 'invalid_credentials' ? COPY.invalid_credentials : undefined}
                />
                <div className="flex flex-col gap-2">
                  <SubmitButton
                    form={form}
                    className="w-full"
                    disabled={lockedFor > 0}
                    label={lockedFor > 0 ? `Try again in ${lockedFor}s` : 'Sign in'}
                  />
                  {message && <p className="text-sm text-destructive">{message}</p>}
                  {lockedFor > 0 && (
                    <p className="text-sm text-muted-foreground">{COPY.rate_limited}</p>
                  )}
                </div>
              </FieldGroup>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

/* ---------- C: bare form, banner across the page top; user_pending and
   rate_limited replace the form with a dedicated screen ---------- */

function VariantC({ form, status, reset }: SignIn) {
  const code = status.kind === 'error' ? status.code : null
  const banner =
    code === 'invalid_credentials' || code === 'internal_error' ? COPY[code] : null

  if (code === 'user_pending' || code === 'rate_limited') {
    const Icon = code === 'user_pending' ? Clock : Lock
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <Icon className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">
          {code === 'user_pending' ? 'Waiting for approval' : 'Too many attempts'}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">{COPY[code]}</p>
        <Button variant="outline" onClick={reset}>
          Back to sign in
        </Button>
      </main>
    )
  }

  return (
    <main className="min-h-svh">
      {banner && (
        <div role="alert" className="bg-destructive px-4 py-2 text-center text-sm text-white">
          {banner}
        </div>
      )}
      <div className="mx-auto max-w-md px-6 pt-[20vh]">
        <p className="text-sm text-muted-foreground">levireg console</p>
        <h1 className="mb-8 text-3xl font-bold tracking-tight">Welcome back</h1>
        {status.kind === 'signed_in' ? (
          <SignedIn username={status.username} />
        ) : (
          <form onSubmit={onSubmitHandler(form)} noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField form={form} name="username" label="Username" autoComplete="username" />
                <TextField
                  form={form}
                  name="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                />
              </div>
              <SubmitButton form={form} className="self-start" label="Continue" />
            </FieldGroup>
          </form>
        )}
      </div>
    </main>
  )
}

/* ---------- floating switcher (prototype chrome, not part of the design) ---------- */

function PrototypeSwitcher({
  variant,
  outcome,
  status,
}: {
  variant: Variant
  outcome: Outcome
  status: Status
}) {
  const navigate = useNavigate({ from: '/prototype/login' })
  const keys = Object.keys(VARIANTS) as Variant[]
  const step = (d: number) => {
    const next = keys[(keys.indexOf(variant) + d + keys.length) % keys.length]
    void navigate({ search: (s) => ({ ...s, variant: next }), replace: true })
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowLeft') step(-1)
      if (e.key === 'ArrowRight') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black px-3 py-2 font-mono text-xs text-white shadow-2xl ring-2 ring-yellow-400">
      <button onClick={() => step(-1)} aria-label="Previous variant">
        <ChevronLeft className="size-4" />
      </button>
      <span>
        {variant} ({VARIANTS[variant]})
      </span>
      <button onClick={() => step(1)} aria-label="Next variant">
        <ChevronRight className="size-4" />
      </button>
      <span className="opacity-50">|</span>
      <label className="flex items-center gap-1">
        outcome
        <select
          className="rounded bg-white/10 px-1 py-0.5"
          value={outcome}
          onChange={(e) =>
            void navigate({
              search: (s) => ({ ...s, outcome: e.target.value as Outcome }),
              replace: true,
            })
          }
        >
          {OUTCOMES.map((o) => (
            <option key={o} value={o} className="text-black">
              {o}
            </option>
          ))}
        </select>
      </label>
      <span className="opacity-50">|</span>
      <span>
        status: {status.kind}
        {status.kind === 'error' && `:${status.code}`}
      </span>
    </div>
  )
}
