import type Gdk from "gi://Gdk?version=4.0";

import Osd from "./Osd";
import { controllerForKind } from "./controllers";

export function SoundOsd(monitor: Gdk.Monitor) {
  return (
    <Osd
      name={`sound-osd-${(monitor as any).connector}`}
      gdkmonitor={monitor}
      namespace="osd"
      kind="sound"
      controller={controllerForKind("sound")}
    />
  );
}

export function MicOsd(monitor: Gdk.Monitor) {
  return (
    <Osd
      name={`mic-osd-${(monitor as any).connector}`}
      gdkmonitor={monitor}
      namespace="mic-osd"
      kind="mic"
      controller={controllerForKind("mic")}
    />
  );
}

export function BrightnessOsd(monitor: Gdk.Monitor) {
  return (
    <Osd
      name={`brightness-osd-${(monitor as any).connector}`}
      gdkmonitor={monitor}
      namespace="brightness-osd"
      kind="brightness"
      controller={controllerForKind("brightness")}
    />
  );
}

export function KeyboardBrightnessOsd(monitor: Gdk.Monitor) {
  return (
    <Osd
      name={`kbd-osd-${(monitor as any).connector}`}
      gdkmonitor={monitor}
      namespace="kbd-osd"
      kind="keyboardBrightness"
      controller={controllerForKind("keyboardBrightness")}
    />
  );
}
