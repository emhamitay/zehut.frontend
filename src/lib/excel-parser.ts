import * as XLSX from 'xlsx'
import type { Contact } from '@/lib/api'

// ---------------------------------------------------------------------------
// Keyword tables
// ---------------------------------------------------------------------------

const FULLNAME_KEYWORDS = ['שם', 'שם מלא', 'fullname', 'name', 'שם מלא פרטי']
const FIRSTNAME_KEYWORDS = ['שם פרטי', 'פרטי', 'first name', 'firstname', 'fname']
const LASTNAME_KEYWORDS = ['שם משפחה', 'משפחה', 'last name', 'lastname', 'lname']
const ID_KEYWORDS = [
  'תז', 'ת.ז', 'ת״ז', 'תעודת זהות', 'id', 'מזהה', 'tz', 'מספר זהות',
]
const PHONE_KEYWORDS = [
  'טלפון', 'נייד', 'phone', 'mobile', 'cell', 'פלאפון', 'tel', 'טל',
]

type ColumnRole = 'fullname' | 'firstname' | 'lastname' | 'id' | 'phone' | 'unknown'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Lowercase, trim, strip dots / quotation marks / colons */
function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.\u05f4\u05f3"':]/g, '') // strip dots, Hebrew geresh/gershayim, quotes, colons
    .replace(/\s+/g, ' ')
}

// Minimum chars a keyword must have to be used in substring (contains) matching.
// Prevents short keys like "id", "tz", "טל" from causing false positives.
const MIN_CONTAINS_LEN = 3

/**
 * Detects the role of a header cell.
 * First tries exact match, then falls back to substring/contains matching
 * to handle compound headers like "מספר נייד" or "מס' טלפון".
 * More specific keyword lists are checked before more generic ones.
 */
function detectRole(cell: string): ColumnRole {
  const n = normalizeKey(cell)

  // Exact match — most specific first
  if (FIRSTNAME_KEYWORDS.some(k => normalizeKey(k) === n)) return 'firstname'
  if (LASTNAME_KEYWORDS.some(k => normalizeKey(k) === n)) return 'lastname'
  if (FULLNAME_KEYWORDS.some(k => normalizeKey(k) === n)) return 'fullname'
  if (ID_KEYWORDS.some(k => normalizeKey(k) === n)) return 'id'
  if (PHONE_KEYWORDS.some(k => normalizeKey(k) === n)) return 'phone'

  // Contains match — for headers like "מספר נייד", "מס' טלפון"
  const contains = (kw: string[]) =>
    kw.some(k => { const nk = normalizeKey(k); return nk.length >= MIN_CONTAINS_LEN && n.includes(nk) })
  if (contains(FIRSTNAME_KEYWORDS)) return 'firstname'
  if (contains(LASTNAME_KEYWORDS)) return 'lastname'
  if (contains(FULLNAME_KEYWORDS)) return 'fullname'
  if (contains(ID_KEYWORDS)) return 'id'
  if (contains(PHONE_KEYWORDS)) return 'phone'

  return 'unknown'
}

/** Strip formatting chars then validate Israeli mobile number */
function normalizePhone(raw: string): string | null {
  let s = raw.replace(/[\s\-.()\u00a0]/g, '')
  // Excel may strip leading zero from number-formatted cells: 521234567 → 0521234567
  if (/^5\d{8}$/.test(s)) s = '0' + s
  if (/^05\d{8}$/.test(s)) return s
  return null
}

/** Returns 9-digit string or null */
function normalizeId(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, '')
  if (/^\d{9}$/.test(s)) return s
  // Leading zero may have been stripped by Excel number formatting
  if (/^\d{8}$/.test(s)) return '0' + s
  return null
}

function isLikelyHeaderRow(row: string[]): boolean {
  const nonEmpty = row.filter(c => c.trim() !== '')
  if (nonEmpty.length === 0) return false

  // Need at least one cell that matches a known keyword
  const matchedCount = nonEmpty.filter(c => detectRole(c) !== 'unknown').length
  if (matchedCount === 0) return false

  // If any cell in this row looks like real data (a valid phone or an 8-9 digit ID)
  // then it's a data row, not a header row
  const hasDataValues = nonEmpty.some(c => {
    const stripped = c.replace(/[\s-]/g, '')
    return /^05\d{8}$/.test(stripped) || /^5\d{8}$/.test(stripped) || /^\d{8,9}$/.test(stripped)
  })
  return !hasDataValues
}

function containsLetters(val: string): boolean {
  return /[a-zA-Z\u0590-\u05FF]/.test(val)
}

function isSingleWord(val: string): boolean {
  return val.trim().split(/\s+/).length === 1
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Converts any cell value returned by sheet_to_json (raw:true) to a plain string.
 * Using raw:true avoids SSF number formatting which can add commas / scientific notation.
 */
function cellValToStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)   // e.g. 521234567 → "521234567", no locale fmt
  return String(v)
}

/**
 * Attempts to parse an Excel sheet into Contact[] entirely on the client.
 * Returns null if the structure is too ambiguous — caller should fall back
 * to the server-side (OpenRouter) extraction.
 */
export function tryParseExcelClientSide(sheet: XLSX.WorkSheet): Contact[] | null {
  // raw:true — get native JS values (numbers stay numbers, text stays text).
  // We convert to strings ourselves via cellValToStr so we're not at the mercy
  // of SSF formatting (which can produce "521,234,567" or scientific notation).
  const rawRowsNative = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: '',
  })
  const rawRows: string[][] = rawRowsNative.map(row => row.map(cellValToStr))

  if (rawRows.length < 1) return null

  const hasHeaders = isLikelyHeaderRow(rawRows[0])
  const headerRow = hasHeaders ? rawRows[0] : null
  const dataRows = hasHeaders ? rawRows.slice(1) : rawRows

  if (dataRows.length === 0) return null

  // -------------------------------------------------------------------------
  // Path A: headers present
  // -------------------------------------------------------------------------
  if (headerRow) {
    const roles: ColumnRole[] = headerRow.map(cell => detectRole(cell))

    const fullnameCols = roles.flatMap((r, i) => r === 'fullname' ? [i] : [])
    const firstnameCols = roles.flatMap((r, i) => r === 'firstname' ? [i] : [])
    const lastnameCols = roles.flatMap((r, i) => r === 'lastname' ? [i] : [])
    const idCols = roles.flatMap((r, i) => r === 'id' ? [i] : [])
    const phoneCols = roles.flatMap((r, i) => r === 'phone' ? [i] : [])

    const hasAny =
      fullnameCols.length > 0 ||
      firstnameCols.length > 0 ||
      lastnameCols.length > 0 ||
      phoneCols.length > 0 ||
      idCols.length > 0

    if (!hasAny) return null

    return dataRows
      .map(row => {
        // Fullname: prefer dedicated column, then join first+last
        let fullname: string | null = null
        if (fullnameCols.length > 0) {
          fullname = (row[fullnameCols[0]] ?? '').trim() || null
        } else if (firstnameCols.length > 0 || lastnameCols.length > 0) {
          const first = firstnameCols.length > 0 ? (row[firstnameCols[0]] ?? '').trim() : ''
          const last = lastnameCols.length > 0 ? (row[lastnameCols[0]] ?? '').trim() : ''
          fullname = [first, last].filter(Boolean).join(' ') || null
        }

        // ID
        let id: string | null = null
        if (idCols.length > 0) {
          const raw = (row[idCols[0]] ?? '').trim()
          id = raw ? normalizeId(raw) : null
        }

        // Phones — collect from all phone columns
        const phone: string[] = []
        for (const ci of phoneCols) {
          const raw = (row[ci] ?? '').trim()
          if (raw) {
            const p = normalizePhone(raw)
            if (p) phone.push(p)
          }
        }

        return { id, fullname, phone }
      })
      .filter(c => c.fullname !== null || c.id !== null || c.phone.length > 0)
  }

  // -------------------------------------------------------------------------
  // Path B: no headers — content sniffing
  // -------------------------------------------------------------------------
  const colCount = Math.max(...rawRows.map(r => r.length), 0)
  if (colCount === 0) return null

  // Collect non-empty values per column
  const colValues: string[][] = Array.from({ length: colCount }, () => [])
  for (const row of dataRows) {
    for (let ci = 0; ci < colCount; ci++) {
      const val = (row[ci] ?? '').trim()
      if (val) colValues[ci].push(val)
    }
  }

  // Score each column
  type Scores = { phone: number; id: number; name: number }
  const scores: Scores[] = Array.from({ length: colCount }, () => ({
    phone: 0,
    id: 0,
    name: 0,
  }))

  for (let ci = 0; ci < colCount; ci++) {
    for (const val of colValues[ci]) {
      if (normalizePhone(val) !== null) {
        scores[ci].phone += 2
        continue
      }
      const stripped = val.replace(/[\s-]/g, '')
      if (/^\d{9}$/.test(stripped)) { scores[ci].id += 2; continue }
      if (/^\d{8}$/.test(stripped)) { scores[ci].id += 1; continue }
      if (containsLetters(val)) {
        scores[ci].name += 1
      }
    }
    // Bonus: all single-word values in this column → more likely a name fragment
    if (colValues[ci].length > 0 && colValues[ci].every(isSingleWord)) {
      scores[ci].name += 1
    }
  }

  // Assign a dominant role to each column
  const assignedRoles: ('phone' | 'id' | 'name' | 'unknown')[] = scores.map(s => {
    const max = Math.max(s.phone, s.id, s.name)
    if (max === 0) return 'unknown'
    if (s.phone >= s.id && s.phone >= s.name) return 'phone'
    if (s.id >= s.name) return 'id'
    return 'name'
  })

  const nameCols = assignedRoles.flatMap((r, i) => r === 'name' ? [i] : [])
  const sniffPhoneCols = assignedRoles.flatMap((r, i) => r === 'phone' ? [i] : [])
  const sniffIdCols = assignedRoles.flatMap((r, i) => r === 'id' ? [i] : [])

  // 2+ name columns where any has multi-word values → can't distinguish name
  // from address / notes → fall back to OpenRouter
  if (nameCols.length >= 2) {
    const hasMultiWord = nameCols.some(ci =>
      colValues[ci].some(v => !isSingleWord(v))
    )
    if (hasMultiWord) return null
    // Both are single-word columns → treat as first + last name
  }

  if (nameCols.length === 0 && sniffPhoneCols.length === 0 && sniffIdCols.length === 0) {
    return null
  }

  const firstNameColIndex = nameCols[0] ?? -1
  const lastNameColIndex = nameCols.length >= 2 ? nameCols[1] : -1

  return dataRows
    .map(row => {
      let fullname: string | null = null
      if (firstNameColIndex >= 0 && lastNameColIndex >= 0) {
        const first = (row[firstNameColIndex] ?? '').trim()
        const last = (row[lastNameColIndex] ?? '').trim()
        fullname = [first, last].filter(Boolean).join(' ') || null
      } else if (firstNameColIndex >= 0) {
        fullname = (row[firstNameColIndex] ?? '').trim() || null
      }

      let id: string | null = null
      if (sniffIdCols.length > 0) {
        const raw = (row[sniffIdCols[0]] ?? '').trim()
        id = raw ? normalizeId(raw) : null
      }

      const phone: string[] = []
      for (const ci of sniffPhoneCols) {
        const raw = (row[ci] ?? '').trim()
        if (raw) {
          const p = normalizePhone(raw)
          if (p) phone.push(p)
        }
      }

      return { id, fullname, phone }
    })
    .filter(c => c.fullname !== null || c.id !== null || c.phone.length > 0)
}

/**
 * Decides whether to fall back to AI even after client-side parsing succeeded.
 * This is a safety net for suspicious outputs (for example: contacts parsed but
 * no phone values at all).
 */
export function shouldFallbackToAiAfterClientParse(contacts: Contact[]): boolean {
  if (contacts.length === 0) return true

  const totalPhones = contacts.reduce((sum, c) => sum + c.phone.length, 0)
  if (totalPhones === 0) return true

  return false
}

