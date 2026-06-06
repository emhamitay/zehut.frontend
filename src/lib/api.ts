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
  | 'name_match_no_id'
  | 'phone_match_name_differs_no_id'

export type MismatchedField = 'id' | 'name' | 'phone'

export type Alert = {
  id: string
  kind: AlertKind
  personId: string
  relatedPersonId: string | null
  details: {
    matchedOn: 'id' | 'name' | 'phone'
    mismatchedFields: MismatchedField[]
    incoming: Contact
  }
  sourceFile: string | null
  resolvedAt: string | null
  resolvedByUserId: string | null
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

// ─── Contact Pages (דפי קשר) ─────────────────────────────────────────────────

export type CrossPageWarning = {
  otherPersonId: string
  otherNationalId: string | null
  otherFullname: string | null
  otherPageId: string
  otherPageNumber: number
  otherCreatedByUsername: string
  alertKind: string
}

export type ContactPageEntry = {
  personId: string
  nationalId: string | null
  fullname: string | null
  phones: string[]
  pairGroupId: string | null
  crossPageWarnings: CrossPageWarning[]
}

export type ContactPage = {
  id: string
  season: string
  pageNumber: number
  createdByUserId: string
  createdAt: string
  entries: ContactPageEntry[]
}

export type ContactPageSummary = {
  id: string
  season: string
  pageNumber: number
  createdAt: string
}

export async function generateContactPage(): Promise<ContactPage> {
  const res = await apiFetch('/api/contact-pages', { method: 'POST' })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
    throw new Error(data.message ?? data.error ?? 'generate_failed')
  }
  return res.json()
}

export async function listContactPages(): Promise<ContactPageSummary[]> {
  const res = await apiFetch('/api/contact-pages')
  if (!res.ok) throw new Error('list_contact_pages_failed')
  return res.json()
}

export async function getContactPage(id: string): Promise<ContactPage> {
  const res = await apiFetch(`/api/contact-pages/${id}`)
  if (!res.ok) throw new Error('get_contact_page_failed')
  return res.json()
}

// ─── Citizens: search, detail, update, history, merge ────────────────────────

export type SearchBy = 'auto' | 'id' | 'phone' | 'name'

export type SearchHit = {
  person: PersonWithPhones
  openAlertCount: number
}

export type SearchResult = {
  resolvedBy: Exclude<SearchBy, 'auto'>
  hits: SearchHit[]
}

export type ConflictDetail = {
  kind: AlertKind
  otherPerson: {
    id: string
    nationalId: string | null
    fullname: string | null
    phones: string[]
  }
  mismatchedFields: MismatchedField[]
}

export type UpdatePersonInput = {
  nationalId?: string | null
  fullname?: string | null
  phones?: { add?: string[]; remove?: string[] }
  reason?: string | null
}

export type PersonAuditField =
  | 'nationalId'
  | 'fullname'
  | 'phone_added'
  | 'phone_removed'
  | 'merged_from'

export type PersonAuditRow = {
  id: string
  personId: string
  userId: string
  field: PersonAuditField
  oldValue: string | null
  newValue: string | null
  reason: string | null
  createdAt: string
}

export type PersonHistoryEntry = {
  id: string
  field: PersonAuditField
  oldValue: string | null
  newValue: string | null
  reason: string | null
  createdAt: string
  user: { id: string; username: string } | null
}

export type UpdatePersonResult =
  | {
      ok: true
      person: PersonWithPhones
      audit: PersonAuditRow[]
      resolvedAlerts: Alert[]
    }
  | { ok: false; conflicts: ConflictDetail[] }
  | { ok: false; notFound: true }

export type MergePersonsInput = {
  survivorId: string
  victimId: string
  resolved: {
    nationalId: string | null
    fullname: string | null
  }
  phonesToKeep: string[]
  reason: string
  confirmDifferentIds: boolean
}

export type MergePersonsResult =
  | { ok: true; person: PersonWithPhones; audit: PersonAuditRow[] }
  | {
      ok: false
      error: 'not_found' | 'confirm_required' | 'missing_reason' | 'same_person'
      reason?: string
    }

export async function searchPersons(
  query: string,
  by: SearchBy,
  myPagesOnly: boolean,
): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query, by, myPagesOnly: String(myPagesOnly) })
  const res = await apiFetch(`/api/persons/search?${params.toString()}`)
  if (!res.ok) throw new Error('search_failed')
  return res.json()
}

export async function getPerson(
  id: string,
): Promise<{ person: PersonWithPhones; openAlerts: Alert[] } | null> {
  const res = await apiFetch(`/api/persons/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('get_person_failed')
  return res.json()
}

export async function getPersonHistory(id: string): Promise<PersonHistoryEntry[]> {
  const res = await apiFetch(`/api/persons/${id}/history`)
  if (!res.ok) throw new Error('get_person_history_failed')
  return res.json()
}

export async function updatePerson(
  id: string,
  input: UpdatePersonInput,
): Promise<UpdatePersonResult> {
  const res = await apiFetch(`/api/persons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
  if (res.status === 404) return { ok: false, notFound: true }
  if (res.status === 409) return (await res.json()) as UpdatePersonResult
  if (!res.ok) throw new Error('update_person_failed')
  return (await res.json()) as UpdatePersonResult
}

export async function mergePersons(
  input: MergePersonsInput,
): Promise<MergePersonsResult> {
  const res = await apiFetch('/api/persons/merge', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  if (res.status === 404) return { ok: false, error: 'not_found' }
  if (res.status === 409) return (await res.json()) as MergePersonsResult
  if (!res.ok) throw new Error('merge_failed')
  return (await res.json()) as MergePersonsResult
}
