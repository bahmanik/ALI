import type { Opt } from "src/lib/options";
import type {
  AnchorLayoutType,
  GtkRevealerTransitionName,
  HexColor,
  OsdOrientation,
} from "src/configuration/types";
import type { OsdBrightnessOptions } from "./brightness/type";

export interface OsdOptions {
  enable: Opt<boolean>;

  timeoutMs: Opt<number>;
  startupDelayMs: Opt<number>;

  location: Opt<AnchorLayoutType>;
  orientation: Opt<OsdOrientation>;

  revealTransition: Opt<"AUTO" | GtkRevealerTransitionName>;
  transitionDurationMs: Opt<number>;

  sources: {
    volume: Opt<boolean>;
    microphone: Opt<boolean>;
    brightness: Opt<boolean>;
    keyboardBrightness: Opt<boolean>;
  };

  interactive: {
    enable: Opt<boolean>;
    step: Opt<number>;
    lockTimeoutWhileDragging: Opt<boolean>;
  };

  style: {
    width: Opt<number>;
    height: Opt<number>;
    radius: Opt<number>;
    padding: Opt<number>;
    gap: Opt<number>;
    margin: Opt<number>;

    fg: Opt<HexColor>;
    bg: Opt<HexColor>;
    bgOpacity: Opt<number>;

    borderEnable: Opt<boolean>;
    borderWidth: Opt<number>;
    borderColor: Opt<HexColor>;
    borderOpacity: Opt<number>;

    shadowEnable: Opt<boolean>;
    shadowMargin: Opt<number>;
    shadowX: Opt<number>;
    shadowY: Opt<number>;
    shadowBlur: Opt<number>;
    shadowSpread: Opt<number>;
    shadowColor: Opt<string>;

    iconSize: Opt<number>;
    iconPadding: Opt<number>;
    iconBgOpacity: Opt<number>;

    barWidth: Opt<number>;
    barHeight: Opt<number>;
    barBg: Opt<HexColor>;
    barBgOpacity: Opt<number>;
    barFill: Opt<HexColor>;
  };

  brightness: OsdBrightnessOptions;
}
