import giCairo from "cairo";

export type Rgba = { r: number; g: number; b: number; a: number };

export function clearToTransparent(ctx: any) {
    ctx.setOperator(giCairo.Operator.CLEAR);
    ctx.paint();
    ctx.setOperator(giCairo.Operator.OVER);
}

export function roundedRectPath(ctx: any, x: number, y: number, w: number, h: number, r: number) {
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    const pi2 = Math.PI / 2;
    ctx.newPath();
    ctx.arc(x + w - r, y + r, r, -pi2, 0);
    ctx.arc(x + w - r, y + h - r, r, 0, pi2);
    ctx.arc(x + r, y + h - r, r, pi2, Math.PI);
    ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
    ctx.closePath();
}

export function paintSolid(ctx: any, w: number, h: number, rgba: Rgba) {
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
    ctx: any,
    w: number,
    h: number,
    patternSurface: any,
    patternW: number,
    patternH: number,
    tileSizePx: number,
    filter: giCairo.Filter | null = null,
) {
    const size = Math.max(1, tileSizePx | 0);
    const sx = size / Math.max(1, patternW);
    const sy = size / Math.max(1, patternH);

    // Set as any because missing/incorrect Cairo GI typings used by AGS/GJS.
    // Runtime (GJS) exposes these methods on cairo.SurfacePattern,
    // but some TS typings omit them, producing false errors.
    const pat = new giCairo.SurfacePattern(patternSurface) as any;
    pat.setExtend(giCairo.Extend.REPEAT);
    if (filter !== null) pat.setFilter(filter);

    ctx.save();
    ctx.scale(sx, sy);
    ctx.setSource(pat);
    ctx.rectangle(0, 0, w / sx, h / sy);
    ctx.fill();
    ctx.restore();
}

export function punchRoundedHole(ctx: any, x: number, y: number, w: number, h: number, r: number) {
    if (w <= 0 || h <= 0) return;
    ctx.save();
    ctx.setOperator(giCairo.Operator.CLEAR);
    roundedRectPath(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
}
