import type { calendar, weekDays } from "src/lib/options/types";
import { getCalendarAdapter } from "./system";

export type DayCell = {
  date: Date;
  label: string;
  secondaryLabel?: string;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

export type MonthGrid = {
  title: string;
  monthKey: string;
  weekdayLabels: string[];
  cells: DayCell[]; // 42 cells (6x7)
};

const WEEKDAY_INDEX: Record<weekDays, number> = {
  Sun: 0, Mon: 1, Tues: 2, Wed: 3, thurs: 4, Fri: 5, Sat: 6,
};

function atNoon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function addDays(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta, 12, 0, 0, 0);
}

function sameYMD(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function weekdayLabels(locale: string, startOfWeek: weekDays): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const base = new Date(2024, 0, 7, 12);
  const start = WEEKDAY_INDEX[startOfWeek] ?? 0;
  const out: string[] = [];
  for (let i = 0; i < 7; i++) out.push(fmt.format(addDays(base, start + i)));
  return out;
}

function findMonthFirst(anchor: Date, monthKey: (d: Date) => string): Date {
  const key = monthKey(anchor);
  let cur = atNoon(anchor);
  for (let i = 0; i < 40; i++) {
    const prev = addDays(cur, -1);
    if (monthKey(prev) !== key) return cur;
    cur = prev;
  }
  return cur;
}

function findMonthLast(anchor: Date, monthKey: (d: Date) => string): Date {
  const key = monthKey(anchor);
  let cur = atNoon(anchor);
  for (let i = 0; i < 40; i++) {
    const next = addDays(cur, 1);
    if (monthKey(next) !== key) return cur;
    cur = next;
  }
  return cur;
}

export function shiftMonth(viewDate: Date, cal: calendar, locale: string | undefined, delta: -1 | 1): Date {
  const adapter = getCalendarAdapter(cal, locale);
  const key = adapter.monthKey(viewDate);
  const first = findMonthFirst(viewDate, adapter.monthKey);
  const last = findMonthLast(viewDate, adapter.monthKey);

  if (delta === -1) {
    const prev = addDays(first, -1);
    return adapter.monthKey(prev) === key ? addDays(first, -30) : prev;
  }

  const next = addDays(last, 1);
  return adapter.monthKey(next) === key ? addDays(last, 30) : next;
}

export function buildMonthGrid(args: {
  viewDate: Date;
  calendar: calendar;
  locale?: string;
  startOfWeek: weekDays;
  weekend: weekDays[];
  showOutsideDays: boolean;
  showSecondaryDate: boolean;
  secondaryCalendar: calendar;
}): MonthGrid {
  const loc = (args.locale ?? "").trim() || "en-US";

  const adapter = getCalendarAdapter(args.calendar, loc);
  const secondary = args.showSecondaryDate ? getCalendarAdapter(args.secondaryCalendar, loc) : null;

  const anchor = atNoon(args.viewDate);
  const monthKey = adapter.monthKey(anchor);
  const first = findMonthFirst(anchor, adapter.monthKey);

  const firstWeekday = first.getDay();
  const start = WEEKDAY_INDEX[args.startOfWeek] ?? 0;
  const offset = (firstWeekday - start + 7) % 7;
  const gridStart = addDays(first, -offset);

  const today = atNoon(new Date());
  const weekendSet = new Set(args.weekend);

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays(gridStart, i);
    const inMonth = adapter.monthKey(date) === monthKey;

    if (!args.showOutsideDays && !inMonth) {
      cells.push({ date, label: "", inMonth, isToday: false, isWeekend: false });
      continue;
    }

    const weekdayName = (Object.keys(WEEKDAY_INDEX) as weekDays[]).find((k) => WEEKDAY_INDEX[k] === date.getDay());
    const isWeekend = Boolean(weekdayName && weekendSet.has(weekdayName));

    cells.push({
      date,
      label: adapter.dayLabel(date),
      secondaryLabel: secondary ? secondary.dayLabel(date) : undefined,
      inMonth,
      isToday: sameYMD(date, today),
      isWeekend,
    });
  }

  return {
    title: adapter.monthTitle(anchor),
    monthKey,
    weekdayLabels: weekdayLabels(loc, args.startOfWeek),
    cells,
  };
}
