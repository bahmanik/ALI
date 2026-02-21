import options from "src/configuration"
import { timeout } from "ags/time"
import { createState, onCleanup, type Accessor } from "gnim"
import { AppButton } from "./AppButton"
import type { Timer } from "ags/time"
import type AstalApps from "gi://AstalApps?version=0.1"
import { toRevealerTransition } from "src/widget/shared/helpers"

export type AnimatedAppRowProps = {
  app: AstalApps.Application
  query: Accessor<string>
  iconPx: number
  itemGap: number
  showDescription: boolean
}

// Animated row wrapper (enter-only animation)
export function AnimatedAppRow({
  app,
  query,
  iconPx,
  itemGap,
  showDescription,
}: AnimatedAppRowProps) {
  const transitionType = toRevealerTransition(options.launcher.revealTransition.get())
  const transitionduration = options.launcher.transitionDuration.get()
  const animEnabled = options.launcher.animateResults.get() !== "NONE"
  const animDelay = Math.max(0, Number(options.launcher.animInDelayMs.get() ?? 0))


  const [revealed, setRevealed] = createState<boolean>(!animEnabled)

  // reveal on mount (only affects new rows)
  let tmr: Timer
  if (animEnabled) {
    tmr = timeout(animDelay, () => setRevealed(true))
  }
  onCleanup(() => tmr?.cancel?.())

  return (
    <revealer
      revealChild={revealed}
      transitionDuration={transitionduration}
      transitionType={transitionType}
    >
      <AppButton
        app={app}
        query={query}
        iconPx={iconPx}
        itemGap={itemGap}
        showDescription={showDescription}
      />
    </revealer>
  )
}
