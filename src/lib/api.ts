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

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export async function extractContacts(
  payload:
    | { type: 'excel'; rows: Record<string, unknown>[] }
    | { type: 'docx'; text: string },
): Promise<Contact[]> {
  const res = await fetch(apiUrl('/api/extract'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('extract_failed')
  return res.json()
}

export async function commitContacts(
  contacts: Contact[],
  sourceFile: string | null,
): Promise<CommitResult> {
  const res = await fetch(apiUrl('/api/persons/commit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts, sourceFile }),
  })
  if (!res.ok) throw new Error('commit_failed')
  return res.json()
}
