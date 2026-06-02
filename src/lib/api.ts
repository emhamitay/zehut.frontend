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

export type CommitResult = {
  inserted: PersonWithPhones[]
  merged: { person: PersonWithPhones; mergedFrom: Contact }[]
  conflicts: {
    incoming: Contact
    matchedOn: 'phone'
    candidates: PersonWithPhones[]
  }[]
}

export type ResolveAction =
  | { action: 'merge'; targetPersonId: string; incoming: Contact }
  | { action: 'new'; incoming: Contact; sourceFile?: string | null }
  | { action: 'skip' }

const BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '')

export async function extractContacts(
  payload:
    | { type: 'excel'; rows: Record<string, unknown>[] }
    | { type: 'docx'; text: string }
): Promise<Contact[]> {
  const res = await fetch(`${BASE}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('extract_failed')
  return res.json()
}

export async function commitContacts(
  contacts: Contact[],
  sourceFile: string | null
): Promise<CommitResult> {
  const res = await fetch(`${BASE}/api/persons/commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts, sourceFile }),
  })
  if (!res.ok) throw new Error('commit_failed')
  return res.json()
}

export async function resolveConflict(
  action: ResolveAction
): Promise<{ person: PersonWithPhones | null }> {
  const res = await fetch(`${BASE}/api/persons/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action),
  })
  if (!res.ok) throw new Error('resolve_failed')
  return res.json()
}
