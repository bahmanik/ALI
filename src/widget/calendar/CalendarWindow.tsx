import { Gtk } from "ags/gtk4";
import type { Gdk } from "ags/gtk4";

import options from "src/configuration";
import type { LauncherRevealTransition } from "src/lib/options/types";

import { Popup } from "src/widget/shared/popup";
import { CalendarView } from "./CalendarView";

function toGtkRevealerTransition(t: LauncherRevealTransition): Gtk.RevealerTransitionType {
  switch (t) {
    case "SWING_DOWN":
      return Gtk.RevealerTransitionType.SWING_DOWN;
    case "SLIDE_DOWN":
      return Gtk.RevealerTransitionType.SLIDE_DOWN;
    case "SLIDE_UP":
      return Gtk.RevealerTransitionType.SLIDE_UP;
    case "CROSSFADE":
      return Gtk.RevealerTransitionType.CROSSFADE;
    case "NONE":
      return Gtk.RevealerTransitionType.NONE;
  }
}

export default function CalendarWindow(gdkmonitor: Gdk.Monitor): JSX.Element {
  return (
    <Popup
      name="calendar"
      class="CalendarPopup"
      gdkmonitor={gdkmonitor}
      layout={options.calendar.window.layout.get()}
      transitionType={toGtkRevealerTransition(options.calendar.window.revealTransition.get())}
      transitionDuration={options.calendar.window.transitionDuration.get()}
      margin={options.calendar.window.margin.get()}
    >
      <box class="calendar-surface">
        <CalendarView />
      </box>
    </Popup>
  );
}
