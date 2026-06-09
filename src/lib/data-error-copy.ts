import type { Alert, ConflictDetail, DataErrorType } from './api'

// Hebrew copy for the new שגיאת נתונים (data error) UX. One place,
// one set of phrases — everywhere the user reads about a collision
// they read it through this module.

export const DATA_ERROR_HEADER = 'שגיאות נתונים'
export const DATA_ERROR_EMPTY = 'אין שגיאות נתונים פתוחות.'
export const EDIT_ACTION_LABEL = 'ערוך'
export const SAVE_MODAL_CLOSE_LABEL = 'סגור'

export type CollidingField = 'nationalId' | 'phone'

export function fieldOfErrorType(errorType: DataErrorType): CollidingField {
  return errorType === 'id_data_error' ? 'nationalId' : 'phone'
}

export function describeOtherSide(other: { fullname: string | null }): string {
  return other.fullname?.trim() || 'אדם ללא שם'
}

// Row body — what appears on every surface (citizen detail, upload
// summary, contact sheet) for a single open data error.
export function rowMessage(args: {
  errorType: DataErrorType
  collidingValue: string
  otherFullname: string | null
}): string {
  const other = describeOtherSide({ fullname: args.otherFullname })
  return args.errorType === 'id_data_error'
    ? `תעודת זהות ${args.collidingValue} מופיעה גם אצל ${other}.`
    : `מספר טלפון ${args.collidingValue} מופיע גם אצל ${other}.`
}

// The friendly modal copy when a save is blocked because the new value
// collides with another record somewhere in the DB.
export function saveCollisionTitle(): string {
  return 'לא ניתן לשמור'
}

export function saveCollisionLine(detail: ConflictDetail): string {
  const other = describeOtherSide({ fullname: detail.otherPerson.fullname })
  // Prefer the server-supplied collidingValue: that's the actual value
  // the user tried to save. Fall back only if the server didn't send it.
  if (isPhoneCollision(detail)) {
    const phone =
      detail.collidingValue ?? detail.otherPerson.phones[0] ?? 'הזה'
    return `מספר הטלפון ${phone} שייך כבר ל${other}. אנא בדקו את המספר שהוקלד ונסו שנית.`
  }
  const id =
    detail.collidingValue ?? detail.otherPerson.nationalId ?? 'הזו'
  return `תעודת הזהות ${id} שייכת כבר ל${other}. אנא בדקו את המספר שהוקלד ונסו שנית.`
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

// Used to focus / amber-underline the offending field after the user
// dismisses the save-collision modal.
export function fieldsToHighlight(detail: ConflictDetail): CollidingField[] {
  return isPhoneCollision(detail) ? ['phone'] : ['nationalId']
}

// Citizen-detail anchor for the data-errors section. CitizensSearch
// links to `#data-errors` when the user clicks a hit's badge.
export const DATA_ERROR_ANCHOR = 'data-errors'

// What to show on the form's colliding field, inline next to the input.
// Uses the server-supplied `collidingValue` so the inline note points
// at the actual offending value, not a guess like `relatedPerson.phones[0]`.
export function inlineFieldNote(alert: Alert): string {
  const other = describeOtherSide({
    fullname: alert.relatedPerson?.fullname ?? null,
  })
  if (alert.errorType === 'id_data_error') {
    const id =
      alert.collidingValue ?? alert.relatedPerson?.nationalId ?? '—'
    return `מתנגש עם ${other}: ${id}`
  }
  const phone =
    alert.collidingValue ?? alert.relatedPerson?.phones[0] ?? '—'
  return `מתנגש עם ${other}: ${phone}`
}
