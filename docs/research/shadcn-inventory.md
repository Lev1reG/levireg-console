# shadcn component inventory for User management

Research for [#17](https://github.com/Lev1reG/levireg-console/issues/17). Style: `base-rhea` (`components.json`), built on `@base-ui/react` (repo has `^1.9.0`). Checked 2026-11-07.

## Answer

All seven needs are covered by the `base-rhea` registry. Nothing must be hand-rolled as a primitive. Two items need glue code: a data-table layer (no `data-table` registry item) and the `sonner` Toaster's theme hook (it imports `next-themes`, which this app does not use).

| Need | Available | Install | Base UI primitive | Notes |
|---|---|---|---|---|
| Table | yes | `pnpm dlx shadcn add table` | none (plain `<table>`) | Pure markup, same as Radix version. No `data-table` item: sorting/filtering/pagination logic is ours (plain state + router search params, or `@tanstack/react-table`, not installed). |
| Alert dialog | yes | `pnpm dlx shadcn add alert-dialog` | `@base-ui/react/alert-dialog` | `AlertDialogAction` is a plain `Button`: it does **not** close the dialog (Radix `Action` did). Good for async delete: keep `open` controlled, close on mutation success. `AlertDialogCancel` = `AlertDialogPrimitive.Close` with `render={<Button />}`. Extra `AlertDialogMedia`, `size="default" \| "sm"` on content. |
| Dialog | yes | `pnpm dlx shadcn add dialog` | `@base-ui/react/dialog` | `DialogContent showCloseButton` (default true), `DialogFooter showCloseButton`. `onOpenChange(open, eventDetails)`. Use `render` not `asChild` on `DialogTrigger`/`DialogClose`. |
| Badge | yes | `pnpm dlx shadcn add badge` | `useRender` + `mergeProps` | Variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`. Polymorphic via `render` prop. |
| Toast | yes | `pnpm dlx shadcn add sonner` | none (`sonner` lib) | Adds deps `sonner` + `next-themes`. Generated `Toaster` calls `useTheme()` from `next-themes`; replace with `useThemeStore((s) => s.theme)` from `src/stores/theme.ts` and drop `next-themes`. |
| Toggle group | yes | `pnpm dlx shadcn add toggle-group` (pulls `toggle`) | `@base-ui/react/toggle-group` | `value`/`defaultValue` are **always `string[]`**, single-select is `multiple={false}` (default). No Radix `type="single" \| "multiple"`. Props `variant`, `size`, `spacing`, `orientation`. |
| Tabs | yes | `pnpm dlx shadcn add tabs` | `@base-ui/react/tabs` | `TabsTrigger` wraps `Tabs.Tab`, `TabsContent` wraps `Tabs.Panel`. `onValueChange(value, eventDetails)`; event `reason` distinguishes user vs automatic changes. `TabsList variant="default" \| "line"`. Active styling via `data-active`, not `data-state=active`. |
| Pagination | yes | `pnpm dlx shadcn add pagination` | none (markup + `Button`) | `PaginationLink` renders `Button` with `nativeButton={false}` and `render={<a … />}`. For TanStack Router, pass a `Link` (or `href` + search) instead of a raw `<a>`; page-count logic is ours. |

## API differences from Radix versions (cross-cutting)

- `asChild` is gone. Composition uses `render={<Element />}` (or a function `(props, state) => …`). Source: Base UI docs, `render` prop on every part.
- When `render` swaps a button part for a non-button (e.g. `<a>`, `<Link>`), set `nativeButton={false}`. Source: Base UI `nativeButton` prop.
- Parts are named after Base UI: `Backdrop` (Radix `Overlay`, still exported as `DialogOverlay`), `Popup` (Radix `Content`), `Tab`/`Panel` (Radix `Trigger`/`Content`).
- State attributes: `data-open`/`data-closed`, `data-active`, `data-pressed` / `aria-pressed`, instead of Radix `data-state="…"`.
- Change callbacks take a second `eventDetails` arg (`reason`, `cancel()`).
- Dialog/AlertDialog have `actionsRef` (`close()`, `unmount()`) for imperative control.
- Minor: `toggle-group.tsx` keeps a `data-[state=on]:bg-muted` class that never matches under Base UI; pressed styling comes from `toggle.tsx`'s `aria-pressed:bg-muted`. Harmless.

## Must be hand-rolled / glued

1. Data-table behaviour (sorting, column defs, page math, empty/loading rows). shadcn has no `data-table` registry item; its docs page is a recipe on `@tanstack/react-table`.
2. `Toaster` theme wiring: swap `next-themes` for `useThemeStore`.
3. Router-aware pagination links (render TanStack `Link`).

## Sources

- Registry JSON (primary, generated component source): `https://ui.shadcn.com/r/styles/base-rhea/{table,alert-dialog,dialog,badge,sonner,toggle-group,toggle,tabs,pagination}.json` (all HTTP 200); `…/base-rhea/data-table.json` returns 404.
- Radix comparison: `https://ui.shadcn.com/r/styles/new-york-v4/alert-dialog.json` (`AlertDialogAction` wraps `AlertDialogPrimitive.Action` with `asChild`).
- Base UI API reference: `https://base-ui.com/react/components/{dialog,alert-dialog,tabs,toggle-group,toggle}.md` (props `render`, `nativeButton`, `onOpenChange`, `actionsRef`, `value: string[]`, `multiple`, `data-pressed`).
- shadcn data-table recipe (Base UI docs): `https://ui.shadcn.com/docs/components/base/data-table`.
- Repo: `components.json`, `package.json`, `src/stores/theme.ts`.
