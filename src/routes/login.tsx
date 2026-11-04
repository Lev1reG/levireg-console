import { useEffect, useState } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
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
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          {isPassword ? 'Password' : 'Username'}
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type={isPassword ? 'password' : 'text'}
                          autoComplete={
                            isPassword ? 'current-password' : 'username'
                          }
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                        />
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
                      className="w-full"
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
