import giCairo from "cairo";
import { useDrawingArea } from "../orbitAnimation/hooks";

export const FusedRect = () => {
  const { widget: canvas } = useDrawingArea((ctx, w, h) => {
    ctx.save()
    ctx.stroke()
    let r = 12; // Must match the border-radius of your grid items!

    // Let's say this cell has a neighbor above and to the right
    let config: RectConfig = {
      tl: ['inward'],
      tr: ['outward-v', 'outward-h'],
      br: ['outward-v'],
      bl: ['inward']
    };

    ctx.setSourceRGBA(0.1, 0.1, 0.1, 1.0); // Background color (Rect A)
    drawFusedRect(ctx, 100, 100, w / 2, h / 2, r, config);
    ctx.fill();
    ctx.restore()
  })

  type CornerStyle = 'inward' | 'outward-h' | 'outward-v';

  interface RectConfig {
    tl: CornerStyle[];
    tr: CornerStyle[];
    br: CornerStyle[];
    bl: CornerStyle[];
  }

  function drawFusedRect(
    ctx: giCairo.Context,
    x: number, y: number, w: number, h: number, r: number,
    config: RectConfig
  ) {
    const PI = Math.PI;

    ctx.newPath();

    // --- 1. TOP LEFT ---
    if (config.tl.includes('outward-h')) ctx.arc(x - r, y + r, r, 1.5 * PI, 0);
    if (config.tl.includes('outward-v')) ctx.arc(x + r, y - r, r, 0.5 * PI, PI);
    if (config.tl.includes('inward')) ctx.arc(x + r, y + r, r, PI, 1.5 * PI);

    // --- 2. TOP RIGHT ---
    // If both neighbors exist, the 'v' arc brings us to (x+w, y), 
    // then the 'h' arc takes us from (x+w, y) out to the right.
    if (config.tr.includes('outward-v')) ctx.arc(x + w - r, y - r, r, 0, 0.5 * PI);
    if (config.tr.includes('outward-h')) ctx.arc(x + w + r, y + r, r, PI, 1.5 * PI);
    if (config.tr.includes('inward')) ctx.arc(x + w - r, y + r, r, 1.5 * PI, 0);

    // --- 3. BOTTOM RIGHT ---
    if (config.br.includes('outward-h')) ctx.arc(x + w + r, y + h - r, r, 0.5 * PI, PI);
    if (config.br.includes('outward-v')) ctx.arc(x + w - r, y + h + r, r, 1.5 * PI, 0);
    if (config.br.includes('inward')) ctx.arc(x + w - r, y + h - r, r, 0, 0.5 * PI);

    // --- 4. BOTTOM LEFT ---
    if (config.bl.includes('outward-v')) ctx.arc(x + r, y + h + r, r, PI, 1.5 * PI);
    if (config.bl.includes('outward-h')) ctx.arc(x - r, y + h - r, r, 0, 0.5 * PI);
    if (config.bl.includes('inward')) ctx.arc(x + r, y + h - r, r, 0.5 * PI, PI);

    ctx.closePath();
  }
  return canvas
}

export default FusedRect
