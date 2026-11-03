# TanStack Form + shadcn/ui Field on `base-rhea`

Research for issue #2 (map #1). Date: 2026-11-03. Versions checked: `@tanstack/form-core` / `@tanstack/react-form` 1.33.5, `zod` 4.6.7, shadcn registry `styles/base-rhea`.

## Answer

- **Install:** `pnpm add @tanstack/react-form zod`. Neither is in `package.json` yet.
- **shadcn components:** `pnpm dlx shadcn add field input`. `field` pulls in `label` and `separator` as registry dependencies. `button` is already in `src/components/ui/`. Add `card`, `textarea`, `sonner` and others only when a form needs them. The docs examples use them, but the pattern does not require them.
- **Validator:** the shadcn page uses Zod in `validators: { onSubmit: schema }`. TanStack Form accepts any Standard Schema library (Zod, Valibot, ArkType, Effect Schema) without an adapter. Use Zod 4.
- **base-rhea vs Radix:** nothing changes. The `base-rhea` `field.tsx` uses plain HTML elements (`div`, `fieldset`, `label`) with no Radix or Base UI primitive. `input.tsx` wraps `@base-ui/react/input` and still takes native `value`/`onChange`/`onBlur`/`aria-invalid`. So the docs example works as written.
- **Server Field errors:** on a failed submit with `code: "validation_failed"`, map the envelope `errors` (`Record<string, string>`) to `{ fields: { [name]: { message } } }`. Apply it with `form.setErrorMap({ onSubmit: ... })`, or return it from `validators.onSubmitAsync`. The message must be wrapped as `{ message }` because `FieldError` only renders `error.message`.

## How the pieces fit

### Field markup (from the shadcn docs)

Source: https://ui.shadcn.com/docs/forms/tanstack-form

```tsx
const form = useForm({
  defaultValues: { username: '', password: '' },
  validators: { onSubmit: loginSchema }, // Zod schema = Standard Schema
  onSubmit: async ({ value }) => { /* ... */ },
})

<form.Field
  name="username"
  children={(field) => {
    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel htmlFor={field.name}>Username</FieldLabel>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
        />
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </Field>
    )
  }}
/>
```

- `data-invalid` on `Field` and `aria-invalid` on the control drive the styling. In `base-rhea` `input.tsx`, the `aria-invalid:border-destructive` and `aria-invalid:ring-*` classes apply that styling.
- `handleSubmit` marks every field touched before it validates. Source: `FormApi._handleSubmit`, form-core 1.33.5. So `isInvalid` is true after a failed submit even if the user never focused the field.

### `FieldError` contract (base-rhea registry)

Source: https://ui.shadcn.com/r/styles/base-rhea/field.json

```tsx
function FieldError({ children, errors, ...props }: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
})
```

- It dedupes by `message` and renders one message or a `<ul>`, inside `role="alert"`. Children override `errors`.
- **A bare string in `errors` renders nothing**, because the component reads `error?.message`. Zod/Standard Schema issues already have `.message`. Server strings must be wrapped as `{ message }`.

### Registry dependencies

From the registry JSON:

- `field`: `registryDependencies: ['label', 'separator']`, `dependencies: ['cn']`.
- `input`: `dependencies: ['cn']`. It imports `@base-ui/react/input`, already installed.

The registry imports `cn` from the `cn` package, and that package is already in `package.json`. The existing `button.tsx` does the same.

## Server-side Field errors (`validation_failed`)

Contract (`levireg-core/api/openapi.yaml`): `Envelope.errors` is `object`, `additionalProperties: string`, "Field errors, keyed by request field". `POST /api/v1/auth/login` returns `422` (`ValidationFailed`) with code `validation_failed`. Its request fields are `username` and `password`. Form field names should equal request field names, so the keys map 1:1.

### TanStack Form mechanics (form-core 1.33.5 source)

- A form-level validator may return `{ form?: string, fields: Record<fieldName, error> }`. TanStack Form spreads `fields` onto each field's `errorMap`. The validation guide documents this shape for `onSubmitAsync` (https://tanstack.com/form/latest/docs/framework/react/guides/validation). `isGlobalFormValidationError` detects it by the `fields` key.
- `form.setErrorMap({ onSubmit: { form, fields } })` follows the same path. For each **registered** field it sets `errorMap.onSubmit = fields[name]` and `errorSourceMap.onSubmit = 'form'`. It ignores keys that are not registered fields. Source: `FormApi.setErrorMap`.
- `onSubmit`-keyed field errors clear on their own once the field re-validates without error on change or blur. Source: `FieldApi.validateSync`, comment "when we have an error for onSubmit in the state, we want to clear the error as soon as the user enters a valid value". The server message therefore disappears as the user edits, with no extra code.
- An `onServer` key also exists. The form auto-clears it only at form level, and on the field it is meant for SSR/Start, so do not use it in this SPA.
- Sync and async submit validators share the `onSubmit` key. `onSubmitAsync` runs only when the sync schema passes (`asyncAlways` defaults to false).

### Recommended wiring

Keep the TanStack Query mutation in `onSubmit`, and push the server errors back afterwards:

```tsx
onSubmit: async ({ value, formApi }) => {
  try {
    await login.mutateAsync(value)
  } catch (err) {
    const env = toEnvelope(err) // axios error -> Envelope, from API client
    if (env?.code === 'validation_failed' && env.errors) {
      formApi.setErrorMap({
        onSubmit: {
          form: env.message,
          fields: Object.fromEntries(
            Object.entries(env.errors).map(([k, message]) => [k, { message }]),
          ),
        },
      })
      return
    }
    // invalid_credentials / user_pending / rate_limited / else: form-level message
  }
}
```

The other option is to call the API inside `validators.onSubmitAsync` and return `{ fields }`. That puts a side effect (Session creation) inside a validator, and the success data then has to reach `onSubmit` some other way. Avoid it for mutations.

Show a form-level message (`form.state.errorMap.onSubmit`, or local state from the caught `code`) above the submit button. Use it for the non-field codes, and for any `errors` key that does not match a registered field. `setErrorMap` drops such keys silently.

## Not checked

- No running prototype. The behaviour above comes from the form-core 1.33.5 source and the docs, not from a test run.
- shadcn's docs page does not mention server errors or per-style differences. The server-error part above relies on the TanStack Form source and docs only.
