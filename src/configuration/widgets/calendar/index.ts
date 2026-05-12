import { opt } from "src/lib/options";
import { HexColor, RgbaColor, type AnchorLayoutType, type CalendarBorderLocation, type RevealTransitionWithAuto } from "src/configuration/types";
import type { CalendarType, WeekDaysType } from "./enums";
import type { CalendarOptions } from "./type";

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

  window: {
    width: opt(420, { scss: true }),
    height: opt(420, { scss: true }),
    margin: opt(12, { scss: true }),
    layout: opt<AnchorLayoutType>("top_right"),
    revealTransition: opt<RevealTransitionWithAuto>("SWING_DOWN"),
    transitionDuration: opt(0.18),
  },

  style: {
    bg: opt<HexColor>("#1d2024", { scss: true }),
    bgOpacity: opt(92, { scss: true }),

    radius: opt(18, { scss: true }),
    padding: opt(12, { scss: true }),

    borderEnable: opt(false, { scss: true }),
    borderLocation: opt<CalendarBorderLocation>("full", { scss: true }),
    borderWidth: opt(1, { scss: true }),
    borderColor: opt<HexColor>("#8d9199", { scss: true }),

    shadowEnable: opt(true, { scss: true }),
    shadowX: opt(0, { scss: true }),
    shadowY: opt(18, { scss: true }),
    shadowBlur: opt(42, { scss: true }),
    shadowSpread: opt(0, { scss: true }),
    shadowColor: opt<RgbaColor>("rgba(0,0,0,0.45)", { scss: true }),
  },

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

    todayBg: opt<RgbaColor>("rgba(255,255,255,0.08)", { scss: true }),
    selectedBg: opt<RgbaColor>("rgba(27,147,253,0.22)", { scss: true }),
    hoverBg: opt<RgbaColor>("rgba(255,255,255,0.06)", { scss: true }),
  },
};

declare module "src/lib/options/root" {
  interface OptionsRoot {
    calendar: CalendarOptions;
  }
}

export default calendarModule;
