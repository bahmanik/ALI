import { Astal } from "ags/gtk4";
import giCairo from "cairo";

export function setWindowAcceptsInput(
  win: Astal.Window,
  accepts: boolean,
  opts?: { maxTries?: number; warnIfVisible?: boolean },
): void {
  const maxTries = Math.max(1, opts?.maxTries ?? 60);
  const warnIfVisible = Boolean(opts?.warnIfVisible ?? false);

  let tries = 0;

  const tick = () => {
    const surf = win.get_native?.()?.get_surface?.();
    if (surf) {
      try {
        if (accepts) surf.set_input_region(null);
        else surf.set_input_region(new giCairo.Region());
      } catch {
        // ignore: failing here is rare and noisy; if it happens consistently you'll notice
      }
      return;
    }

    if (++tries < maxTries) {
      setTimeout(tick, 16);
      return;
    }

    if (warnIfVisible && win.visible) {
      console.warn(`[osd] set_input_region failed: no surface while visible`);
    }
  };

  tick();
}
