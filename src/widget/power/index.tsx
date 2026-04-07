import { Popup } from "../shared/popup";
import { toRevealerTransitionWithAuto } from "../shared/helpers";
import { powerOptions } from "./options";
import type { Gdk } from "ags/gtk4";

const Clicked = (command: string) => {
  console.log(command)
}

export default function PowerWindow(gdkmonitor: Gdk.Monitor): JSX.Element {
  const { revealTransition, layout, transitionDuration, shutdown, sleep, logout, reboot } = powerOptions
  const transition = toRevealerTransitionWithAuto(revealTransition, layout)

  return (
    <Popup
      name="power"
      class="PowerPopup"
      gdkmonitor={gdkmonitor}
      layout={layout}
      transitionType={transition}
      transitionDuration={transitionDuration}
    >
      <box class="calendar-surface">
        <button
          onClicked={() => { Clicked(shutdown) }}
        >
          shutdown
        </button>

        <button
          onClicked={() => { Clicked(sleep) }}
        >
          sleep
        </button>

        <button
          onClicked={() => { Clicked(logout) }}
        >
          logout
        </button>

        <button
          onClicked={() => { Clicked(reboot) }}
        >
          reboot
        </button>
      </box>
    </Popup>
  );
}
