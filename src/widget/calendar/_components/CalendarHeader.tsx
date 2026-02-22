import { Gtk } from "ags/gtk4";
import type { Accessor } from "gnim";

export type CalendarHeaderProps = {
  visible: Accessor<boolean>;
  title: Accessor<string>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function CalendarHeader({
  visible,
  title,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps): JSX.Element {
  return (
    <box
      class="calendar-header"
      visible={visible}
      orientation={Gtk.Orientation.HORIZONTAL}
    >
      <button class="calendar-nav-btn" onClicked={onPrevMonth} tooltipText="Previous month">
        <label label="◀" />
      </button>

      <label
        class="calendar-title"
        label={title}
        hexpand
        halign={Gtk.Align.CENTER}
      />

      <button class="calendar-nav-btn" onClicked={onNextMonth} tooltipText="Next month">
        <label label="▶" />
      </button>
    </box>
  );
}
