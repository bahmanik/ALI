import { Gtk } from "ags/gtk4";
import { createState, For, onCleanup } from "gnim";
import type { Accessor } from "gnim";

import options from "src/configuration";
import { buildMonthGrid, shiftMonth } from "src/lib/calendar";
import type { DayCell, MonthGrid } from "src/lib/calendar";

function chunk7<T>(xs: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += 7) out.push(xs.slice(i, i + 7));
  return out;
}

function sameYMD(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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
      <box
        class="calendar-header"
        visible={options.calendar.header.show.as(Boolean)}
        orientation={Gtk.Orientation.HORIZONTAL}
      >
        <button
          class="calendar-nav-btn"
          onClicked={() => goMonth(-1)}
          tooltipText="Previous month"
        >
          <label label="◀" />
        </button>

        <label
          class="calendar-title"
          label={grid.as((g) => g.title)}
          hexpand
          halign={Gtk.Align.CENTER}
        />

        <button
          class="calendar-nav-btn"
          onClicked={() => goMonth(1)}
          tooltipText="Next month"
        >
          <label label="▶" />
        </button>
      </box>

      <box class="calendar-weekdays" homogeneous orientation={Gtk.Orientation.HORIZONTAL}>
        <For each={grid.as((g) => g.weekdayLabels)}>
          {(d: string) => <label class="calendar-weekday" label={d} />}
        </For>
      </box>

      <box class="calendar-grid" orientation={Gtk.Orientation.VERTICAL}>
        <For each={rows}>
          {(week: DayCell[]) => (
            <box class="calendar-row" homogeneous orientation={Gtk.Orientation.HORIZONTAL}>
              {week.map((cell) => {
                const sel = selected.peek();
                const isSelected = sel ? sameYMD(sel, cell.date) : false;

                const cls = [
                  "calendar-cell",
                  cell.inMonth ? "" : "outside",
                  cell.isToday ? "today" : "",
                  cell.isWeekend ? "weekend" : "",
                  isSelected ? "selected" : "",
                  cell.label ? "" : "empty",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    class={cls}
                    sensitive={Boolean(cell.label)}
                    onClicked={() => {
                      if (!cell.label) return;
                      setSelected(cell.date);
                      bump();
                    }}
                    tooltipText={cell.date.toDateString()}
                    hexpand
                    vexpand
                  >
                    <box class="calendar-cell-inner" orientation={Gtk.Orientation.VERTICAL}>
                      <label class="calendar-day" label={cell.label} />
                      <label
                        class="calendar-day-secondary"
                        label={cell.secondaryLabel ?? ""}
                        visible={Boolean(cell.secondaryLabel)}
                      />
                    </box>
                  </button>
                );
              })}
            </box>
          )}
        </For>
      </box>
    </box>
  );
}
