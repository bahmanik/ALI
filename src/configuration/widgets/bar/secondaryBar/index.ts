import { overrideScale } from "src/lib/options/factories/overrideScale";
import { opt } from "src/lib/options";
import type { SecondaryBarOptions } from "./type";
import type { BarLocationType } from "src/configuration/enums";
import { colorWithAlpha } from "src/lib/options/factories/colorWithAlpha";
import { overrideContainer } from "src/lib/options/factories/overrideContainer";

const secondaryBar: SecondaryBarOptions = {
  enable: opt(false),
  position: opt<BarLocationType>("left", { scss: true, hyprland: true }),
  margin: opt<number[]>([0, 0, 0, 0]),
  /** Visual styling options (exported to SCSS). Inspired by HyprPanel's bar theming knobs. */
  style: {
    floating: opt(true, { scss: true }),
    transparent: opt(false, { scss: true }),

    // geometry
    height: opt(36, { scss: true }), // px
    marginTop: opt(8, { scss: true }), // px (inside the window)
    marginBottom: opt(8, { scss: true }), // px (inside the window)
    marginSides: opt(10, { scss: true }), // px (inside the window)
    ...overrideContainer({})
  },

  /** Button-ish widgets inside the bar (buttons / menubuttons). */
  buttons: {
    bg: colorWithAlpha({ color: "#1d2024", alpha: 0.45 }),
    hoverOpacity: opt(0.70, { scss: true }),
    bgHoverOpacity: opt(70, { scss: true }), // 0..100

    radius: opt(12, { scss: true }), // px
    spacing: opt(4, { scss: true }), // px (horizontal spacing)
    paddingX: opt(0, { scss: true }), // px
    paddingY: opt(0, { scss: true }), // px
  },

  ...overrideScale({
    widgetId: 'bar.secondaryBar',
    defaultLocal: 12,
    exports: { scss: true },
  }),
}

export default secondaryBar;
