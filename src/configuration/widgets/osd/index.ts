import { opt } from "src/lib/options";
import brightness from "./brightness";
import type { OsdOptions } from "./type";
import type {
  AnchorLayout,
  HexColor,
  OsdOrientation,
  RevealTransitionWithAuto,
} from "src/configuration/types";

const osd: OsdOptions = {
  enable: opt(true),

  timeoutMs: opt(4400),
  startupDelayMs: opt(250),

  // HyprPanel-style location names (also accept underscore variants).
  location: opt<AnchorLayout>("bottom-right"),
  orientation: opt<OsdOrientation>("horizontal"),

  // Transition options.
  revealTransition: opt<RevealTransitionWithAuto>("AUTO"),
  transitionDurationMs: opt(180),

  // Source toggles: the controllers will no-op if disabled.
  sources: {
    volume: opt(true),
    microphone: opt(true),
    brightness: opt(true),
    keyboardBrightness: opt(true),
  },

  // Interactive OSD (drag-to-set) options.
  interactive: {
    enable: opt(true),
    step: opt(0.02),
    lockTimeoutWhileDragging: opt(true),
  },

  // Visual styling options (exported to SCSS).
  style: {
    width: opt(280, { scss: true }),
    height: opt(96, { scss: true }),

    radius: opt(18, { scss: true }),
    padding: opt(14, { scss: true }),
    gap: opt(12, { scss: true }),
    margin: opt(12, { scss: true }),

    fg: opt<HexColor>("#e1e2e9", { scss: true }),

    bg: opt<HexColor>("#1d2024", { scss: true }),
    bgOpacity: opt(92, { scss: true }), // 0..100

    borderEnable: opt(false, { scss: true }),
    borderWidth: opt(1, { scss: true }),
    borderColor: opt<HexColor>("#8d9199", { scss: true }),
    borderOpacity: opt(35, { scss: true }), // 0..100

    shadowEnable: opt(true, { scss: true }),
    shadowMargin: opt(10, { scss: true }),
    shadowX: opt(0, { scss: true }),
    shadowY: opt(14, { scss: true }),
    shadowBlur: opt(40, { scss: true }),
    shadowSpread: opt(0, { scss: true }),
    shadowColor: opt("rgba(0,0,0,0.45)", { scss: true }),

    iconSize: opt(28, { scss: true }),
    iconPadding: opt(10, { scss: true }),
    iconBgOpacity: opt(12, { scss: true }), // 0..100 (uses $colors-bg)

    barWidth: opt(170, { scss: true }),
    barHeight: opt(10, { scss: true }),
    barBg: opt<HexColor>("#111318", { scss: true }),
    barBgOpacity: opt(45, { scss: true }), // 0..100
    barFill: opt<HexColor>("#1b93fd", { scss: true }),
  },

  brightness: brightness,
}

declare module "src/lib/options/root" {
  interface OptionsRoot {
    osd: OsdOptions;
  }
}

export default osd;
