import app from "ags/gtk4/app";
import Gdk from "gi://Gdk?version=4.0";

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

export type Listener = (ev: OsdEvent) => void;

export const VOLUME_MAX = 1.5; // 150% (matches overflow behavior)

export function clamp01(n: number): number {
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

export function pickTargetMonitorConnector(): string {
  const monitors = (app.get_monitors?.() ?? []) as unknown as Gdk.Monitor[];
  if (!monitors.length) return "";
  return pickCursorMonitorConnector(monitors) ?? pickPrimaryMonitorConnector(monitors);
}

export class OsdController {
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

  /** Whether this controller supports setting the value (interactive slider). */
  public canSet(): boolean {
    return false;
  }

  /** Set the value with a 0..1 normalized input (clamped). */
  public setNormalized(_v: number): void {
    // default: no-op
  }
}

export function osdEnabled(): boolean {
  try {
    return Boolean((options as any).osd?.enable?.get?.() ?? true);
  } catch {
    return true;
  }
}

export function sourceEnabled(
  key: "volume" | "microphone" | "brightness" | "keyboardBrightness",
): boolean {
  try {
    const s = (options as any).osd?.sources;
    const opt = s?.[key];
    const v = opt?.get?.();
    return Boolean(v ?? true);
  } catch {
    return true;
  }
}
