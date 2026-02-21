import { Gtk } from "ags/gtk4";

export type Rect = { x: number; y: number; w: number; h: number };

export function translateXY(from: Gtk.Widget, to: Gtk.Widget): { x: number; y: number } | null {
  try {
    const tr = (from as any).translate_coordinates?.(to as any, 0, 0);

    if (Array.isArray(tr)) {
      // [ok, x, y]
      if (tr.length >= 3 && typeof tr[0] === "boolean") {
        if (!tr[0]) return null;
        return { x: Number(tr[1]) || 0, y: Number(tr[2]) || 0 };
      }
      // [x, y]
      if (tr.length >= 2 && typeof tr[0] === "number" && typeof tr[1] === "number") {
        return { x: Number(tr[0]) || 0, y: Number(tr[1]) || 0 };
      }
    } else if (tr && typeof tr === "object") {
      if ("x" in (tr as any) && "y" in (tr as any)) {
        return { x: Number((tr as any).x) || 0, y: Number((tr as any).y) || 0 };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function widgetRectIn(child: Gtk.Widget, dest: Gtk.Widget): Rect | null {
  const p = translateXY(child, dest);
  if (!p) return null;

  const w = Math.max(0, Number((child as any).get_allocated_width?.() ?? 0));
  const h = Math.max(0, Number((child as any).get_allocated_height?.() ?? 0));
  return { x: p.x, y: p.y, w, h };
}

export function rectContains(r: Rect, px: number, py: number): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
