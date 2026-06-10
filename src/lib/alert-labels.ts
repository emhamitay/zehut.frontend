import type { DataErrorType } from './api'

// Two user-facing error types replace the older granular AlertKinds.
// Everywhere in the UI we say "שגיאת נתונים" — a data error — and the
// type tells the citizen which field needs fixing.
export const DATA_ERROR_TYPE_LABELS: Record<DataErrorType, string> = {
  id_data_error: 'שגיאת תעודת זהות',
  phone_data_error: 'שגיאת טלפון',
}
