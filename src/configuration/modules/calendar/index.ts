import { stem } from "src/configuration/helper";
import type { calendar, weekDays } from "src/lib/options/types";

const calendarModule = stem((opt) => ({
  calendar: opt<calendar>("Gregorian"),
  startOfWeek: opt<weekDays>("Sun"),
  weekend: opt<Array<weekDays>>(["Fri", "Sat"]),
}));

export type CalendarOptions = ReturnType<typeof calendarModule>;

export default calendarModule;
