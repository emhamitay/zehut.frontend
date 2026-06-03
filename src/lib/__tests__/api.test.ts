import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, getToken, setToken, clearToken, TOKEN_KEY } from '../api'

describe('token storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('getToken returns null when empty', () => {
    expect(getToken()).toBeNull()
  })

  it('setToken stores under TOKEN_KEY and getToken reads it', () => {
    setToken('abc.def.ghi')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc.def.ghi')
    expect(getToken()).toBe('abc.def.ghi')
  })

  it('clearToken removes it', () => {
    setToken('x')
    clearToken()
    expect(getToken()).toBeNull()
  })
})

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('attaches Authorization header when token is present', async () => {
    setToken('my-token')
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))

    await apiFetch('/api/foo')

    const call = fetchSpy.mock.calls[0]
    const init = call[1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBe('Bearer my-token')
  })

  it('does not attach Authorization when no token', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))

    await apiFetch('/api/foo')

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('Authorization')).toBeNull()
  })

  it('clears token on 401 response', async () => {
    setToken('stale')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{"error":"unauthorized"}', { status: 401 }),
    )

    const res = await apiFetch('/api/foo')

    expect(res.status).toBe(401)
    expect(getToken()).toBeNull()
  })

  it('sets Content-Type for JSON body', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))

    await apiFetch('/api/foo', {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
    })

    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })
})
