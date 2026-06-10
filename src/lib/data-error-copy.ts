import type { Alert, ConflictDetail, DataErrorType } from './api'
import { DATA_ERROR_TYPE_LABELS } from './alert-labels'

// Hebrew copy for the שגיאת נתונים (data error) UX. One place, one set of
// phrases — everywhere the user reads about a collision they read it
// through this module.
//
// There are exactly two real situations: two citizens sharing a national
// ID, and two citizens sharing a phone. So there are exactly two
// messages, each naming BOTH people and stating the real-world reason.

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

// The one-line "what's wrong", naming both citizens. `self` is the person
// whose surface the message is rendered on; `other` is the citizen on the
// far side of the collision.
export function headline(
  self: string | null,
  other: string | null,
  value: string,
  errorType: DataErrorType,
): string {
  const a = describeOtherSide({ fullname: self })
  const b = describeOtherSide({ fullname: other })
  if (errorType === 'id_data_error') {
    return `אותה תעודת זהות (${value}) רשומה אצל ${a} ואצל ${b}.`
  }
  return `אותו מספר טלפון (${value}) רשום אצל ${a} ואצל ${b}.`
}

// The "why", one per error type.
const EXPLANATIONS: Record<DataErrorType, string> = {
  id_data_error:
    'לאדם אחד יש תעודת זהות אחת — סביר ששם אחד הוקלד בטעות. בדקו ותקנו.',
  phone_data_error:
    'שני אנשים שונים לא אמורים לחלוק מספר טלפון — סביר שאחד המספרים הוקלד בטעות. בדקו ותקנו.',
}

export function dataErrorExplanation(errorType: DataErrorType): string {
  return EXPLANATIONS[errorType]
}

// The "other side" of a data error: always a live citizen now (both rows
// of a collision exist as their own records).
export type OtherSide = {
  fullname: string | null
  nationalId: string | null
  phones: string[]
  personId: string | null
}

export function resolveOtherSide(alert: Alert): OtherSide {
  const rp = alert.relatedPerson
  return {
    fullname: rp?.fullname ?? null,
    nationalId: rp?.nationalId ?? null,
    phones: rp?.phones ?? [],
    personId: rp?.id ?? null,
  }
}

function collidingValueOf(alert: Alert): string {
  if (alert.collidingValue) return alert.collidingValue
  const other = resolveOtherSide(alert)
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
  other: OtherSide
  otherName: string
}

export function describeDataError(
  alert: Alert,
  selfPersonName: string | null,
): DataErrorParts {
  const other = resolveOtherSide(alert)
  const otherName = describeOtherSide({ fullname: other.fullname })
  const value = collidingValueOf(alert)
  return {
    label: DATA_ERROR_TYPE_LABELS[alert.errorType],
    headline: headline(selfPersonName, other.fullname, value, alert.errorType),
    explanation: dataErrorExplanation(alert.errorType),
    other,
    otherName,
  }
}

// ─── Save-collision modal (the 422 case) ─────────────────────────────────────

export function saveCollisionTitle(): string {
  return 'לא ניתן לשמור — נמצאה שגיאת נתונים'
}

export function saveCollisionLine(
  detail: ConflictDetail,
  selfPersonName: string | null,
): string {
  const errorType = errorTypeOf(detail)
  const value =
    detail.collidingValue ??
    (errorType === 'phone_data_error'
      ? detail.otherPerson.phones[0]
      : detail.otherPerson.nationalId) ??
    '—'
  return headline(selfPersonName, detail.otherPerson.fullname, value, errorType)
}

export function saveCollisionExplanation(detail: ConflictDetail): string {
  return `${dataErrorExplanation(errorTypeOf(detail))} אנא בדקו את הערך שהוקלד ותקנו אותו כדי לשמור.`
}

// The backend's AlertKind already classifies a conflict into "this is an
// ID issue" vs "this is a phone issue". Mirror that classification here.
function errorTypeOf(detail: ConflictDetail): DataErrorType {
  return detail.kind === 'name_mismatch_on_id' ||
    detail.kind === 'name_phone_mismatch_on_id'
    ? 'id_data_error'
    : 'phone_data_error'
}

// Used to focus / highlight the offending field after the user dismisses
// the save-collision modal.
export function fieldsToHighlight(detail: ConflictDetail): CollidingField[] {
  return errorTypeOf(detail) === 'phone_data_error' ? ['phone'] : ['nationalId']
}

// ─── Inline-on-field note (citizen edit form) ────────────────────────────────

// What to show on the form's colliding field, inline next to the input.
// Uses the server-supplied `collidingValue` so the inline note points at
// the actual offending value, not a guess like `relatedPerson.phones[0]`.
export function inlineFieldNote(alert: Alert): string {
  const side = resolveOtherSide(alert)
  const other = describeOtherSide({ fullname: side.fullname })
  const value = collidingValueOf(alert)
  return `מתנגש עם ${other}: ${value}`
}
