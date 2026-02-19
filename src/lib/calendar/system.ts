import type { calendar } from "src/lib/options/types";

export type CalendarParts = {
  era?: string;
  year: number;
  month: number;
  day: number;
};

export type CalendarAdapter = {
  name: calendar;
  intlId: string;
  parts(date: Date): CalendarParts;
  monthTitle(date: Date): string;
  monthKey(date: Date): string;
  dayLabel(date: Date): string;
};

const CALENDAR_ID: Record<calendar, string> = {
  Gregorian: "gregory",
  Jalali: "persian",
  Hijri: "islamic",
  Hebrew: "hebrew",
  Buddhist: "buddhist",
  Japanese: "japanese",
  Indian: "indian",
  ROC: "roc",
  Chinese: "chinese",
};

function safeLocale(locale?: string): string {
  const l = (locale ?? "").trim();
  return l.length ? l : "en-US";
}

function makeTag(locale: string, calId: string): string {
  return `${locale}-u-ca-${calId}`;
}

function parseIntStrict(s: string, what: string): number {
  const n = Number.parseInt(s, 10);
  if (!Number.isFinite(n)) throw new Error(`Intl calendar parse failed for ${what}: "${s}"`);
  return n;
}

/**
 * Intl-only adapter.
 * NO fallback. If unsupported, this will throw.
 */
export function getCalendarAdapter(name: calendar, locale?: string): CalendarAdapter {
  const intlId = CALENDAR_ID[name];
  if (!intlId) throw new Error(`Unknown calendar: ${String(name)}`);

  const loc = safeLocale(locale);

  // Use a stable tag for keys to avoid locale-dependent era strings breaking monthKey consistency.
  const keyTag = makeTag("en-US", intlId);
  const labelTag = makeTag(loc, intlId);

  const partsFmt = new Intl.DateTimeFormat(labelTag, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    era: "short",
  });

  const monthFmt = new Intl.DateTimeFormat(labelTag, {
    year: "numeric",
    month: "long",
    era: "short",
  });

  const dayFmt = new Intl.DateTimeFormat(labelTag, { day: "numeric" });

  const keyFmt = new Intl.DateTimeFormat(keyTag, {
    year: "numeric",
    month: "numeric",
    era: "short",
  });

  // Hard “no fallback” support check: will throw if ICU doesn’t support this calendar.
  // (The first call is your canary.)
  keyFmt.formatToParts(new Date(2026, 1, 8));

  const parts = (date: Date): CalendarParts => {
    const out: CalendarParts = { year: 0, month: 0, day: 0 };
    for (const p of partsFmt.formatToParts(date)) {
      if (p.type === "year") out.year = parseIntStrict(p.value, "year");
      if (p.type === "month") out.month = parseIntStrict(p.value, "month");
      if (p.type === "day") out.day = parseIntStrict(p.value, "day");
      if (p.type === "era") out.era = p.value;
    }
    return out;
  };

  const monthKey = (date: Date): string => {
    // Use keyFmt (en-US) for stable era token.
    let era = "";
    let year = 0;
    let month = 0;

    for (const p of keyFmt.formatToParts(date)) {
      if (p.type === "era") era = p.value;
      if (p.type === "year") year = parseIntStrict(p.value, "year");
      if (p.type === "month") month = parseIntStrict(p.value, "month");
    }

    // Era included because Japanese year resets on era change.
    return `${era}:${year}-${month}`;
  };

  return {
    name,
    intlId,
    parts,
    monthTitle: (d) => monthFmt.format(d),
    monthKey,
    dayLabel: (d) => dayFmt.format(d),
  };
}

/**
 * Optional helper (not fallback): lets UI disable unsupported calendars cleanly.
 */
export function isCalendarSupported(name: calendar): boolean {
  try {
    const intlId = CALENDAR_ID[name];
    const fmt = new Intl.DateTimeFormat(makeTag("en-US", intlId), { year: "numeric" });
    fmt.formatToParts(new Date());
    return true;
  } catch {
    return false;
  }
}
