import type { AlertKind, DataErrorType } from './api'

// Two user-facing error types replace the seven internal AlertKinds.
// Everywhere in the UI we say "שגיאת נתונים" — a data error — and the
// type tells the citizen which field needs fixing.
export const DATA_ERROR_TYPE_LABELS: Record<DataErrorType, string> = {
  id_data_error: 'שגיאת תעודת זהות',
  phone_data_error: 'שגיאת טלפון',
}

export const DATA_ERROR_TYPE_DESCRIPTIONS: Record<DataErrorType, string> = {
  id_data_error:
    'תעודת זהות זהה מופיעה אצל שני אנשים שונים. אחת מהן שגויה — יש לערוך ולתקן.',
  phone_data_error:
    'מספר טלפון זהה מופיע אצל שני אנשים שונים. אחד מהם שגוי — יש לערוך ולתקן.',
}

// Keep the per-AlertKind map for any place that still needs the older
// granular label (history, audit trails). New surfaces should prefer
// DATA_ERROR_TYPE_LABELS.
export const ALERT_LABELS: Record<AlertKind, string> = {
  name_mismatch_on_id: 'שם שונה לאותה תעודת זהות',
  name_phone_mismatch_on_id: 'שם וטלפון שונים לאותה תעודת זהות',
  id_mismatch_name_phone_match: 'תעודת זהות שונה לאותו שם וטלפון',
  id_name_mismatch_on_phone: 'תעודת זהות ושם שונים לאותו טלפון',
  cross_person_mismatch: 'טלפון משויך כעת לאדם אחר',
  phone_match_name_differs_no_id: 'טלפון תואם אך השם שונה',
}
