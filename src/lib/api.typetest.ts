// Type-level tests for `api`, enforced by `pnpm exec tsc --noEmit`. Never imported or run.
import { api } from './api'
import type { components } from './api.gen'

type User = components['schemas']['User']
type Equal<TActual, TExpected> =
  (<T>() => T extends TActual ? 1 : 2) extends <T>() => T extends TExpected
    ? 1
    : 2
    ? true
    : false
const assert = <T extends true>(_?: T) => {}

export async function apiTypeTests() {
  const me = await api('get', '/api/v1/auth/me')
  assert<Equal<typeof me, User>>()

  const users = await api('get', '/api/v1/users', {
    query: { status: 'pending', page: 2 },
  })
  assert<Equal<typeof users, Array<User>>>()

  await api('post', '/api/v1/auth/login', {
    body: { username: 'u', password: 'p' },
  })
  await api('post', '/api/v1/users/{username}/approve', {
    path: { username: 'u' },
  })

  // @ts-expect-error wrong body
  await api('post', '/api/v1/auth/login', { body: { username: 'u' } })
  // @ts-expect-error missing body
  await api('post', '/api/v1/auth/login')
  // @ts-expect-error wrong method for path
  await api('get', '/api/v1/auth/login')
  // @ts-expect-error unknown path
  await api('get', '/api/v1/nope')
  // @ts-expect-error missing path param
  await api('post', '/api/v1/users/{username}/approve')
  // @ts-expect-error wrong path param name
  await api('post', '/api/v1/users/{username}/approve', { path: { id: 'u' } })
  // @ts-expect-error bad query enum
  await api('get', '/api/v1/users', { query: { status: 'banned' } })
  // @ts-expect-error body on a path without one
  await api('get', '/api/v1/auth/me', { body: { x: 1 } })
}
