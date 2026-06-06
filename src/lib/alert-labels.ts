import type { AlertKind } from './api'

export const ALERT_LABELS: Record<AlertKind, string> = {
  name_mismatch_on_id: 'שם שונה לאותה תעודת זהות',
  name_phone_mismatch_on_id: 'שם וטלפון שונים לאותה תעודת זהות',
  id_mismatch_name_phone_match: 'תעודת זהות שונה לאותו שם וטלפון',
  id_name_mismatch_on_phone: 'תעודת זהות ושם שונים לאותו טלפון',
  cross_person_mismatch: 'טלפון משויך כעת לאדם אחר',
  name_match_no_id: 'שם תואם אך אין תעודת זהות',
  phone_match_name_differs_no_id: 'טלפון תואם אך השם שונה',
}
