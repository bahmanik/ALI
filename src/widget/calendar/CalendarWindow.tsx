import options from "src/configuration";
import { Popup } from "../shared/popup";
import { CalendarView } from "./CalendarView";
import { toRevealerTransitionWithAuto } from "../shared/helpers";
import type { Gdk } from "ags/gtk4";

export default function CalendarWindow(gdkmonitor: Gdk.Monitor): JSX.Element {
  const { revealTransition, layout } = options.calendar.window
  const transition = toRevealerTransitionWithAuto(revealTransition.get(), layout.get())

  return (
    <Popup
      name="calendar"
      class="CalendarPopup"
      gdkmonitor={gdkmonitor}
      layout={layout.get()}
      transitionType={transition}
      transitionDuration={options.calendar.window.transitionDuration.get()}
      margin={options.calendar.window.margin.get()}
    >
      <box class="calendar-surface">
        <CalendarView />
      </box>
    </Popup>
  );
}
