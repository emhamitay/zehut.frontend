import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { setToken, TOKEN_KEY } from '../../lib/api'

function Probe() {
  const { user, loading, setupRequired, login, logout } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading ? 'yes' : 'no'}</div>
      <div data-testid="setup">{setupRequired ? 'yes' : 'no'}</div>
      <div data-testid="user">{user?.username ?? ''}</div>
      <button onClick={() => login('alice', 'pass-123-xyz')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  )
}

function mockFetchByUrl(routes: Record<string, (init?: RequestInit) => Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL | Request).toString()
    for (const [pattern, handler] of Object.entries(routes)) {
      if (url.endsWith(pattern)) return handler(init as RequestInit | undefined)
    }
    return new Response('not found', { status: 404 })
  })
}

beforeEach(() => {
  localStorage.clear()
})

describe('AuthProvider', () => {
  it('loads setup-required on mount when no token', async () => {
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: true }), { status: 200 }),
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'))
    expect(screen.getByTestId('setup').textContent).toBe('yes')
    expect(screen.getByTestId('user').textContent).toBe('')
  })

  it('fetches /api/auth/me when token present and sets user', async () => {
    setToken('valid-token')
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      '/api/auth/me': () =>
        new Response(
          JSON.stringify({
            id: 'u1',
            username: 'alice',
            createdAt: '2024-01-01T00:00:00Z',
          }),
          { status: 200 },
        ),
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'))
    expect(screen.getByTestId('setup').textContent).toBe('no')
  })

  it('clears token when /api/auth/me returns 401', async () => {
    setToken('stale')
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      '/api/auth/me': () =>
        new Response('{"error":"unauthorized"}', { status: 401 }),
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'))
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.getByTestId('user').textContent).toBe('')
  })

  it('login stores token and sets user', async () => {
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      '/api/auth/me': () =>
        new Response('{"error":"unauthorized"}', { status: 401 }),
      '/api/auth/login': () =>
        new Response(
          JSON.stringify({
            token: 'new-token',
            user: {
              id: 'u1',
              username: 'alice',
              createdAt: '2024-01-01T00:00:00Z',
            },
          }),
          { status: 200 },
        ),
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('no'))

    await act(async () => {
      screen.getByText('login').click()
    })

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'))
    expect(localStorage.getItem(TOKEN_KEY)).toBe('new-token')
  })

  it('logout clears token and user', async () => {
    setToken('t')
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      '/api/auth/me': () =>
        new Response(
          JSON.stringify({
            id: 'u1',
            username: 'alice',
            createdAt: '2024-01-01T00:00:00Z',
          }),
          { status: 200 },
        ),
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('alice'))

    await act(async () => {
      screen.getByText('logout').click()
    })

    expect(screen.getByTestId('user').textContent).toBe('')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
