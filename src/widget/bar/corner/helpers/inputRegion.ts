import giCairo from "cairo";
import type { Astal } from "ags/gtk4";

export function makeClickThrough(win: Astal.Window) {
  // GI surfaces can appear a few ticks after window creation.
  let tries = 0;
  const tick = () => {
    const surf = win.get_native()?.get_surface();
    if (surf) {
      // Empty region => window receives NO input => clicks pass through.
      surf.set_input_region(new giCairo.Region());
      return;
    }
    if (++tries < 60) setTimeout(tick, 16);
  };
  tick();
}

export function forceClickThrough(win: Astal.Window) {
  win.get_native()?.get_surface()?.set_input_region(new giCairo.Region());
}
