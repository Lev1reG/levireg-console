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

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (Lev1reG/levireg-console) via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.

## State management

- Server data (levireg-core): TanStack Query only. Never copy it into a Zustand store.
- Shareable state (filters, pagination, active tab): router search params.
- Client-only state shared across components: Zustand, one small store per concern in `src/stores/<name>.ts` (e.g. `useUiStore`). Read it with selectors: `useUiStore((s) => s.sidebarOpen)`.
- State local to one component: `useState`.
- Add Zustand middleware (`persist`, `devtools`) per store, only when that store needs it.
