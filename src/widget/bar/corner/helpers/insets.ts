import type { BarsOnMonitor } from "../../shared";

export type Insets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  radius: number;
  rectCount: number;
};

export function computeInsets(args: {
  w: number;
  h: number;
  geo: BarsOnMonitor;
  gap: number;
  edge: number;
  radius: number;
}): Insets {
  const { w, h, geo, gap, edge, radius } = args;

  const rects = [geo.primary, geo.secondary].filter(Boolean) as any[];

  let top = 0,
    bottom = 0,
    left = 0,
    right = 0;
  for (const r of rects) {
    switch (r.position) {
      case "top":
        top = Math.max(top, r.y + r.height);
        break;
      case "bottom":
        bottom = Math.max(bottom, h - r.y);
        break;
      case "left":
        left = Math.max(left, r.x + r.width);
        break;
      case "right":
        right = Math.max(right, w - r.x);
        break;
    }
  }

  return {
    top: edge + (top > 0 ? top + gap : 0),
    bottom: edge + (bottom > 0 ? bottom + gap : 0),
    left: edge + (left > 0 ? left + gap : 0),
    right: edge + (right > 0 ? right + gap : 0),
    radius,
    rectCount: rects.length,
  };
}
