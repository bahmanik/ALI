/**
 * Represents a Hijri (Islamic) date.
 */
export interface HijriDate {
  year: number
  month: number
  day: number
}

/**
 * Converts a Gregorian Date object to a Hijri date.
 * Uses the Tabular Islamic Calendar algorithm.
 * @param date JavaScript Date
 * @returns HijriDate
 */
export function toHijri(date: Date): HijriDate {
  const gy = date.getFullYear()
  const gm = date.getMonth() // 0-indexed
  const gd = date.getDate()

  // Convert Gregorian to Julian Day Number (JDN)
  const a = Math.floor((14 - (gm + 1)) / 12)
  const y = gy + 4800 - a
  const m = (gm + 1) + 12 * a - 3

  let jd =
    gd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045

  // Hijri Epoch (July 16, 622 AD) is JDN 1948440
  jd = jd - 1948440

  // Re-calculate more precisely from the cycle
  const i = jd // Days since epoch

  // Year calculation
  const epochBase = 1948440
  const adjustedJD = i + epochBase

  const l = adjustedJD - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  const l2 = l - 10631 * n + 354
  const j = (Math.floor((10985 - l2) / 5316)) * (Math.floor((50 * l2) / 17719)) + (Math.floor(l2 / 5670)) * (Math.floor((43 * l2) / 15238))
  const l3 = l2 - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29

  const hm = Math.floor((24 * l3) / 709)
  const hd = l3 - Math.floor((709 * hm) / 24)
  const finalHy = 30 * n + j - 30

  return { year: finalHy, month: hm, day: hd }
}

/**
 * Formats a HijriDate or JavaScript Date as "YYYY/MM/DD".
 * @param date Date or HijriDate
 * @param separator Output separator (default "/")
 * @returns Formatted string
 */
export function formatHijri(date: Date | HijriDate, separator: string = '/'): string {
  const hDate = date instanceof Date ? toHijri(date) : date

  const y = hDate.year
  const m = hDate.month.toString().padStart(2, '0')
  const d = hDate.day.toString().padStart(2, '0')

  return `${y}${separator}${m}${separator}${d}`
}

/**
 * Converts a Hijri date to a Gregorian JavaScript Date.
 * Uses the Tabular Islamic Calendar arithmetic.
 * @param hDate HijriDate
 * @returns JavaScript Date
 */
export function fromHijri(hDate: HijriDate): Date {
  const hy = hDate.year
  const hm = hDate.month
  const hd = hDate.day

  // Convert Hijri to Julian Day Number (JDN)
  const jd =
    hd +
    Math.ceil(29.5 * (hm - 1)) +
    (hy - 1) * 354 +
    Math.floor((3 + 11 * hy) / 30) +
    1948439 // Hijri Epoch offset (JDN for 0 AH) - 1

  // Convert JDN to Gregorian
  const l = jd + 68569
  const n = Math.floor((4 * l) / 146097)
  const l2 = l - Math.floor((146097 * n + 3) / 4)
  const i = Math.floor((4000 * (l2 + 1)) / 1461001)
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31
  const j = Math.floor((80 * l3) / 2447)
  const gd = l3 - Math.floor((2447 * j) / 80)
  const l4 = Math.floor(j / 11)
  const gm = j + 2 - 12 * l4
  const gy = 100 * (n - 49) + i + l4

  return new Date(gy, gm - 1, gd)
}

/**
 * Returns the weekday of a Hijri date.
 * 0 = Sunday ... 6 = Saturday
 * @param hDate HijriDate
 * @returns Weekday index
 */
export function getHijriWeekday(hDate: HijriDate): number {
  return fromHijri(hDate).getDay()
}

/**
 * Returns the Arabic weekday name for a Hijri date.
 * @param hDate HijriDate
 * @returns Arabic weekday string
 */
export function getHijriWeekdayName(hDate: HijriDate): string {
  const weekdayNames = [
    'الأحد',      // Sunday
    'الاثنين',    // Monday
    'الثلاثاء',   // Tuesday
    'الأربعاء',   // Wednesday
    'الخميس',     // Thursday
    'الجمعة',     // Friday
    'السبت'       // Saturday
  ]

  return weekdayNames[getHijriWeekday(hDate)]
}

/**
 * Determines whether a Hijri year is a leap year.
 * Uses the Tabular cycle (years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29).
 * @param hy Hijri year
 * @returns True if leap year
 */
export function isHijriLeapYear(hy: number): boolean {
  // Standard Kuwaiti Algorithm formula
  return (11 * hy + 14) % 30 < 11
}

/**
 * Returns the number of days in a Hijri month.
 * Odd months are 30 days, even months are 29 days.
 * The 12th month is 30 days only in a leap year.
 * @param year Hijri year
 * @param month Hijri month (1–12)
 * @returns Number of days
 */
export function getHijriMonthLength(year: number, month: number): number {
  if (month % 2 === 1) return 30 // Odd months (1, 3, 5...)
  if (month === 12 && isHijriLeapYear(year)) return 30 // 12th month in leap year
  return 29 // Even months
}

/**
 * Returns the weekday of the first day of the Hijri month.
 * 0 = Sunday ... 6 = Saturday
 * @param hDate HijriDate
 * @returns Weekday index
 */
export function getHijriMonthFirstWeekday(hDate: HijriDate): number {
  const firstDayOfMonth: HijriDate = {
    year: hDate.year,
    month: hDate.month,
    day: 1
  }

  return fromHijri(firstDayOfMonth).getDay()
}
