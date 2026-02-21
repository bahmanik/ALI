import CountdownView from './CountdownView'
import options from 'src/configuration'
import { Popup } from '../shared/popup'
import { toGtkRevealerTransitionType } from '../shared/helpers'
import type { Gdk } from 'ags/gtk4'

export default function CountdownWindow(gdkmonitor: Gdk.Monitor): JSX.Element {
  return (
    <Popup
      name="countdown"
      class="CountdownPopup"
      surfaceClass="countdown-surface"
      gdkmonitor={gdkmonitor}
      layout={options.countdown.window.layout.get()}
      transitionType={toGtkRevealerTransitionType(options.countdown.window.revealTransition.get())}
      transitionDuration={options.countdown.window.transitionDuration.get()}
      margin={options.countdown.window.margin.get()}
    >
      <box class="countdown-surface">
        <CountdownView />
      </box>
    </Popup>
  )
}
