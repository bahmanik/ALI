import type Gdk from "gi://Gdk?version=4.0";

import Osd from "./Osd";
import {
  soundController,
  micController,
  brightnessController,
  keyboardBrightnessController,
} from "./controller";

export function PrimaryOsd(monitor: Gdk.Monitor) {
  return (
    <Osd
      name={`sound-osd-${(monitor as any).connector}`}
      gdkmonitor={monitor}
      namespace="osd"
      kind="sound"
      controller={soundController}
    />
  );
}

export function SecondaryOsd(monitor: Gdk.Monitor) {
  return (
    <Osd
      name={`mic-osd-${(monitor as any).connector}`}
      gdkmonitor={monitor}
      namespace="mic-osd"
      kind="mic"
      controller={micController}
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
      controller={brightnessController}
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
      controller={keyboardBrightnessController}
    />
  );
}
