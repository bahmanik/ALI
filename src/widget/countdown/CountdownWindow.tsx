import CountdownView from './CountdownView'
import options from 'src/configuration'
import { Popup } from '../shared/popup'
import { toRevealerTransitionWithAuto } from '../shared/helpers'
import type { Gdk } from 'ags/gtk4'

export default function CountdownWindow(gdkmonitor: Gdk.Monitor): JSX.Element {
  const { revealTransition, layout } = options.countdown.window
  const transition = toRevealerTransitionWithAuto(revealTransition.get(), layout.get())

  return (
    <Popup
      name="countdown"
      class="CountdownPopup"
      surfaceClass="countdown-surface"
      gdkmonitor={gdkmonitor}
      layout={layout.get()}
      transitionType={transition}
      transitionDuration={options.countdown.window.transitionDuration.get()}
      margin={options.countdown.window.margin.get()}
    >
      <box class="countdown-surface">
        <CountdownView />
      </box>
    </Popup>
  )
}
