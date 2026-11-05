import { useEffect, useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { api, apiEnvelope } from '#/lib/api'
import type { Code } from '#/lib/api'
import { meQuery } from '#/lib/auth'

// Only same-origin paths survive, which prevents an open redirect
export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const { redirect: to } = search
    return typeof to === 'string' && to.startsWith('/') && !to.startsWith('//')
      ? { redirect: to }
      : {}
  },
  beforeLoad: async ({ context }) => {
    // Any failure (unauthorized or not) leaves the User on the Sign in page
    const me = await context.queryClient
      .query({ ...meQuery, staleTime: 'static' })
      .catch(() => null)
    if (me) throw redirect({ to: '/' })
  },
  component: Login,
})

const schema = z.object({
  username: z.string().trim().min(1, 'Enter your username.'),
  password: z.string().min(1, 'Enter your password.'),
})

const FIELDS = ['username', 'password'] as const

const COPY = {
  invalid_credentials: 'Wrong username or password.',
  user_pending:
    'Your account is waiting for approval. You can sign in once a Superadmin approves it.',
  rate_limited: 'Too many sign-in attempts. Wait a minute and try again.',
  other: 'Something went wrong on our side. Try again.',
} satisfies Partial<Record<Code | 'other', string>>

// The contract has no Retry-After, so the client counts down on its own
const RATE_LIMIT_SECONDS = 60

function Login() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // Destructive messages under the button
  const [errors, setErrors] = useState<Array<string>>([])
  const [lockedFor, setLockedFor] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (lockedFor <= 0) return
    const t = setTimeout(() => setLockedFor((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [lockedFor])

  const login = useMutation({
    mutationFn: (body: z.infer<typeof schema>) =>
      api('post', '/api/v1/auth/login', { body }),
  })

  const form = useForm({
    defaultValues: { username: '', password: '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const user = await login.mutateAsync(value)
        queryClient.setQueryData(meQuery.queryKey, user)
        await navigate({ href: search.redirect ?? '/' })
      } catch (e) {
        const env = apiEnvelope(e)
        switch (env?.code) {
          case 'validation_failed': {
            const entries = Object.entries(env.errors ?? {})
            if (entries.length === 0) {
              setErrors([COPY.other])
              return
            }
            const isField = ([k]: [string, string]) =>
              (FIELDS as ReadonlyArray<string>).includes(k)
            formApi.setErrorMap({
              onSubmit: {
                form: undefined,
                fields: Object.fromEntries(
                  entries
                    .filter(isField)
                    .map(([k, message]) => [k, { message }]),
                ),
              },
            })
            setErrors(entries.filter((x) => !isField(x)).map(([, m]) => m))
            return
          }
          case 'invalid_credentials':
            // Clear first: the value change would wipe an onSubmit error set before it
            formApi.setFieldValue('password', '')
            formApi.setErrorMap({
              onSubmit: {
                form: undefined,
                fields: { password: { message: COPY.invalid_credentials } },
              },
            })
            return
          case 'user_pending':
            setErrors([COPY.user_pending])
            return
          case 'rate_limited':
            setLockedFor(RATE_LIMIT_SECONDS)
            return
          default:
            setErrors([COPY.other])
        }
      }
    },
  })

  return (
    <main className="grid min-h-svh md:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-zinc-900 p-10 text-zinc-50 md:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(250,250,250,.16)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_85%_75%_at_100%_100%,#000,transparent)]"
        />
        <span className="relative flex items-center gap-3 text-sm font-semibold tracking-tight">
          <span
            aria-hidden
            className="size-2 animate-pulse rounded-full bg-emerald-400 ring-4 ring-emerald-400/20"
          />
          levireg / console
        </span>
        <p className="relative max-w-xs text-[28px] leading-[1.3] font-medium tracking-tight">
          <span className="text-zinc-400">Dashboard for</span> levireg services.
        </p>
        <span className="relative text-[13px] text-zinc-400">levireg.dev</span>
      </aside>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-xs">
          <span className="mb-10 flex items-center gap-3 text-sm font-semibold tracking-tight md:hidden">
            <span
              aria-hidden
              className="size-2 animate-pulse rounded-full bg-emerald-500"
            />
            levireg / console
          </span>
          <h1 className="mb-1.5 text-2xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mb-7 text-sm text-muted-foreground">
            Enter your credentials to access the console.
          </p>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              setErrors([])
              void form.handleSubmit()
            }}
          >
            <FieldGroup>
              {FIELDS.map((name) => (
                <form.Field key={name} name={name}>
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    const isPassword = name === 'password'
                    const Icon = isPassword ? Lock : User
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          {isPassword ? 'Password' : 'Username'}
                        </FieldLabel>
                        <div className="group relative">
                          <Icon
                            aria-hidden
                            className="pointer-events-none absolute top-3 left-3.5 z-10 size-4 text-zinc-500 group-focus-within:text-emerald-600 group-has-aria-invalid:text-destructive group-has-aria-invalid:group-focus-within:text-destructive"
                          />
                          <Input
                            id={field.name}
                            name={field.name}
                            type={
                              isPassword && !showPassword ? 'password' : 'text'
                            }
                            autoComplete={
                              isPassword ? 'current-password' : 'username'
                            }
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            className={`h-11 rounded-full bg-zinc-100 pl-9.5 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20 md:h-10 ${isPassword ? 'pr-11' : 'pr-4'}`}
                          />
                          {isPassword && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="absolute top-0 right-0 size-11 rounded-full text-zinc-500 hover:bg-transparent hover:text-zinc-950 md:size-10"
                              aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                              }
                              onClick={() => setShowPassword((v) => !v)}
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </Button>
                          )}
                        </div>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
              ))}
              <div className="flex flex-col gap-2">
                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <Button
                      type="submit"
                      className="mt-1 h-11 w-full rounded-full md:h-10"
                      disabled={isSubmitting || lockedFor > 0}
                    >
                      {isSubmitting
                        ? 'Signing in…'
                        : lockedFor > 0
                          ? `Try again in ${lockedFor}s`
                          : 'Sign in'}
                    </Button>
                  )}
                </form.Subscribe>
                {errors.length > 0 && (
                  <FieldError errors={errors.map((message) => ({ message }))} />
                )}
                {lockedFor > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {COPY.rate_limited}
                  </p>
                )}
              </div>
            </FieldGroup>
          </form>
        </div>
      </section>
    </main>
  )
}
