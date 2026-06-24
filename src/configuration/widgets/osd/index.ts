import { opt } from "src/lib/options";
import brightness from "./brightness";
import type { OsdOptions } from "./type";
import type {
  AnchorLayoutType,
  HexColor,
  OsdOrientation,
} from "src/configuration/types";
import { colorWithAlpha } from "src/lib/options/factories/colorWithAlpha";
import { overrideContainer } from "src/lib/options/factories/overrideContainer";
import { RevealTransitionWithAuto } from "src/configuration/enums";

const osd: OsdOptions = {
  enable: opt(true),

  timeoutDuration: opt(4400),
  startupDelayMs: opt(250),

  // HyprPanel-style location names (also accept underscore variants).
  layout: opt<AnchorLayoutType>("bottom-right"),
  orientation: opt<OsdOrientation>("horizontal"),

  // Transition options.
  revealTransition: opt<RevealTransitionWithAuto>("AUTO"),
  transitionDuration: opt(0.18),

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
    gap: opt(12, { scss: true }),

    iconSize: opt(28, { scss: true }),
    iconPadding: opt(10, { scss: true }),
    iconBgOpacity: opt(12, { scss: true }), // 0..100 (uses $colors-bg)

    barWidth: opt(170, { scss: true }),
    barHeight: opt(10, { scss: true }),
    barBg: colorWithAlpha({ color: "#111318", alpha: 0.45 }),
    barFill: opt<HexColor>("#1b93fd", { scss: true }),
    ...overrideContainer({})
  },

  brightness: brightness,
}

declare module "src/lib/options/root" {
  interface OptionsRoot {
    osd: OsdOptions;
  }
}

export default osd;
