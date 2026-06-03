import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../AuthContext'
import ProtectedRoute from '../ProtectedRoute'
import { setToken } from '../../lib/api'

function mockFetchByUrl(
  routes: Record<string, (init?: RequestInit) => Response>,
) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input : (input as URL | Request).toString()
    for (const [pattern, handler] of Object.entries(routes)) {
      if (url.endsWith(pattern)) return handler()
    }
    return new Response('not found', { status: 404 })
  })
}

function renderAt(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={<div>setup-page</div>} />
          <Route path="/login" element={<div>login-page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>secret</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /setup when setup is required', async () => {
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: true }), { status: 200 }),
    })
    renderAt('/protected')
    await waitFor(() => expect(screen.getByText('setup-page')).toBeInTheDocument())
  })

  it('redirects to /login when not authenticated', async () => {
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      '/api/auth/me': () => new Response('{}', { status: 401 }),
    })
    renderAt('/protected')
    await waitFor(() => expect(screen.getByText('login-page')).toBeInTheDocument())
  })

  it('renders children when authenticated', async () => {
    setToken('valid')
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
    renderAt('/protected')
    await waitFor(() => expect(screen.getByText('secret')).toBeInTheDocument())
  })
})
