import giCairo from "cairo";

export type Rgba = { r: number; g: number; b: number; a: number };

export function clearToTransparent(ctx: giCairo.Context) {
    ctx.setOperator(giCairo.Operator.CLEAR);
    ctx.paint();
    ctx.setOperator(giCairo.Operator.OVER);
}

export function roundedRectPath(ctx: giCairo.Context, x: number, y: number, w: number, h: number, r: number) {
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    const pi2 = Math.PI / 2;
    ctx.newPath();
    ctx.arc(x + w - r, y + r, r, -pi2, 0);
    ctx.arc(x + w - r, y + h - r, r, 0, pi2);
    ctx.arc(x + r, y + h - r, r, pi2, Math.PI);
    ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
    ctx.closePath();
}

export function paintSolid(ctx: giCairo.Context, w: number, h: number, rgba: Rgba) {
    ctx.save();
    ctx.setSourceRGBA(rgba.r, rgba.g, rgba.b, rgba.a);
    ctx.rectangle(0, 0, w, h);
    ctx.fill();
    ctx.restore();
}

export function paintCoverSurface(ctx: any, w: number, h: number, surface: any, surfaceW: number, surfaceH: number) {
    const scale = Math.max(w / surfaceW, h / surfaceH);
    const drawW = surfaceW * scale;
    const drawH = surfaceH * scale;
    const offX = (w - drawW) / 2;
    const offY = (h - drawH) / 2;

    ctx.save();
    ctx.translate(offX, offY);
    ctx.scale(scale, scale);
    ctx.setSourceSurface(surface, 0, 0);
    ctx.paint();
    ctx.restore();
}

/**
 * Tiles an image surface by repeating a SurfacePattern.
 * We avoid pattern matrices because GI bindings can be inconsistent there.
 * Instead, we scale user-space to get the desired tile size.
 */
export function paintTiledPattern(
    ctx: giCairo.Context,
    w: number,
    h: number,
    patternSurface: giCairo.ImageSurface,
    patternW: number,
    patternH: number,
    tileSizePx: number,
): void {
    // Guards
    if (!patternSurface || patternW <= 0 || patternH <= 0 || w <= 0 || h <= 0) return
    ctx.save()

    // Restrict drawing to the destination rect to avoid overdraw
    ctx.rectangle(0, 0, w, h)
    ctx.clip()

    // Uniform scale so pattern keeps aspect ratio.
    // We scale the source so its larger dimension maps to tileSizePx.
    const sourceMax = Math.max(1, Math.max(patternW, patternH))
    let scale = tileSizePx / sourceMax * 20

    // Final tile size in device/user units
    const tileW = patternW * scale
    const tileH = patternH * scale

    // Number of tiles needed to cover the destination (add one extra to cover edges)
    const cols = Math.max(1, Math.ceil(w / tileW) + 1)
    const rows = Math.max(1, Math.ceil(h / tileH) + 1)

    for (let row = 0; row < rows; row++) {
        const y = row * tileH
        for (let col = 0; col < cols; col++) {
            const x = col * tileW

            ctx.save()
            // move to tile origin and scale so that drawing the source covers tileW x tileH
            ctx.translate(x, y)
            ctx.scale(scale, scale)

            // draw the image surface at (0,0) in *unscaled* source pixels
            ctx.setSourceSurface(patternSurface, 0, 0)
            ctx.rectangle(0, 0, patternW, patternH)
            ctx.fill()

            ctx.restore()
        }
    }

    ctx.restore()
}

export function punchRoundedHole(ctx: giCairo.Context, x: number, y: number, w: number, h: number, r: number) {
    if (w <= 0 || h <= 0) return;
    ctx.save();
    ctx.setOperator(giCairo.Operator.CLEAR);
    roundedRectPath(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
}
