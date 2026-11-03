# Typing axios with openapi-typescript types

Research for issue #3 (wayfinder map #1). Date: 2026-11-03.

## Question

1. Cleanest way to use `openapi-typescript`-generated types with axios (no `openapi-fetch`), so request bodies and the envelope's `data` are typed per path?
2. Where should the generate script read `openapi.yaml` from: the sibling checkout `../levireg-core/api/openapi.yaml` or a vendored copy?
3. Should the generated file be committed?
4. The `package.json` script line.

## Answer

- **Generate `paths` with `openapi-typescript`, then write one small generic `api(method, url, opts)` wrapper over an `axios.create()` instance.** It needs about 40 lines of type helpers, keyed on `paths[P][M]`. Add no runtime dependency beyond axios. Add no `openapi-typescript-helpers`, no `openapi-axios`.
- **Read the sibling path `../levireg-core/api/openapi.yaml` directly.** Do not vendor a copy.
- **Commit the generated file** (`src/lib/api.gen.ts`), like `src/routeTree.gen.ts` already is. Add a `--check` script to catch drift.
- Script lines:

```json
"generate-api": "openapi-typescript ../levireg-core/api/openapi.yaml -o src/lib/api.gen.ts",
"check-api": "openapi-typescript ../levireg-core/api/openapi.yaml -o src/lib/api.gen.ts --check"
```

Install: `pnpm add -D openapi-typescript` and `pnpm add axios`.

## Findings

### What openapi-typescript emits

- The CLI takes a local YAML/JSON path or a URL. `-o` / `--output` sets the output file. Source: <https://openapi-ts.dev/introduction>, <https://openapi-ts.dev/cli>.
- The docs require `module: ESNext` (or `NodeNext`) and `moduleResolution: Bundler` (or `NodeNext`). They call `noUncheckedIndexedAccess: true` "highly recommended". Source: <https://openapi-ts.dev/introduction>. This repo's `tsconfig.json` already has ESNext + bundler. It does not set `noUncheckedIndexedAccess`; adding it is optional.
- `--check` "Check[s] that the generated types are up-to-date". Source: <https://openapi-ts.dev/cli>. Verified locally: it prints `Generated types are not up-to-date!` on drift.
- Output against our contract (verified locally, openapi-typescript 7.13.0, 653 lines):
  - `paths["/api/v1/auth/login"].post` is `operations["login"]`. Methods a path lacks are `?: never`.
  - Each operation has `parameters: { query?, header?, path?, cookie? }` and an optional `requestBody: { content: { "application/json": … } }`. It also has `responses: { 200: { content: { "application/json": … } }, 401: … }`.
  - `allOf: [Envelope, {data: X}]` becomes `components["schemas"]["Envelope"] & { data?: X }`. `Envelope.data` is `data?: unknown`, and `unknown & X` is `X`, so the intersection gives the right per-path `data` type.
  - `data` is **optional** (`data?:`) on every path except `listUsers`. The contract marks only `listUsers` with `required: [data, meta]`. The wrapper below strips `undefined` with `NonNullable`. It can do that because `code: ok` always carries `data` for those endpoints, as the contract's descriptions say. If levireg-core adds `required: [data]`, the `NonNullable` becomes a no-op.

### Ecosystem options for axios (rejected)

- The openapi-ts examples page lists `openapi-axios` (community, `@web-bee-ru`) as the axios integration. Source: <https://openapi-ts.dev/examples>. It is a third-party wrapper with its own status-handling modes. It is a dependency for something about 40 lines of types already cover, and it does not know our envelope. Rejected.
- `openapi-typescript-helpers` exports `PathsWithMethod`, `SuccessResponseJSON`, `RequestBodyJSON` and similar. Source: <https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript-helpers/src/index.ts>. It is a 0.x package (0.1.0) built as openapi-fetch internals. We would still need envelope unwrapping on top. Rejected; inline the few helpers instead.

### axios typing hooks

- `AxiosInstance.request<T, R = AxiosResponse<T>, D>(config: AxiosRequestConfig<D>)`. `AxiosResponse<T>.data: T`. `AxiosRequestConfig` has `params` and `data`. Source: <https://github.com/axios/axios/blob/v1.x/index.d.ts>. So the wrapper passes the success-body type as `T` and returns `res.data.data`.
- `axios.isAxiosError<T>(e)` narrows `e.response?.data` to `T`. Source: same file. Non-2xx responses reject by default (`validateStatus`). The error envelope is therefore read from `err.response.data` and typed as `components["schemas"]["Envelope"]`.

### Verified wrapper

This sketch type-checked with `tsc` (TS 6.0.3, strict, `noUncheckedIndexedAccess`) against the generated file. It is not app code. Implementation tickets decide the final file.

```ts
import axios from 'axios'
import type { components, paths } from './api.gen'

export type Envelope = components['schemas']['Envelope']
export type Code = components['schemas']['Code']

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'
type PathsWith<M extends Method> = {
  [P in keyof paths]: paths[P][M] extends object ? P : never
}[keyof paths]
type Op<P extends keyof paths, M extends Method> = Extract<paths[P][M], object>

type Json<T> = T extends { content: { 'application/json': infer B } } ? B : never
type SuccessStatus = 200 | 201 | 202 | 204
type OkBody<O> = O extends { responses: infer R }
  ? Json<R[Extract<keyof R, SuccessStatus>]>
  : never

export type Body<P extends keyof paths, M extends Method> =
  Op<P, M> extends { requestBody: infer B } ? Json<B> : never
export type Data<P extends keyof paths, M extends Method> = NonNullable<
  OkBody<Op<P, M>> extends { data?: infer D } ? D : never
>

type Params<O> = O extends { parameters: infer Ps }
  ? (Ps extends { path: infer X } ? { path: X } : { path?: never }) &
      (Ps extends { query?: infer Q } ? { query?: Q } : {})
  : {}
type Opts<P extends keyof paths, M extends Method> = Params<Op<P, M>> &
  ([Body<P, M>] extends [never] ? { body?: never } : { body: Body<P, M> })

export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL })

export async function api<M extends Method, P extends PathsWith<M>>(
  method: M,
  url: P,
  ...[opts]: {} extends Opts<P, M> ? [Opts<P, M>?] : [Opts<P, M>]
): Promise<Data<P, M>> {
  const o = (opts ?? {}) as { path?: Record<string, string>; query?: object; body?: unknown }
  const res = await http.request<OkBody<Op<P, M>>>({
    method,
    url: url.replace(/\{(\w+)\}/g, (_, k: string) => encodeURIComponent(o.path![k]!)),
    params: o.query,
    data: o.body,
  })
  return (res.data as { data: Data<P, M> }).data
}

export function apiCode(err: unknown): Code | undefined {
  return axios.isAxiosError<Envelope>(err) ? err.response?.data?.code : undefined
}
```

Type tests that passed (`Eq` assertions plus `@ts-expect-error`):

- `Body<'/api/v1/auth/login','post'>` is `{ username: string; password: string }`.
- `Data<'/api/v1/auth/me','get'>` is `User`. `Data<'/api/v1/users','get'>` is `User[]`.
- `api('post','/api/v1/auth/login',{ body })` returns `{ token; expires_at; user }`.
- `api('get','/api/v1/auth/me')` and `api('post','/api/v1/auth/logout')` need no options argument.
- `api('get','/api/v1/users',{ query: { status: 'pending', page: 2 } })` type-checks.
- Each of these is rejected: a missing login body, a wrong body field, `get` on the login path, missing `{username}` path params, and a bad `status` enum.

Notes:

- `baseURL` and the env var name are placeholders. With no CORS in levireg-core, the dev setup likely proxies `/api` through Vite. That decision belongs to another ticket.
- For an envelope-only success (`rejectUser`, `logout`), `Data` resolves to `{}`, because `NonNullable<unknown>` is `{}`. Callers ignore it.
- The `{ code, message, errors }` envelope on failures comes from `apiCode(err)` / `err.response.data`. This fits the map's `QueryCache`/`MutationCache` `onError` plan.

### Pitfall: TypeScript 7

`openapi-typescript@7.13.0` declares peer `typescript: ^5.x` and builds its output with the `ts.factory` JS API. On TypeScript 7.0.2 (native compiler, no JS API) it crashes: `TypeError: Cannot read properties of undefined (reading 'createKeywordTypeNode')`. On this repo's TypeScript 6.0.3 it works and only warns about an unmet peer. Do not bump `typescript` to 7 until openapi-typescript supports it, or the generator breaks. Verified locally.

## Where to read `openapi.yaml` from

Recommendation: the sibling path `../levireg-core/api/openapi.yaml`.

- The workspace `AGENTS.md` names `levireg-core/api/openapi.yaml` as the source of truth. A vendored copy is a third artifact (yaml, vendored yaml, generated TS) that can drift silently.
- The sibling checkout is the existing local layout. The script needs it only when regenerating, not to build, because the output is committed (see below).
- Cost: a fresh clone without levireg-core next to it cannot regenerate. That is acceptable, since regenerating is only needed after a contract change, and that means levireg-core is checked out anyway.
- Rejected: fetching the yaml from a GitHub raw URL. The CLI supports URLs, but it couples codegen to network access and, if the repo is private, to auth.

## Commit the generated file

Recommendation: yes. Commit `src/lib/api.gen.ts`.

- `pnpm build`, `tsc --noEmit` and CI then work without the sibling repo.
- Contract changes show up as reviewable diffs in this repo.
- This matches the existing convention: `src/routeTree.gen.ts` is generated and committed.
- Guard drift with `pnpm check-api` (`--check`), run locally or in CI wherever the sibling exists.
- The output is not Prettier-formatted (4-space indent). Add `src/lib/api.gen.ts` to `.prettierignore`, or `pnpm check` will flag it. The ESLint config may also need an ignore entry; check that when implementing.

## Sources

- openapi-typescript introduction: <https://openapi-ts.dev/introduction>
- openapi-typescript CLI flags: <https://openapi-ts.dev/cli>
- openapi-typescript examples (openapi-axios and others): <https://openapi-ts.dev/examples>
- openapi-typescript-helpers source: <https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript-helpers/src/index.ts>
- axios type definitions: <https://github.com/axios/axios/blob/v1.x/index.d.ts>
- Local verification: openapi-typescript 7.13.0, axios 1.21.0, TypeScript 6.0.3 and 7.0.2, run against `levireg-core/api/openapi.yaml`.
