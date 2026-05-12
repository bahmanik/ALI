import type { Opt } from "src/lib/options";
import type { AnchorLayoutType, HexColor, RevealTransitionWithAuto, RgbaColor } from "src/configuration/types";
import type { BorderLocationType, CalendarType, WeekDaysType } from "./enums";

export interface CalendarOptions {
  calendar: Opt<CalendarType>;
  locale: Opt<string>;
  startOfWeek: Opt<WeekDaysType>;
  weekend: Opt<WeekDaysType[]>;

  showOutsideDays: Opt<boolean>;
  showWeekNumbers: Opt<boolean>;

  showSecondaryDate: Opt<boolean>;
  secondaryCalendar: Opt<CalendarType>;

  window: {
    width: Opt<number>;
    height: Opt<number>;
    margin: Opt<number>;
    layout: Opt<AnchorLayoutType>;
    revealTransition: Opt<RevealTransitionWithAuto>;
    transitionDuration: Opt<number>;
  };

  style: {
    bg: Opt<HexColor>;
    bgOpacity: Opt<number>;
    radius: Opt<number>;
    padding: Opt<number>;
    borderEnable: Opt<boolean>;
    borderLocation: Opt<BorderLocationType>;
    borderWidth: Opt<number>;
    borderColor: Opt<HexColor>;
    shadowEnable: Opt<boolean>;
    shadowX: Opt<number>;
    shadowY: Opt<number>;
    shadowBlur: Opt<number>;
    shadowSpread: Opt<number>;
    shadowColor: Opt<RgbaColor>;
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
    todayBg: Opt<RgbaColor>;
    selectedBg: Opt<RgbaColor>;
    hoverBg: Opt<RgbaColor>;
  };
}
