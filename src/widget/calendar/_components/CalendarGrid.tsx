import { Gtk } from "ags/gtk4";
import { For } from "gnim";
import type { Accessor } from "gnim";

import type { DayCell } from "src/lib/calendar";

import { calendarCellClass } from "../helpers";

export type CalendarGridProps = {
  rows: Accessor<DayCell[][]>;
  selected: Accessor<Date | null>;
  onSelect: (date: Date) => void;
};

export function CalendarGrid({ rows, selected, onSelect }: CalendarGridProps): JSX.Element {
  return (
    <box class="calendar-grid" orientation={Gtk.Orientation.VERTICAL}>
      <For each={rows}>
        {(week: DayCell[]) => (
          <box class="calendar-row" homogeneous orientation={Gtk.Orientation.HORIZONTAL}>
            {week.map((cell) => {
              const cls = calendarCellClass(cell, selected.peek());

              return (
                <button
                  class={cls}
                  sensitive={Boolean(cell.label)}
                  onClicked={() => {
                    if (!cell.label) return;
                    onSelect(cell.date);
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
  );
}
