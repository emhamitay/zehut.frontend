import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthContext'
import Login from '../Login'

function mockFetchByUrl(
  routes: Record<string, (init?: RequestInit) => Response>,
) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL | Request).toString()
    for (const [pattern, handler] of Object.entries(routes)) {
      if (url.endsWith(pattern)) return handler(init as RequestInit | undefined)
    }
    return new Response('not found', { status: 404 })
  })
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Login page', () => {
  it('shows error on bad credentials', async () => {
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      '/api/auth/me': () => new Response('{}', { status: 401 }),
      '/api/auth/login': () =>
        new Response(JSON.stringify({ error: 'invalid_credentials' }), {
          status: 401,
        }),
    })

    renderLogin()
    await waitFor(() => screen.getByLabelText(/שם משתמש/))

    await userEvent.type(screen.getByLabelText(/שם משתמש/), 'alice')
    await userEvent.type(screen.getByLabelText(/סיסמה/), 'wrong-pass')
    await userEvent.click(screen.getByRole('button', { name: /התחבר/ }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid|שגוי|שגיאה/i),
    )
  })

  it('redirects to / on success', async () => {
    mockFetchByUrl({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      '/api/auth/me': () => new Response('{}', { status: 401 }),
      '/api/auth/login': () =>
        new Response(
          JSON.stringify({
            token: 'tok',
            user: {
              id: 'u1',
              username: 'alice',
              createdAt: '2024-01-01T00:00:00Z',
            },
          }),
          { status: 200 },
        ),
    })

    renderLogin()
    await waitFor(() => screen.getByLabelText(/שם משתמש/))

    await userEvent.type(screen.getByLabelText(/שם משתמש/), 'alice')
    await userEvent.type(screen.getByLabelText(/סיסמה/), 'secret-123')
    await userEvent.click(screen.getByRole('button', { name: /התחבר/ }))

    await waitFor(() => expect(screen.getByText('home-page')).toBeInTheDocument())
  })
})
