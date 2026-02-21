import type { Opt } from "src/lib/options";
import type { AnchorLayout, calendar, RevealTransitionWithAuto, weekDays } from "src/lib/options/types";

export interface CalendarOptions {
  calendar: Opt<calendar>;
  locale: Opt<string>;
  startOfWeek: Opt<weekDays>;
  weekend: Opt<weekDays[]>;

  showOutsideDays: Opt<boolean>;
  showWeekNumbers: Opt<boolean>;

  showSecondaryDate: Opt<boolean>;
  secondaryCalendar: Opt<calendar>;

  window: {
    width: Opt<number>;
    height: Opt<number>;
    margin: Opt<number>;
    layout: Opt<AnchorLayout>;
    revealTransition: Opt<RevealTransitionWithAuto>;
    transitionDuration: Opt<number>;
  };

  style: {
    bg: Opt<string>;
    bgOpacity: Opt<number>;
    radius: Opt<number>;
    padding: Opt<number>;
    borderEnable: Opt<boolean>;
    borderLocation: Opt<"none" | "full">;
    borderWidth: Opt<number>;
    borderColor: Opt<string>;
    shadowEnable: Opt<boolean>;
    shadowX: Opt<number>;
    shadowY: Opt<number>;
    shadowBlur: Opt<number>;
    shadowSpread: Opt<number>;
    shadowColor: Opt<string>;
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
