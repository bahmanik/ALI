import { opt } from "src/lib/options";
import type { CalendarType, WeekDaysType } from "./enums";
import type { CalendarOptions } from "./type";
import { colorWithAlpha } from "src/lib/options/factories/colorWithAlpha";
import { overrideContainer } from "src/lib/options/factories/overrideContainer";
import { overridePopupWindow } from "src/lib/options/factories/overridePopupWindow";

const calendarModule: CalendarOptions = {
  /** Which calendar system to display in the widget. */
  calendar: opt<CalendarType>("Gregorian"),
  /**
   * Locale used for labels (month title, weekday labels) when Intl is available.
   * Empty string => system default.
   */
  locale: opt(""),

  startOfWeek: opt<WeekDaysType>("Sun"),
  weekend: opt<Array<WeekDaysType>>(["Fri", "Sat"]),

  showOutsideDays: opt(true),
  showWeekNumbers: opt(false),

  /** Optional 2nd tiny label in each cell (usually Gregorian while showing another calendar). */
  showSecondaryDate: opt(false),
  secondaryCalendar: opt<CalendarType>("Gregorian"),

  window: overridePopupWindow({}),

  style: overrideContainer({}),

  header: {
    show: opt(true),
    navButtonSize: opt(28, { scss: true }),
    navButtonRadius: opt(10, { scss: true }),
  },

  grid: {
    weekdayOpacity: opt(0.85, { scss: true }),
    cellRadius: opt(12, { scss: true }),
    cellPadding: opt(10, { scss: true }),
    cellGap: opt(6, { scss: true }),

    outsideOpacity: opt(0.35, { scss: true }),
    weekendOpacity: opt(0.9, { scss: true }),

    todayBg: colorWithAlpha({ color: "#ffffff", alpha: 0.08 }),
    selectedBg: colorWithAlpha({ color: "#1b93fd", alpha: 0.22 }),
    hoverBg: colorWithAlpha({ color: "#ffffff", alpha: 0.06 }),
  },
};

declare module "src/lib/options/root" {
  interface OptionsRoot {
    calendar: CalendarOptions;
  }
}

export default calendarModule;
