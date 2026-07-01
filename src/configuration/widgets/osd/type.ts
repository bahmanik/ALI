import type { Opt } from "src/lib/options";
import type {
  AnchorLayoutType,
  ColorWithAlpha,
  HexColor,
  OsdOrientation,
} from "src/configuration/types";
import type { OsdBrightnessOptions } from "./brightness/type";
import { ContainerStyleOptions } from "src/lib/options/factories/overrideContainer";
import { RevealTransitionWithAuto } from "src/configuration/enums";

export interface OsdStyleOptions extends ContainerStyleOptions {
  fg: ColorWithAlpha;
  gap: Opt<number>;
  iconSize: Opt<number>;
  iconPadding: Opt<number>;
  iconBgOpacity: Opt<number>;

  barWidth: Opt<number>;
  barHeight: Opt<number>;
  barBg: ColorWithAlpha;
  barFill: Opt<HexColor>;
}

export interface OsdOptions {
  enable: Opt<boolean>;
  timeoutDuration: Opt<number>;
  startupDelayMs: Opt<number>;

  layout: Opt<AnchorLayoutType>;
  orientation: Opt<OsdOrientation>;

  revealTransition: Opt<RevealTransitionWithAuto>;
  transitionDuration: Opt<number>;

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
