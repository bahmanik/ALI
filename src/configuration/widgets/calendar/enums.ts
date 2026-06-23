export const CalendarValues = [
  "Gregorian", "Jalali", "Hijri", "Hebrew", "Buddhist", "Japanese", "Indian", "ROC", "Chinese"
]

export const WeekDaysValues = [
  "Sun", "Mon", "Tues", "Wed", "thurs", "Fri", "Sat"
]

export const BorderLocationValues = [
  "none", "full"
]

export type CalendarType = (typeof CalendarValues)[number]
export type WeekDaysType = (typeof WeekDaysValues)[number]
