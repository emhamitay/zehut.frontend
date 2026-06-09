import type { Alert, AlertKind, ConflictDetail, DataErrorType } from './api'
import { DATA_ERROR_TYPE_LABELS } from './alert-labels'

// Hebrew copy for the שגיאת נתונים (data error) UX. One place, one set of
// phrases — everywhere the user reads about a collision they read it
// through this module.

export const DATA_ERROR_HEADER = 'שגיאות נתונים'
export const DATA_ERROR_EMPTY = 'אין שגיאות נתונים פתוחות.'
export const EDIT_ACTION_LABEL = 'ערוך'
export const SAVE_MODAL_CLOSE_LABEL = 'הבנתי, אחזור לתיקון'

export type CollidingField = 'nationalId' | 'phone'

// Citizen-detail anchor for the data-errors section. CitizensSearch
// links to `#data-errors` when the user clicks a hit's badge.
export const DATA_ERROR_ANCHOR = 'data-errors'

export function fieldOfErrorType(errorType: DataErrorType): CollidingField {
  return errorType === 'id_data_error' ? 'nationalId' : 'phone'
}

export function describeOtherSide(other: { fullname: string | null }): string {
  return other.fullname?.trim() || 'אדם ללא שם'
}

// The "why" behind each alert kind, written for a non-technical
// coordinator. The goal is that the rule never reads as an arbitrary
// system quirk — the sentence explains the real-world reason the two
// records can't both be right.
const KIND_EXPLANATIONS: Record<AlertKind, string> = {
  name_mismatch_on_id:
    'לאותה תעודת זהות לא יכולים להיות שני שמות שונים — אחת מהרשומות שגויה.',
  name_phone_mismatch_on_id:
    'אותה תעודת זהות מופיעה עם שם וטלפון שונים — ככל הנראה אחת מהרשומות שגויה.',
  id_mismatch_name_phone_match:
    'שני אנשים בעלי תעודות זהות שונות חולקים את אותו מספר טלפון. מאחר ששני אנשים שונים לא אמורים להחזיק באותו מספר, סביר שאחד המספרים הוקלד בטעות.',
  id_name_mismatch_on_phone:
    'אותו מספר טלפון רשום אצל שני אנשים שונים (שם ותעודת זהות שונים). שני אנשים שונים לא אמורים לחלוק מספר טלפון — כנראה אחד המספרים שגוי.',
  cross_person_mismatch:
    'מספר הטלפון משויך כעת לאדם אחר. ייתכן שהמספר הוקלד בטעות או הועבר בין הרשומות.',
  phone_match_name_differs_no_id:
    'אותו מספר טלפון מופיע אצל שני אנשים עם שמות שונים — ככל הנראה אחד המספרים שגוי.',
}

export function dataErrorExplanation(kind: AlertKind): string {
  return KIND_EXPLANATIONS[kind]
}

// Kinds where the two records share a phone but carry *different*
// national IDs. For these we explicitly surface the other person's ID so
// the coordinator can see at a glance that these are two distinct people.
const DIFFERENT_ID_KINDS = new Set<AlertKind>([
  'id_mismatch_name_phone_match',
  'id_name_mismatch_on_phone',
])

export function otherIdNote(alert: Alert): string | null {
  if (!DIFFERENT_ID_KINDS.has(alert.kind)) return null
  const id = alert.relatedPerson?.nationalId
  return id ? `ת"ז שונה: ${id}` : 'בעל/ת תעודת זהות שונה'
}

function collidingValueOf(alert: Alert): string {
  if (alert.collidingValue) return alert.collidingValue
  const other = alert.relatedPerson
  if (!other) return '—'
  return (
    (alert.errorType === 'id_data_error' ? other.nationalId : other.phones[0]) ??
    '—'
  )
}

// Everything a DataErrorRow needs to render, derived once from the alert.
export type DataErrorParts = {
  label: string
  headline: string
  explanation: string
  otherName: string
  otherIdNote: string | null
}

export function describeDataError(alert: Alert): DataErrorParts {
  const otherName = describeOtherSide({
    fullname: alert.relatedPerson?.fullname ?? null,
  })
  const value = collidingValueOf(alert)
  const headline =
    alert.errorType === 'id_data_error'
      ? `תעודת זהות ${value} מופיעה גם אצל ${otherName}.`
      : `מספר טלפון ${value} מופיע גם אצל ${otherName}.`
  return {
    label: DATA_ERROR_TYPE_LABELS[alert.errorType],
    headline,
    explanation: dataErrorExplanation(alert.kind),
    otherName,
    otherIdNote: otherIdNote(alert),
  }
}

// ─── Save-collision modal (the 422 case) ─────────────────────────────────────

export function saveCollisionTitle(): string {
  return 'לא ניתן לשמור — נמצאה שגיאת נתונים'
}

export function saveCollisionLine(detail: ConflictDetail): string {
  const other = describeOtherSide({ fullname: detail.otherPerson.fullname })
  // Prefer the server-supplied collidingValue: that's the actual value
  // the user tried to save. Fall back only if the server didn't send it.
  if (isPhoneCollision(detail)) {
    const phone =
      detail.collidingValue ?? detail.otherPerson.phones[0] ?? 'הזה'
    return `מספר הטלפון ${phone} שייך כבר ל${other}.`
  }
  const id = detail.collidingValue ?? detail.otherPerson.nationalId ?? 'הזו'
  return `תעודת הזהות ${id} שייכת כבר ל${other}.`
}

export function saveCollisionExplanation(detail: ConflictDetail): string {
  return `${dataErrorExplanation(detail.kind)} אנא בדקו את הערך שהוקלד ותקנו אותו כדי לשמור.`
}

// The backend's AlertKind already classifies a conflict into "this is an
// ID issue" vs "this is a phone issue". Mirror that classification on
// the wire payload so the frontend never has to re-derive it.
function isPhoneCollision(detail: ConflictDetail): boolean {
  return (
    detail.kind !== 'name_mismatch_on_id' &&
    detail.kind !== 'name_phone_mismatch_on_id'
  )
}

// Used to focus / highlight the offending field after the user dismisses
// the save-collision modal.
export function fieldsToHighlight(detail: ConflictDetail): CollidingField[] {
  return isPhoneCollision(detail) ? ['phone'] : ['nationalId']
}

// ─── Inline-on-field note (citizen edit form) ────────────────────────────────

// What to show on the form's colliding field, inline next to the input.
// Uses the server-supplied `collidingValue` so the inline note points at
// the actual offending value, not a guess like `relatedPerson.phones[0]`.
export function inlineFieldNote(alert: Alert): string {
  const other = describeOtherSide({
    fullname: alert.relatedPerson?.fullname ?? null,
  })
  const value = collidingValueOf(alert)
  const idHint = otherIdNote(alert)
  const base =
    alert.errorType === 'id_data_error'
      ? `מתנגש עם ${other}: ${value}`
      : `מתנגש עם ${other}: ${value}`
  return idHint ? `${base} (${idHint})` : base
}
