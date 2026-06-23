import type { Opt } from "src/lib/options";
import type { ColorWithAlpha } from "src/configuration/types";
import type { CalendarType, WeekDaysType } from "./enums";
import { ContainerStyleOptions } from "src/lib/options/factories/overrideContainer";
import { PopupWindowOptions } from "src/lib/options/factories/overridePopupWindow";

export interface CalendarStyleOptions extends ContainerStyleOptions { }

export interface CalendarGridOptions {
  weekdayOpacity: Opt<number>;
  cellRadius: Opt<number>;
  cellPadding: Opt<number>;
  cellGap: Opt<number>;
  outsideOpacity: Opt<number>;
  weekendOpacity: Opt<number>;
  todayBg: ColorWithAlpha;
  selectedBg: ColorWithAlpha;
  hoverBg: ColorWithAlpha;
}

export interface CalendarOptions {
  calendar: Opt<CalendarType>;
  locale: Opt<string>;
  startOfWeek: Opt<WeekDaysType>;
  weekend: Opt<WeekDaysType[]>;
  showOutsideDays: Opt<boolean>;
  showWeekNumbers: Opt<boolean>;
  showSecondaryDate: Opt<boolean>;
  secondaryCalendar: Opt<CalendarType>;

  window: PopupWindowOptions;
  style: CalendarStyleOptions;
  header: {
    show: Opt<boolean>;
    navButtonSize: Opt<number>;
    navButtonRadius: Opt<number>;
  };
  grid: CalendarGridOptions;
}
