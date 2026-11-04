<!-- intent-skills:start -->

## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:

- Run `pnpm exec intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm exec intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

## State management

- Server data (levireg-core): TanStack Query only. Never copy it into a Zustand store.
- Shareable state (filters, pagination, active tab): router search params.
- Client-only state shared across components: Zustand, one small store per concern in `src/stores/<name>.ts` (e.g. `useUiStore`). Read it with selectors: `useUiStore((s) => s.sidebarOpen)`.
- State local to one component: `useState`.
- Add Zustand middleware (`persist`, `devtools`) per store, only when that store needs it.

## Commands

Package manager is pnpm.

- `pnpm dev` — Vite dev server on port 3000
- `pnpm build` — production build to `dist/`
- `pnpm lint` — ESLint (`@tanstack/eslint-config` + `@tanstack/eslint-plugin-query`)
- `pnpm check` — Prettier check; `pnpm format` — Prettier write + ESLint fix
- `pnpm generate-routes` — regenerate `src/routeTree.gen.ts` (the Vite plugin also does this during dev/build)
- `pnpm generate-api` — regenerate `src/lib/api.gen.ts` from `../levireg-core/api/openapi.yaml` after contract changes; `pnpm check-api` fails if it is stale
- `pnpm dev` proxies `/api` to levireg-core on `http://localhost:8021`; production builds set `VITE_API_URL` (the API origin)
- Type check: `pnpm exec tsc --noEmit`

No test runner is set up yet.

## Architecture

Client-only SPA (Vite + React 19), despite the README's "TanStack Start" boilerplate: there is no SSR or server functions. Entry is `index.html` → `src/main.tsx` → `RouterProvider`.

- **Routing:** TanStack Router, file-based in `src/routes/`, with `autoCodeSplitting`. `src/routeTree.gen.ts` is generated; never edit it by hand.
- **Router + Query wiring (`src/router.tsx`):** `getRouter()` creates the `QueryClient`, passes it as router context (`createRootRouteWithContext<{ queryClient }>` in `__root.tsx`), and provides it via the router's `Wrap`. Load data in route `loader`s with `context.queryClient.ensureQueryData(...)`, then read it in components with `useQuery`/`useSuspenseQuery`. `defaultPreloadStaleTime: 0` is deliberate: TanStack Query owns cache freshness (default `staleTime` 60s), not the router.
- **Defaults:** `Spinner` is the default pending component and `ErrorFallback` the default error component for all routes.
- **UI:** shadcn/ui (`base-rhea` style, built on `@base-ui/react`, not Radix), Tailwind v4 configured in `src/styles.css` (no `tailwind.config`), lucide icons. Add components with `pnpm dlx shadcn add <name>`; they land in `src/components/ui/`.
- **Import aliases:** both `#/*` (package.json `imports`) and `@/*` (used by shadcn) map to `src/*`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (Lev1reG/levireg-console) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
