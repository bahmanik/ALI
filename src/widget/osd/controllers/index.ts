export * from "./shared";

export * from "./sound";
export * from "./mic";
export * from "./brightness";
export * from "./keyboardBrightness";

import type { OsdKind } from "./shared";
import { OsdController } from "./shared";

import { soundController } from "./sound";
import { micController } from "./mic";
import { brightnessController } from "./brightness";
import { keyboardBrightnessController } from "./keyboardBrightness";

export function controllerForKind(kind: OsdKind): OsdController {
  switch (kind) {
    case "sound":
      return soundController;
    case "mic":
      return micController;
    case "brightness":
      return brightnessController;
    case "keyboardBrightness":
      return keyboardBrightnessController;
    default:
      return soundController;
  }
}
