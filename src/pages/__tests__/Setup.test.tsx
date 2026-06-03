import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthContext'
import Setup from '../Setup'
import { TOKEN_KEY } from '../../lib/api'

function mockFetch(routes: Record<string, (init?: RequestInit) => Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL | Request).toString()
    const path = new URL(url, 'http://localhost').pathname
    const method = (init as RequestInit | undefined)?.method ?? 'GET'
    const handler = routes[`${method} ${path}`] ?? routes[path]
    if (!handler) return new Response('not found', { status: 404 })
    return handler(init as RequestInit | undefined)
  })
}

function renderSetup() {
  return render(
    <MemoryRouter initialEntries={['/setup']}>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={<Setup />} />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Setup page', () => {
  it('shows form when setup is required', async () => {
    mockFetch({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: true }), { status: 200 }),
    })
    renderSetup()
    await waitFor(() => screen.getByLabelText(/שם משתמש/))
    expect(screen.getByLabelText(/סיסמה/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /צור/ })).toBeInTheDocument()
  })

  it('mentions the .env alternative on the page', async () => {
    mockFetch({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: true }), { status: 200 }),
    })
    renderSetup()
    await waitFor(() =>
      expect(screen.getByText(/BOOTSTRAP_ADMIN_USERNAME/)).toBeInTheDocument(),
    )
  })

  it('creates the first user, stores token, redirects to /', async () => {
    mockFetch({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: true }), { status: 200 }),
      'POST /api/auth/setup': () =>
        new Response(
          JSON.stringify({
            token: 'first-token',
            user: {
              id: 'u1',
              username: 'admin',
              createdAt: '2024-01-01T00:00:00Z',
            },
          }),
          { status: 200 },
        ),
    })

    renderSetup()
    await waitFor(() => screen.getByLabelText(/שם משתמש/))

    await userEvent.type(screen.getByLabelText(/שם משתמש/), 'admin')
    await userEvent.type(screen.getByLabelText(/סיסמה/), 'super-secret-1')
    await userEvent.click(screen.getByRole('button', { name: /צור/ }))

    await waitFor(() => expect(screen.getByText('home-page')).toBeInTheDocument())
    expect(localStorage.getItem(TOKEN_KEY)).toBe('first-token')
  })

  it('shows error and stays put when backend rejects setup', async () => {
    mockFetch({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: true }), { status: 200 }),
      'POST /api/auth/setup': () =>
        new Response(JSON.stringify({ error: 'setup_already_completed' }), {
          status: 403,
        }),
    })

    renderSetup()
    await waitFor(() => screen.getByLabelText(/שם משתמש/))

    await userEvent.type(screen.getByLabelText(/שם משתמש/), 'admin')
    await userEvent.type(screen.getByLabelText(/סיסמה/), 'super-secret-1')
    await userEvent.click(screen.getByRole('button', { name: /צור/ }))

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('redirects to / if setup is no longer required (already a user)', async () => {
    mockFetch({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      '/api/auth/me': () => new Response('{}', { status: 401 }),
    })
    renderSetup()
    await waitFor(() => expect(screen.getByText('home-page')).toBeInTheDocument())
  })
})
