import { Gtk } from "ags/gtk4";
import { For } from "gnim";
import type { Accessor } from "gnim";

export type CalendarWeekdaysProps = {
  labels: Accessor<string[]>;
};

export function CalendarWeekdays({ labels }: CalendarWeekdaysProps): JSX.Element {
  return (
    <box class="calendar-weekdays" homogeneous orientation={Gtk.Orientation.HORIZONTAL}>
      <For each={labels}>{(d: string) => <label class="calendar-weekday" label={d} />}</For>
    </box>
  );
}
