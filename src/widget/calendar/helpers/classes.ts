import type { DayCell } from "src/lib/calendar";

import { sameYMD } from "./dates";

export function calendarCellClass(cell: DayCell, selected: Date | null): string {
  const isSelected = selected ? sameYMD(selected, cell.date) : false;

  return [
    "calendar-cell",
    cell.inMonth ? "" : "outside",
    cell.isToday ? "today" : "",
    cell.isWeekend ? "weekend" : "",
    isSelected ? "selected" : "",
    cell.label ? "" : "empty",
  ]
    .filter(Boolean)
    .join(" ");
}
