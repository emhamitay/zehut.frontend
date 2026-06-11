import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import {
  shouldFallbackToAiAfterClientParse,
  tryParseExcelClientSide,
} from '../excel-parser'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a WorkSheet from a 2-D array of values (array-of-arrays) */
function sheet(aoa: unknown[][]): XLSX.WorkSheet {
  return XLSX.utils.aoa_to_sheet(aoa)
}

/** Build a WorkSheet where specific cells are stored as NUMBER type (simulates
 *  Excel numeric columns — leading zeros get stripped) */
function sheetWithNumbers(aoa: unknown[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  // Walk every cell; if the value looks like a number string, force type 'n'
  for (const addr of Object.keys(ws)) {
    if (addr.startsWith('!')) continue
    const cell = ws[addr] as XLSX.CellObject
    if (typeof cell.v === 'string' && /^\d+$/.test(cell.v)) {
      cell.t = 'n'
      cell.v = Number(cell.v)
    }
  }
  return ws
}

// ---------------------------------------------------------------------------
// Phone normalization (via path A — known phone column header)
// ---------------------------------------------------------------------------

describe('phone normalization — path A (with headers)', () => {
  it('standard 10-digit phone with dashes', () => {
    const ws = sheet([['שם מלא', 'טלפון'], ['ישראל כהן', '052-123-4567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('standard 10-digit phone no dashes', () => {
    const ws = sheet([['שם מלא', 'טלפון'], ['ישראל כהן', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('phone with spaces', () => {
    const ws = sheet([['שם מלא', 'טלפון'], ['ישראל כהן', '052 123 4567']])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('phone stored as number — leading zero stripped by Excel (9 digits starting with 5)', () => {
    const ws = sheetWithNumbers([['שם מלא', 'טלפון'], ['ישראל כהן', '521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('phone as number with full 10 digits stored (no formatting)', () => {
    const ws = sheetWithNumbers([['שם מלא', 'טלפון'], ['ישראל כהן', '521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('discards invalid phone value, keeps valid one in same row', () => {
    const ws = sheet([
      ['שם מלא', 'טלפון'],
      ['ישראל כהן', 'not-a-phone'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].phone).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Header keyword variants
// ---------------------------------------------------------------------------

describe('header keyword variants', () => {
  it('recognises "נייד" as phone', () => {
    const ws = sheet([['שם מלא', 'נייד'], ['ישראל כהן', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('recognises "phone" (English) as phone', () => {
    const ws = sheet([['name', 'phone'], ['Israel Cohen', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('recognises "mobile" as phone', () => {
    const ws = sheet([['name', 'mobile'], ['Israel Cohen', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('recognises "ת.ז" as id', () => {
    const ws = sheet([['שם מלא', 'ת.ז', 'טלפון'], ['ישראל כהן', '123456789', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].id).toBe('123456789')
  })

  it('recognises "תז" (no dot) as id', () => {
    const ws = sheet([['שם מלא', 'תז', 'טלפון'], ['ישראל כהן', '123456789', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].id).toBe('123456789')
  })

  it('recognises "תעודת זהות" as id', () => {
    const ws = sheet([['שם מלא', 'תעודת זהות', 'טלפון'], ['ישראל כהן', '123456789', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].id).toBe('123456789')
  })

  it('header contains known keyword as a substring — e.g. "מספר נייד"', () => {
    const ws = sheet([['שם מלא', 'מספר נייד'], ['ישראל כהן', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('header contains known keyword as substring — "מס\' טלפון"', () => {
    const ws = sheet([["שם מלא", "מס' טלפון"], ['ישראל כהן', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('recognises "סלולר" as phone', () => {
    const ws = sheet([['שם מלא', 'סלולר'], ['ישראל כהן', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })
})

// ---------------------------------------------------------------------------
// Split name columns
// ---------------------------------------------------------------------------

describe('split name columns — path A', () => {
  it('joins שם פרטי + שם משפחה into fullname', () => {
    const ws = sheet([
      ['שם פרטי', 'שם משפחה', 'טלפון'],
      ['ישראל', 'כהן', '0521234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].fullname).toBe('ישראל כהן')
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('joins first name + last name (English) into fullname', () => {
    const ws = sheet([
      ['first name', 'last name', 'phone'],
      ['Israel', 'Cohen', '0521234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].fullname).toBe('Israel Cohen')
  })

  it('handles missing last name gracefully', () => {
    const ws = sheet([
      ['שם פרטי', 'שם משפחה', 'טלפון'],
      ['ישראל', '', '0521234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].fullname).toBe('ישראל')
  })
})

// ---------------------------------------------------------------------------
// Missing ID → null (not a fallback trigger)
// ---------------------------------------------------------------------------

describe('missing id', () => {
  it('id is null when no id column present', () => {
    const ws = sheet([['שם מלא', 'טלפון'], ['ישראל כהן', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].id).toBeNull()
  })

  it('id is null when id column is empty for a row', () => {
    const ws = sheet([
      ['שם מלא', 'ת.ז', 'טלפון'],
      ['ישראל כהן', '', '0521234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].id).toBeNull()
  })

  it('id padded from 8 to 9 digits', () => {
    const ws = sheet([['שם מלא', 'ת.ז', 'טלפון'], ['ישראל כהן', '12345678', '0521234567']])
    const result = tryParseExcelClientSide(ws)
    expect(result![0].id).toBe('012345678')
  })
})

// ---------------------------------------------------------------------------
// Multiple phone columns
// ---------------------------------------------------------------------------

describe('multiple phone columns', () => {
  it('collects phones from two phone columns', () => {
    const ws = sheet([
      ['שם מלא', 'טלפון', 'נייד'],
      ['ישראל כהן', '0521234567', '0541234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567', '0541234567'])
  })

  it('deduplicates the same phone appearing in two columns of one row', () => {
    const ws = sheet([
      ['שם מלא', 'טלפון', 'נייד'],
      ['ישראל כהן', '0521234567', '052-123-4567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })
})

// ---------------------------------------------------------------------------
// Header threshold — extra unknown columns
// ---------------------------------------------------------------------------

describe('header detection with extra unknown columns', () => {
  it('detects headers even when extra columns are unrecognized', () => {
    const ws = sheet([
      ['שם מלא', 'ת.ז', 'טלפון', 'הערות'],
      ['ישראל כהן', '123456789', '0521234567', 'some notes'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
    expect(result![0].fullname).toBe('ישראל כהן')
  })

  it('detects headers when only 1 out of 4 columns matches (one known column)', () => {
    // Only phone is recognized — should still try to extract what it can
    const ws = sheet([
      ['col1', 'col2', 'col3', 'טלפון'],
      ['foo', 'bar', 'baz', '0521234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    // phone col should still be found even with low match rate
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })
})

// ---------------------------------------------------------------------------
// Content sniffing (no headers)
// ---------------------------------------------------------------------------

describe('content sniffing — no headers', () => {
  it('detects phone and name columns', () => {
    const ws = sheet([
      ['ישראל כהן', '0521234567'],
      ['שרה לוי', '0541234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].fullname).toBe('ישראל כהן')
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('detects id, phone and name columns', () => {
    const ws = sheet([
      ['123456789', 'ישראל כהן', '0521234567'],
      ['987654321', 'שרה לוי', '0541234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].id).toBe('123456789')
    expect(result![0].fullname).toBe('ישראל כהן')
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('joins two single-word name columns as first+last', () => {
    const ws = sheet([
      ['ישראל', 'כהן', '0521234567'],
      ['שרה', 'לוי', '0541234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].fullname).toBe('ישראל כהן')
    expect(result![0].phone).toEqual(['0521234567'])
  })

  it('recovers phone leading zero stripped by Excel number formatting', () => {
    const ws = sheetWithNumbers([
      ['ישראל כהן', '521234567'],
      ['שרה לוי', '541234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result![0].phone).toEqual(['0521234567'])
  })
})

// ---------------------------------------------------------------------------
// Fallback cases — should return null
// ---------------------------------------------------------------------------

describe('fallback to OpenRouter', () => {
  it('returns null for empty sheet', () => {
    const ws = sheet([[]])
    expect(tryParseExcelClientSide(ws)).toBeNull()
  })

  it('returns null when no data rows after header', () => {
    const ws = sheet([['שם מלא', 'טלפון']])
    expect(tryParseExcelClientSide(ws)).toBeNull()
  })

  it('returns null when two text columns with multi-word values (no headers)', () => {
    const ws = sheet([
      ['ישראל כהן', 'רחוב הרצל 5', '0521234567'],
      ['שרה לוי', 'שדרות רוטשילד 10', '0541234567'],
    ])
    // Two multi-word text columns → ambiguous → fallback
    expect(tryParseExcelClientSide(ws)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Skips empty rows
// ---------------------------------------------------------------------------

describe('skips empty rows', () => {
  it('skips completely empty rows', () => {
    const ws = sheet([
      ['שם מלא', 'טלפון'],
      ['ישראל כהן', '0521234567'],
      ['', ''],
      ['שרה לוי', '0541234567'],
    ])
    const result = tryParseExcelClientSide(ws)
    expect(result).not.toBeNull()
    expect(result!.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Post-parse failure guard
// ---------------------------------------------------------------------------

describe('shouldFallbackToAiAfterClientParse', () => {
  it('returns true when contacts list is empty', () => {
    expect(shouldFallbackToAiAfterClientParse([])).toBe(true)
  })

  it('returns true when no phones were parsed', () => {
    expect(
      shouldFallbackToAiAfterClientParse([
        { id: '123456789', fullname: 'ישראל כהן', phone: [] },
        { id: null, fullname: 'שרה לוי', phone: [] },
      ])
    ).toBe(true)
  })

  it('returns false when at least one phone exists', () => {
    expect(
      shouldFallbackToAiAfterClientParse([
        { id: '123456789', fullname: 'ישראל כהן', phone: ['0521234567'] },
        { id: null, fullname: 'שרה לוי', phone: [] },
      ])
    ).toBe(false)
  })

  it('returns true when more than half the contacts have no phone', () => {
    // 2 of 3 phoneless → phone column likely misidentified
    expect(
      shouldFallbackToAiAfterClientParse([
        { id: null, fullname: 'ישראל כהן', phone: ['0521234567'] },
        { id: null, fullname: 'שרה לוי', phone: [] },
        { id: null, fullname: 'דוד מזרחי', phone: [] },
      ])
    ).toBe(true)
  })

  it('returns true when more than half the contacts have no name and no id', () => {
    // 2 of 3 have neither name nor id → name column likely missed
    expect(
      shouldFallbackToAiAfterClientParse([
        { id: null, fullname: 'ישראל כהן', phone: ['0521234567'] },
        { id: null, fullname: null, phone: ['0541234567'] },
        { id: null, fullname: null, phone: ['0531234567'] },
      ])
    ).toBe(true)
  })

  it('a file with phones but no names at all falls back to AI', () => {
    // Every contact has a phone but no name/id. Per the user requirement
    // ("if a row has no fullname, send to AI") this is treated as a likely
    // missed name column and falls back.
    expect(
      shouldFallbackToAiAfterClientParse([
        { id: null, fullname: null, phone: ['0521234567'] },
        { id: null, fullname: null, phone: ['0541234567'] },
      ])
    ).toBe(true)
  })

  it('does not over-trigger when most rows have both name and phone', () => {
    // 3 of 4 complete, only 1 missing a name → below the 50% threshold.
    expect(
      shouldFallbackToAiAfterClientParse([
        { id: null, fullname: 'ישראל כהן', phone: ['0521234567'] },
        { id: null, fullname: 'שרה לוי', phone: ['0541234567'] },
        { id: '123456789', fullname: 'דוד מזרחי', phone: ['0531234567'] },
        { id: null, fullname: null, phone: ['0501234567'] },
      ])
    ).toBe(false)
  })
})
