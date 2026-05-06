import type { OsdKind } from "./shared";
import { OsdController } from "./shared";
import { getSoundController } from "./sound";
import { getKdBrightnessController } from "./kbBrightness";
import { getBrightnessController } from "./brightness";
import { getMicController } from "./microphone";

export function controllerForKind(kind: OsdKind): OsdController {
  switch (kind) {
    case "sound":
      return getSoundController();
    case "mic":
      return getMicController();
    case "brightness":
      return getBrightnessController();
    case "keyboardBrightness":
      return getKdBrightnessController();
    default:
      return getSoundController();
  }
}
