import type { Opt } from "src/lib/options";
import type { AnchorLayout, HexColor, RevealTransitionWithAuto } from "src/configuration/types";

export enum CalendarEnum {
  "Gregorian", "Jalali", "Hijri", "Hebrew", "Buddhist", "Japanese", "Indian", "ROC", "Chinese"
}

export enum WeekDaysEnum {
  "Sun", "Mon", "Tues", "Wed", "thurs", "Fri", "Sat"
}

export enum BorderLocationEnum {
  "none", "full"
}

export interface CalendarOptions {
  calendar: Opt<CalendarEnum>;
  locale: Opt<string>;
  startOfWeek: Opt<WeekDaysEnum>;
  weekend: Opt<WeekDaysEnum[]>;

  showOutsideDays: Opt<boolean>;
  showWeekNumbers: Opt<boolean>;

  showSecondaryDate: Opt<boolean>;
  secondaryCalendar: Opt<CalendarEnum>;

  window: {
    width: Opt<number>;
    height: Opt<number>;
    margin: Opt<number>;
    layout: Opt<AnchorLayout>;
    revealTransition: Opt<RevealTransitionWithAuto>;
    transitionDuration: Opt<number>;
  };

  style: {
    bg: Opt<HexColor>;
    bgOpacity: Opt<number>;
    radius: Opt<number>;
    padding: Opt<number>;
    borderEnable: Opt<boolean>;
    borderLocation: Opt<BorderLocationEnum>;
    borderWidth: Opt<number>;
    borderColor: Opt<HexColor>;
    shadowEnable: Opt<boolean>;
    shadowX: Opt<number>;
    shadowY: Opt<number>;
    shadowBlur: Opt<number>;
    shadowSpread: Opt<number>;
    shadowColor: Opt<HexColor>;
  };

  header: {
    show: Opt<boolean>;
    navButtonSize: Opt<number>;
    navButtonRadius: Opt<number>;
  };

  grid: {
    weekdayOpacity: Opt<number>;
    cellRadius: Opt<number>;
    cellPadding: Opt<number>;
    cellGap: Opt<number>;
    outsideOpacity: Opt<number>;
    weekendOpacity: Opt<number>;
    todayBg: Opt<string>;
    selectedBg: Opt<string>;
    hoverBg: Opt<string>;
  };
}
