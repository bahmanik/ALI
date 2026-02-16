import AstalWp from "gi://AstalWp";

import app from "ags/gtk4/app";
import Gdk from "gi://Gdk?version=4.0";
import BrightnessService from "src/service/brightness";
import icons from "src/lib/icons/icons";
import options from "src/configuration";

export type OsdKind = "sound" | "mic" | "brightness" | "keyboardBrightness";

export type OsdEvent = {
  kind: OsdKind;
  monitorConnector: string;
  title: string;
  iconName: string;
  /** 0..1 for LevelBar */
  value: number;
  /** integer (can exceed 100) */
  percent: number;
  overflow: boolean;
};

type Listener = (ev: OsdEvent) => void;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function pickPrimaryMonitorConnector(monitors: Gdk.Monitor[]): string {
  for (const m of monitors) {
    try {
      // GTK/GDK4 naming differs per binding; keep it defensive
      const isPrimaryFn = (m as any).is_primary;
      if (typeof isPrimaryFn === "function" && isPrimaryFn.call(m)) return (m as any).connector ?? "";
      if (typeof (m as any).isPrimary === "function" && (m as any).isPrimary()) return (m as any).connector ?? "";
      if (Boolean((m as any).is_primary)) return (m as any).connector ?? "";
    } catch {
      /* noop */
    }
  }
  return (monitors[0] as any)?.connector ?? "";
}

function pickCursorMonitorConnector(monitors: Gdk.Monitor[]): string | null {
  try {
    // NOTE: GDK4 API varies a bit across bindings; keep this best-effort.
    const display = (globalThis as any).Gdk?.Display?.get_default?.() ?? null;
    const seat = display?.get_default_seat?.() ?? null;
    const pointer = seat?.get_pointer?.() ?? null;

    if (!pointer) return null;

    // Possible signatures:
    // - [surface, x, y]
    // - [x, y]
    // - { x, y }
    const pos = pointer.get_position?.();

    let x: number | undefined;
    let y: number | undefined;

    if (Array.isArray(pos)) {
      if (pos.length >= 3 && typeof pos[1] === "number" && typeof pos[2] === "number") {
        x = pos[1];
        y = pos[2];
      } else if (pos.length >= 2 && typeof pos[0] === "number" && typeof pos[1] === "number") {
        x = pos[0];
        y = pos[1];
      }
    } else if (pos && typeof pos === "object") {
      if (typeof (pos as any).x === "number" && typeof (pos as any).y === "number") {
        x = (pos as any).x;
        y = (pos as any).y;
      }
    }

    if (typeof x !== "number" || typeof y !== "number") return null;

    for (const m of monitors) {
      const geo = (m as any).get_geometry?.();
      if (!geo) continue;
      const mx = (geo as any).x ?? 0;
      const my = (geo as any).y ?? 0;
      const mw = (geo as any).width ?? 0;
      const mh = (geo as any).height ?? 0;

      if (x >= mx && x < mx + mw && y >= my && y < my + mh) return (m as any).connector ?? null;
    }

    return null;
  } catch {
    return null;
  }
}

function pickTargetMonitorConnector(): string {
  const monitors = (app.get_monitors?.() ?? []) as unknown as Gdk.Monitor[];
  if (!monitors.length) return "";
  return pickCursorMonitorConnector(monitors) ?? pickPrimaryMonitorConnector(monitors);
}

class OsdController {
  public readonly kind: OsdKind;
  readonly #listeners = new Set<Listener>();

  constructor(kind: OsdKind) {
    this.kind = kind;
  }

  public subscribe(cb: Listener): () => void {
    this.#listeners.add(cb);
    return () => this.#listeners.delete(cb);
  }

  protected emit(partial: Omit<OsdEvent, "kind" | "monitorConnector">): void {
    const monitorConnector = pickTargetMonitorConnector();
    const ev: OsdEvent = {
      kind: this.kind,
      monitorConnector,
      ...partial,
    };

    for (const cb of this.#listeners) {
      try {
        cb(ev);
      } catch {
        /* noop */
      }
    }
  }
}

function osdEnabled(): boolean {
  try {
    return Boolean((options as any).osd?.enable?.get?.() ?? true);
  } catch {
    return true;
  }
}

function sourceEnabled(key: "volume" | "microphone" | "brightness" | "keyboardBrightness"): boolean {
  try {
    const s = (options as any).osd?.sources;
    const opt = s?.[key];
    const v = opt?.get?.();
    return Boolean(v ?? true);
  } catch {
    return true;
  }
}

class SoundController extends OsdController {
  #started = false;

  constructor() {
    super("sound");
    this.#start();
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;

    // Start listeners even if disabled; the option may be toggled later.

    try {
      const wp = AstalWp.get_default?.();
      const speaker = (wp as any)?.defaultSpeaker;
      if (!speaker) return;

      const update = () => {
        if (!osdEnabled() || !sourceEnabled("volume")) return;

        const mute = Boolean((speaker as any).mute);
        const vol = Number((speaker as any).volume);
        const rawPct = Math.round((mute ? 0 : vol) * 100);
        const overflow = rawPct > 100;

        const iconName =
          typeof (speaker as any).volumeIcon === "string"
            ? (speaker as any).volumeIcon
            : mute
              ? icons.audio.volume.muted
              : vol > 1
                ? icons.audio.volume.overamplified
                : vol > 0.66
                  ? icons.audio.volume.high
                  : vol > 0.33
                    ? icons.audio.volume.medium
                    : vol > 0
                      ? icons.audio.volume.low
                      : icons.audio.volume.muted;

        this.emit({
          title: "Volume",
          iconName,
          percent: rawPct,
          value: clamp01(rawPct / 100),
          overflow,
        });
      };

      speaker.connect?.("notify::volume", update);
      speaker.connect?.("notify::mute", update);

      // initial snapshot
      update();
    } catch (err) {
      console.warn("[OSD] Sound controller unavailable:", err);
    }
  }
}

class MicController extends OsdController {
  #started = false;

  constructor() {
    super("mic");
    this.#start();
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;

    try {
      const wp = AstalWp.get_default?.();
      const mic = (wp as any)?.defaultMicrophone ?? (wp as any)?.audio?.defaultMicrophone;
      if (!mic) return;

      const update = () => {
        if (!osdEnabled() || !sourceEnabled("microphone")) return;

        const mute = Boolean((mic as any).mute);
        const vol = Number((mic as any).volume);
        const rawPct = Math.round((mute ? 0 : vol) * 100);
        const overflow = rawPct > 100;

        const iconName =
          mute
            ? icons.audio.mic.muted
            : vol > 0.66
              ? icons.audio.mic.high
              : vol > 0.33
                ? icons.audio.mic.medium
                : vol > 0
                  ? icons.audio.mic.low
                  : icons.audio.mic.muted;

        this.emit({
          title: "Microphone",
          iconName,
          percent: rawPct,
          value: clamp01(rawPct / 100),
          overflow,
        });
      };

      mic.connect?.("notify::volume", update);
      mic.connect?.("notify::mute", update);

      update();
    } catch (err) {
      console.warn("[OSD] Microphone controller unavailable:", err);
    }
  }
}

class BrightnessController extends OsdController {
  #started = false;

  constructor() {
    super("brightness");
    this.#start();
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;

    try {
      const brightness = BrightnessService.getInstance();

      const update = () => {
        if (!osdEnabled() || !sourceEnabled("brightness")) return;
        if (!brightness.available) return;

        const pct = Number(brightness.screenPercent);
        const rawPct = Math.round(Number.isFinite(pct) ? pct : 0);

        this.emit({
          title: "Brightness",
          iconName: icons.brightness.screen,
          percent: rawPct,
          value: clamp01(rawPct / 100),
          overflow: rawPct > 100,
        });
      };

      brightness.connect?.("notify::screen", update);
      update();
    } catch (err) {
      console.warn("[OSD] Brightness controller unavailable:", err);
    }
  }
}

class KeyboardBrightnessController extends OsdController {
  #started = false;

  constructor() {
    super("keyboardBrightness");
    this.#start();
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;

    try {
      const brightness = BrightnessService.getInstance();

      const update = () => {
        if (!osdEnabled() || !sourceEnabled("keyboardBrightness")) return;
        if (!brightness.available) return;

        const pct = Math.round((Number(brightness.kbdPercent) || 0) * 100);

        this.emit({
          title: "Keyboard",
          iconName: icons.brightness.keyboard,
          percent: pct,
          value: clamp01(pct / 100),
          overflow: pct > 100,
        });
      };

      brightness.connect?.("notify::kbd-percent", update);
      update();
    } catch (err) {
      console.warn("[OSD] Keyboard brightness controller unavailable:", err);
    }
  }
}

export const soundController = new SoundController();
export const micController = new MicController();
export const brightnessController = new BrightnessController();
export const keyboardBrightnessController = new KeyboardBrightnessController();

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
