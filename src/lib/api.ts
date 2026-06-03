export type Contact = {
  id: string | null
  fullname: string | null
  phone: string[]
}

export type PersonWithPhones = {
  id: string
  nationalId: string | null
  fullname: string | null
  sourceFile: string | null
  createdAt: string
  updatedAt: string
  phones: string[]
}

export type AlertKind =
  | 'name_mismatch_on_id'
  | 'name_phone_mismatch_on_id'
  | 'id_mismatch_name_phone_match'
  | 'id_name_mismatch_on_phone'
  | 'cross_person_mismatch'

export type Alert = {
  id: string
  kind: AlertKind
  personId: string
  relatedPersonId: string | null
  details: {
    matchedOn: 'id' | 'name' | 'phone'
    mismatchedFields: ('id' | 'name' | 'phone')[]
    incoming: Contact
  }
  sourceFile: string | null
  resolvedAt: string | null
  createdAt: string
}

export type CommitResult = {
  inserted: PersonWithPhones[]
  ignored: number
  phoneAdded: { person: PersonWithPhones; addedPhones: string[] }[]
  alerts: Alert[]
}

export type AuthUser = {
  id: string
  username: string
  createdAt: string
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export const TOKEN_KEY = 'zehut.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(apiUrl(path), { ...init, headers })
  if (res.status === 401) clearToken()
  return res
}

export async function extractContacts(
  payload:
    | { type: 'excel'; rows: Record<string, unknown>[] }
    | { type: 'docx'; text: string },
): Promise<Contact[]> {
  const res = await apiFetch('/api/extract', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('extract_failed')
  return res.json()
}

export async function commitContacts(
  contacts: Contact[],
  sourceFile: string | null,
): Promise<CommitResult> {
  const res = await apiFetch('/api/persons/commit', {
    method: 'POST',
    body: JSON.stringify({ contacts, sourceFile }),
  })
  if (!res.ok) throw new Error('commit_failed')
  return res.json()
}

export async function fetchSetupRequired(): Promise<boolean> {
  const res = await apiFetch('/api/auth/setup-required')
  if (!res.ok) throw new Error('setup_check_failed')
  const data = (await res.json()) as { required: boolean }
  return data.required
}

export async function login(
  username: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'login_failed')
  }
  return res.json()
}

export async function setupFirstUser(
  username: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  const res = await apiFetch('/api/auth/setup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'setup_failed')
  }
  return res.json()
}

export async function fetchMe(): Promise<AuthUser | null> {
  const res = await apiFetch('/api/auth/me')
  if (res.status === 401) return null
  if (!res.ok) throw new Error('me_failed')
  return res.json()
}

export async function listUsers(): Promise<AuthUser[]> {
  const res = await apiFetch('/api/users')
  if (!res.ok) throw new Error('list_users_failed')
  return res.json()
}

export async function createUser(
  username: string,
  password: string,
): Promise<AuthUser> {
  const res = await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'create_user_failed')
  }
  return res.json()
}

export async function deleteUser(id: string): Promise<void> {
  const res = await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? 'delete_user_failed')
  }
}
