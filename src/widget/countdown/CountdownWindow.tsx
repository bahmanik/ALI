import CountdownView from './CountdownView'
import options from 'src/configuration'
import { Gtk } from 'ags/gtk4'
import { Popup } from 'src/widget/shared/popup'
import type { Gdk } from 'ags/gtk4'
import type { LauncherRevealTransition } from 'src/lib/options/types'



export function toGtkRevealerTransition(t: LauncherRevealTransition): Gtk.RevealerTransitionType {
  const REVEALER_TRANSITION: Record<LauncherRevealTransition, Gtk.RevealerTransitionType> = {
    NONE: Gtk.RevealerTransitionType.NONE,
    CROSSFADE: Gtk.RevealerTransitionType.CROSSFADE,
    SLIDE_RIGHT: Gtk.RevealerTransitionType.SLIDE_RIGHT,
    SLIDE_LEFT: Gtk.RevealerTransitionType.SLIDE_LEFT,
    SLIDE_UP: Gtk.RevealerTransitionType.SLIDE_UP,
    SLIDE_DOWN: Gtk.RevealerTransitionType.SLIDE_DOWN,
    SWING_RIGHT: Gtk.RevealerTransitionType.SWING_RIGHT,
    SWING_LEFT: Gtk.RevealerTransitionType.SWING_LEFT,
    SWING_UP: Gtk.RevealerTransitionType.SWING_UP,
    SWING_DOWN: Gtk.RevealerTransitionType.SWING_DOWN,
  };

  return REVEALER_TRANSITION[t];
}

export default function CountdownWindow(gdkmonitor: Gdk.Monitor): JSX.Element {
  return (
    <Popup
      name="countdown"
      class="CountdownPopup"
      surfaceClass="countdown-surface"
      gdkmonitor={gdkmonitor}
      layout={options.countdown.window.layout.get()}
      transitionType={toGtkRevealerTransition(options.countdown.window.revealTransition.get())}
      transitionDuration={options.countdown.window.transitionDuration.get()}
      margin={options.countdown.window.margin.get()}
    >
      <box class="countdown-surface">
        <CountdownView />
      </box>
    </Popup>
  )
}
