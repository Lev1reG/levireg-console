import axios from 'axios'
import type { components, paths } from './api.gen'

export type Envelope = components['schemas']['Envelope']
export type Code = components['schemas']['Code']

type Method = 'get' | 'post'
type ApiPath = Extract<keyof paths, `/api/v1/${string}`>

// Paths that define the method (unused methods are generated as `get?: never`)
type PathsWith<TMethod extends Method> = {
  [TPath in ApiPath]: paths[TPath] extends { [K in TMethod]: object }
    ? TPath
    : never
}[ApiPath]

type Op<TPath extends ApiPath, TMethod extends Method> = paths[TPath][TMethod]

type Success<TOp> = TOp extends { responses: infer R }
  ? R[Extract<keyof R, 200 | 201>]
  : never

type Data<TOp> =
  Success<TOp> extends { content: { 'application/json': { data?: infer D } } }
    ? NonNullable<D>
    : never

type Body<TOp> = TOp extends {
  requestBody: { content: { 'application/json': infer B } }
}
  ? { body: B }
  : { body?: never }

type Params<TOp> = TOp extends { parameters: infer TParams }
  ? (TParams extends { path: infer Pa } ? { path: Pa } : { path?: never }) &
      (TParams extends { query?: infer Q } ? { query?: Q } : { query?: never })
  : { path?: never; query?: never }

type Opts<TOp> = Body<TOp> & Params<TOp>

// opts is optional only when nothing in it is required
type OptsArg<TOp> =
  object extends Opts<TOp> ? [opts?: Opts<TOp>] : [opts: Opts<TOp>]

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  withCredentials: true,
})

export async function api<
  TMethod extends Method,
  TPath extends PathsWith<TMethod>,
>(
  method: TMethod,
  url: TPath,
  ...[opts]: OptsArg<Op<TPath, TMethod>>
): Promise<Data<Op<TPath, TMethod>>> {
  const { body, path, query } = (opts ?? {}) as {
    body?: unknown
    path?: Record<string, string | number>
    query?: Record<string, unknown>
  }
  const resolved = path
    ? url.replace(/\{(\w+)\}/g, (_, k: string) =>
        encodeURIComponent(String(path[k])),
      )
    : url
  const res = await client.request<Envelope>({
    method,
    url: resolved,
    data: body,
    params: query,
  })
  return res.data.data as Data<Op<TPath, TMethod>>
}

export function apiEnvelope(error: unknown): Envelope | undefined {
  return axios.isAxiosError<Envelope | undefined>(error)
    ? error.response?.data
    : undefined
}

export function apiCode(error: unknown): Code | undefined {
  return apiEnvelope(error)?.code
}
