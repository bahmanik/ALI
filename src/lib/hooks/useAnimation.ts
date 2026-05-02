// ─────────────────────────────────────────────────────────────────────────────
//  useAnimation(fps?)
//
//  Wraps GLib.timeout_add into a reusable, restartable animation driver.
//
//  .start(onTick, onDone?)
//    onTick  — called each frame.  Return true to continue, false to stop.
//    onDone  — called once after the last tick.  Use it to chain animations
//              (e.g. travel → fade, expand → contract).
//
//  .stop()   — cancels the running loop on the next tick.
//  .isRunning() — whether a loop is currently active.
//
//  Design note: start() returns immediately if already running, so callers
//  can safely call it without guarding.  If you need to update state that a
//  running tick reads (e.g. a spring target), just mutate the ref — the
//  in-flight tick will pick it up automatically on the next frame.

import GLib from "gi://GLib?version=2.0"
import { useRef } from "./useRef"

// ─────────────────────────────────────────────────────────────────────────────
const useAnimation = (fps = 60) => {
  const active = useRef(false)
  const ms = Math.round(1000 / fps)

  return {
    isRunning: () => active.current,

    start(onTick: () => boolean, onDone?: () => void) {
      if (active.current) return
      active.current = true
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
        if (!active.current) return GLib.SOURCE_REMOVE
        const cont = onTick()
        if (!cont) {
          active.current = false
          onDone?.()
        }
        return cont ? GLib.SOURCE_CONTINUE : GLib.SOURCE_REMOVE
      })
    },

    stop() { active.current = false },
  }
}

export default useAnimation
