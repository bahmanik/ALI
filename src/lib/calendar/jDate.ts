/**
 * Represents a Jalali (Persian) date.
 */
export interface JalaliDate {
  year: number
  month: number
  day: number
}

/**
 * Converts a Gregorian Date object to a Jalali date.
 * Uses the 33-year cycle conversion algorithm.
 * @param date JavaScript Date
 * @returns JalaliDate
 */
export function toJalali(date: Date): JalaliDate {
  const gy = date.getFullYear()
  const gm = date.getMonth() + 1 // 0-indexed
  const gd = date.getDate()

  const gMonthOffsets = [
    0, 31, 59, 90, 120, 151,
    181, 212, 243, 273, 304, 334
  ]

  const gy2 = gm > 2 ? gy + 1 : gy

  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    gMonthOffsets[gm - 1]

  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053

  jy += 4 * Math.floor(days / 1461)
  days %= 1461

  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }

  let jm: number
  let jd: number

  if (days < 186) {
    jm = 1 + Math.floor(days / 31)
    jd = 1 + (days % 31)
  } else {
    jm = 7 + Math.floor((days - 186) / 30)
    jd = 1 + ((days - 186) % 30)
  }

  return { year: jy, month: jm, day: jd }
}

/**
 * Formats a JalaliDate or JavaScript Date as "YYYY/MM/DD".
 * @param date Date or JalaliDate
 * @param separator Output separator (default "/")
 * @returns Formatted string
 */
export function formatJalali(date: Date | JalaliDate, separator: string = '/'): string {
  const jDate = date instanceof Date ? toJalali(date) : date

  const y = jDate.year
  const m = jDate.month.toString().padStart(2, '0')
  const d = jDate.day.toString().padStart(2, '0')

  return `${y}${separator}${m}${separator}${d}`
}

/**
 * Converts a Jalali date to a Gregorian JavaScript Date.
 * Uses the 33-year cycle arithmetic.
 * @param jDate JalaliDate
 * @returns JavaScript Date
 */
export function fromJalali(jDate: JalaliDate): Date {
  const jy = jDate.year
  const jm = jDate.month
  const jd = jDate.day

  let jy2 = jy + 1595

  let days =
    -355668 +
    365 * jy2 +
    Math.floor(jy2 / 33) * 8 +
    Math.floor(((jy2 % 33) + 3) / 4)

  if (jm < 7) {
    days += (jm - 1) * 31
  } else {
    days += (jm - 7) * 30 + 186
  }

  days += jd

  let gy = 400 * Math.floor(days / 146097)
  days %= 146097

  if (days > 36524) {
    days--
    gy += 100 * Math.floor(days / 36524)
    days %= 36524
    if (days >= 365) days++
  }

  gy += 4 * Math.floor(days / 1461)
  days %= 1461

  if (days > 365) {
    gy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }

  const gMonthLengths = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
  ]

  let gm = 1
  while (gm <= 12 && days >= gMonthLengths[gm]) {
    days -= gMonthLengths[gm]
    gm++
  }

  const gd = days + 1
  return new Date(gy, gm - 1, gd)
}

/**
 * Returns the weekday of a Jalali date.
 * 0 = Sunday ... 6 = Saturday
 * @param jDate JalaliDate
 * @returns Weekday index
 */
export function getJalaliWeekday(jDate: JalaliDate): number {
  return fromJalali(jDate).getDay()
}

/**
 * Returns the Persian weekday name for a Jalali date.
 * @param jDate JalaliDate
 * @returns Persian weekday string
 */
export function getJalaliWeekdayName(jDate: JalaliDate): string {
  const weekdayNames = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنجشنبه',
    'جمعه',
    'شنبه'
  ]

  return weekdayNames[getJalaliWeekday(jDate)]
}

/**
 * Determines whether a Jalali year is a leap year.
 * Uses the official 2820-year cycle.
 * @param jy Jalali year
 * @returns True if leap year
 */
export function isJalaliLeapYear(jy: number): boolean {
  const mod = (jy - (jy > 0 ? 474 : 473)) % 2820
  const y = mod < 0 ? mod + 2820 : mod
  return (y + 1) % 4 === 0
}

/**
 * Returns the number of days in a Jalali month.
 * @param year Jalali year
 * @param month Jalali month (1–12)
 * @returns Number of days
 */
export function getJalaliMonthLength(year: number, month: number): number {
  if (month <= 6) return 31
  if (month <= 11) return 30
  return isJalaliLeapYear(year) ? 30 : 29
}

/**
 * Returns the weekday of the first day of the Jalali month.
 * 0 = Sunday ... 6 = Saturday
 * @param jDate JalaliDate
 * @returns Weekday index
 */
export function getJalaliMonthFirstWeekday(jDate: JalaliDate): number {
  const firstDayOfMonth: JalaliDate = {
    year: jDate.year,
    month: jDate.month,
    day: 1
  }

  return fromJalali(firstDayOfMonth).getDay()
}
