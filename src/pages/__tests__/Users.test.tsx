import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthContext'
import Users from '../Users'
import { setToken } from '../../lib/api'

type Handler = (init?: RequestInit) => Response

function mockRoutes(routes: Record<string, Handler>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL | Request).toString()
    const method = (init as RequestInit | undefined)?.method ?? 'GET'
    const key = `${method} ${new URL(url, 'http://localhost').pathname}`
    const handler = routes[key] ?? routes[new URL(url, 'http://localhost').pathname]
    if (!handler) return new Response('not found', { status: 404 })
    return handler(init as RequestInit | undefined)
  })
}

function renderUsers() {
  setToken('valid')
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Users />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const meAlice: Handler = () =>
  new Response(
    JSON.stringify({
      id: 'u-alice',
      username: 'alice',
      createdAt: '2024-01-01T00:00:00Z',
    }),
    { status: 200 },
  )

describe('Users page', () => {
  it('renders the list of users', async () => {
    mockRoutes({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      'GET /api/auth/me': meAlice,
      'GET /api/users': () =>
        new Response(
          JSON.stringify([
            { id: 'u-alice', username: 'alice', createdAt: '2024-01-01T00:00:00Z' },
            { id: 'u-bob', username: 'bob', createdAt: '2024-01-02T00:00:00Z' },
          ]),
          { status: 200 },
        ),
    })

    renderUsers()
    const list = await waitFor(() => screen.getByTestId('users-list'))
    await waitFor(() =>
      expect(within(list).getByText('alice')).toBeInTheDocument(),
    )
    expect(within(list).getByText('bob')).toBeInTheDocument()
  })

  it('creates a new user', async () => {
    let listCalls = 0
    mockRoutes({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      'GET /api/auth/me': meAlice,
      'GET /api/users': () => {
        listCalls++
        const body =
          listCalls === 1
            ? [{ id: 'u-alice', username: 'alice', createdAt: 'x' }]
            : [
                { id: 'u-alice', username: 'alice', createdAt: 'x' },
                { id: 'u-bob', username: 'bob', createdAt: 'y' },
              ]
        return new Response(JSON.stringify(body), { status: 200 })
      },
      'POST /api/users': () =>
        new Response(
          JSON.stringify({ id: 'u-bob', username: 'bob', createdAt: 'y' }),
          { status: 200 },
        ),
    })

    renderUsers()
    const list = await waitFor(() => screen.getByTestId('users-list'))
    await waitFor(() =>
      expect(within(list).getByText('alice')).toBeInTheDocument(),
    )

    await userEvent.type(screen.getByLabelText(/שם משתמש/), 'bob')
    await userEvent.type(screen.getByLabelText(/סיסמה/), 'secret-123')
    await userEvent.click(screen.getByRole('button', { name: /הוסף/ }))

    await waitFor(() =>
      expect(within(list).getByText('bob')).toBeInTheDocument(),
    )
  })

  it('shows error when create fails', async () => {
    mockRoutes({
      '/api/auth/setup-required': () =>
        new Response(JSON.stringify({ required: false }), { status: 200 }),
      'GET /api/auth/me': meAlice,
      'GET /api/users': () =>
        new Response(
          JSON.stringify([
            { id: 'u-alice', username: 'alice', createdAt: 'x' },
          ]),
          { status: 200 },
        ),
      'POST /api/users': () =>
        new Response(
          JSON.stringify({ error: 'user already exists' }),
          { status: 400 },
        ),
    })

    renderUsers()
    const list = await waitFor(() => screen.getByTestId('users-list'))
    await waitFor(() =>
      expect(within(list).getByText('alice')).toBeInTheDocument(),
    )

    await userEvent.type(screen.getByLabelText(/שם משתמש/), 'alice')
    await userEvent.type(screen.getByLabelText(/סיסמה/), 'secret-123')
    await userEvent.click(screen.getByRole('button', { name: /הוסף/ }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i),
    )
  })
})
