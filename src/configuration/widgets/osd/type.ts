import type { Opt } from "src/lib/options";
import type {
  AnchorLayoutType,
  ColorWithAlpha,
  GtkRevealerTransitionName,
  HexColor,
  OsdOrientation,
} from "src/configuration/types";
import type { OsdBrightnessOptions } from "./brightness/type";
import { ContainerStyleOptions } from "src/lib/options/factories/overrideContainer";

export interface OsdStyleOptions extends ContainerStyleOptions {
  fg: ColorWithAlpha;
  gap: Opt<number>;
  margin: Opt<number>;
  iconSize: Opt<number>;
  iconPadding: Opt<number>;
  iconBgOpacity: Opt<number>;

  barWidth: Opt<number>;
  barHeight: Opt<number>;
  barBg: ColorWithAlpha;
  barFill: Opt<HexColor>;     // fully opaque accent — HexColor is correct here
}

export interface OsdOptions {
  enable: Opt<boolean>;
  timeoutMs: Opt<number>;
  startupDelayMs: Opt<number>;

  location: Opt<AnchorLayoutType>;
  orientation: Opt<OsdOrientation>;

  revealTransition: Opt<"AUTO" | GtkRevealerTransitionName>;
  transitionDuration: Opt<number>; // seconds — was transitionDurationMs (integer ms), now float

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

  style: OsdStyleOptions;
  brightness: OsdBrightnessOptions;
}
