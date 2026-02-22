import { Gdk } from "ags/gtk4";
import type { Rgba } from "./cornerPaint";

export function parseSolidColor(rawColor: unknown, rawOpacity: unknown): Rgba {
  const color = typeof rawColor === "string" && rawColor.length > 0 ? rawColor : "#111318";
  const op = Number(rawOpacity ?? 100);
  const aMul = Math.max(0, Math.min(1, op > 1 ? op / 100 : op));

  const rgba = new Gdk.RGBA();
  const ok = rgba.parse(color);

  if (!ok) return { r: 0, g: 0, b: 0, a: aMul };
  // GI properties exist at runtime (red/green/blue/alpha)
  // @ts-ignore
  return { r: rgba.red, g: rgba.green, b: rgba.blue, a: rgba.alpha * aMul };
}
