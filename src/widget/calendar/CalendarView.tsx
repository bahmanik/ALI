import { Gtk } from "ags/gtk4";
import { createState, onCleanup } from "gnim";
import type { Accessor } from "gnim";

import options from "src/configuration";
import { buildMonthGrid, shiftMonth } from "src/lib/calendar";
import type { DayCell, MonthGrid } from "src/lib/calendar";

import { CalendarGrid, CalendarHeader, CalendarWeekdays } from "./_components";
import { chunk7 } from "./helpers";

export function CalendarView(): JSX.Element {
  const [viewDate, setViewDate] = createState<Date>(new Date());
  const [selected, setSelected] = createState<Date | null>(null);
  const [rev, setRev] = createState(0);

  const bump = () => setRev(rev.peek() + 1);

  // Recompute when calendar-related options change (live settings UX).
  const unsubs = [
    options.calendar.calendar.subscribe(bump),
    options.calendar.locale.subscribe(bump),
    options.calendar.startOfWeek.subscribe(bump),
    options.calendar.weekend.subscribe(bump),
    options.calendar.showOutsideDays.subscribe(bump),
    options.calendar.showSecondaryDate.subscribe(bump),
    options.calendar.secondaryCalendar.subscribe(bump),
  ];
  onCleanup(() => unsubs.forEach((u) => u()));

  const grid: Accessor<MonthGrid> = rev.as(() =>
    buildMonthGrid({
      viewDate: viewDate.peek(),
      calendar: options.calendar.calendar.get(),
      locale: options.calendar.locale.get(),
      startOfWeek: options.calendar.startOfWeek.get(),
      weekend: options.calendar.weekend.get(),
      showOutsideDays: options.calendar.showOutsideDays.get(),
      showSecondaryDate: options.calendar.showSecondaryDate.get(),
      secondaryCalendar: options.calendar.secondaryCalendar.get(),
    }),
  );

  const rows: Accessor<DayCell[][]> = grid.as((g) => chunk7(g.cells));
  const headerVisible = options.calendar.header.show.as(Boolean);
  const title = grid.as((g) => g.title);
  const weekdayLabels = grid.as((g) => g.weekdayLabels);

  const goMonth = (delta: -1 | 1) => {
    const next = shiftMonth(
      viewDate.peek(),
      options.calendar.calendar.get(),
      options.calendar.locale.get(),
      delta,
    );
    setViewDate(next);
    setSelected(null);
    bump();
  };

  return (
    <box class="calendar-panel" orientation={Gtk.Orientation.VERTICAL}>
      <CalendarHeader
        visible={headerVisible}
        title={title}
        onPrevMonth={() => goMonth(-1)}
        onNextMonth={() => goMonth(1)}
      />

      <CalendarWeekdays labels={weekdayLabels} />

      <CalendarGrid
        rows={rows}
        selected={selected}
        onSelect={(date) => {
          setSelected(date);
          bump();
        }}
      />
    </box>
  );
}
