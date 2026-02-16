import app from "ags/gtk4/app";
import giCairo from "cairo";
import { Astal, Gdk } from "ags/gtk4";
import { onCleanup } from "ags";
import type { Gtk } from "ags/gtk4";

import options from "../../configuration";
import { barsGeometry } from "./geometry";
import { TechniqueImageService } from "../../service/image/TechniqueImageService";
import {
  clearToTransparent,
  paintCoverSurface,
  paintSolid,
  paintTiledPattern,
  punchRoundedHole,
  type Rgba,
} from "./cornerPaint";

function makeClickThrough(win: Astal.Window) {
  // GI surfaces can appear a few ticks after window creation.
  let tries = 0;
  const tick = () => {
    const surf = win.get_native()?.get_surface();
    if (surf) {
      // Empty region => window receives NO input => clicks pass through.
      surf.set_input_region(new giCairo.Region());
      return;
    }
    if (++tries < 60) setTimeout(tick, 16);
  };
  tick();
}

type Insets = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  radius: number;
  rectCount: number;
};

export default function Corner(gdkmonitor: Gdk.Monitor) {
  let win: Astal.Window;
  let da: Gtk.DrawingArea;

  const monitorId = gdkmonitor.connector;
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;
  const imgSvc = TechniqueImageService.getInstance();

  // --- caches ---
  let outerSurface: any = null;
  let outerW = 1;
  let outerH = 1;

  let patternSurface: any = null;
  let patternW = 1;
  let patternH = 1;

  // --- watch management (path may remain the same while file content changes) ---
  let unwatchOuter: (() => void) | null = null;
  let unwatchPattern: (() => void) | null = null;
  let watchGen = 0;

  const queueDraw = () => {
    try {
      da?.queue_draw();
    } catch { }
  };

  const parseSolid = (): Rgba => {
    const color = options.bar.corner.solidColor.get?.() ?? "#111318";
    const op = Number(options.bar.corner.solidOpacity.get?.() ?? 100);
    const aMul = Math.max(0, Math.min(1, op > 1 ? op / 100 : op));

    const rgba = new Gdk.RGBA();
    const ok = rgba.parse(color);

    if (!ok) return { r: 0, g: 0, b: 0, a: aMul };
    // GI properties exist at runtime (red/green/blue/alpha)
    // @ts-ignore
    return { r: rgba.red, g: rgba.green, b: rgba.blue, a: rgba.alpha * aMul };
  };

  const computeInsets = (w: number, h: number): Insets => {
    const geo = barsGeometry.get()[monitorId] ?? {};
    const rects = [geo.primary, geo.secondary].filter(Boolean) as any[];

    let top = 0, bottom = 0, left = 0, right = 0;
    for (const r of rects) {
      switch (r.position) {
        case "top": top = Math.max(top, r.y + r.height); break;
        case "bottom": bottom = Math.max(bottom, h - r.y); break;
        case "left": left = Math.max(left, r.x + r.width); break;
        case "right": right = Math.max(right, w - r.x); break;
      }
    }

    const gap = options.bar.corner.gap.get();
    const edge = options.bar.corner.edge.get();

    return {
      top: edge + (top > 0 ? top + gap : 0),
      bottom: edge + (bottom > 0 ? bottom + gap : 0),
      left: edge + (left > 0 ? left + gap : 0),
      right: edge + (right > 0 ? right + gap : 0),
      radius: options.bar.corner.radius.get(),
      rectCount: rects.length,
    };
  };

  const loadOuterFrom = (outPath: string, gen: number) => {
    if (gen !== watchGen) return;
    try {
      outerSurface = giCairo.ImageSurface.createFromPNG(outPath);
      outerW = outerSurface.getWidth();
      outerH = outerSurface.getHeight();
      queueDraw();
    } catch (e) {
      console.error("corner outerImage load failed:", e);
    }
  };

  const loadPatternFrom = (outPath: string, gen: number) => {
    if (gen !== watchGen) return;
    try {
      patternSurface = giCairo.ImageSurface.createFromPNG(outPath);
      patternW = patternSurface.getWidth();
      patternH = patternSurface.getHeight();
      queueDraw();
    } catch (e) {
      console.error("corner pattern load failed:", e);
    }
  };

  const stopWatches = () => {
    try { unwatchOuter?.(); } catch { }
    try { unwatchPattern?.(); } catch { }
    unwatchOuter = null;
    unwatchPattern = null;
  };

  const rewatchAssets = () => {
    const gen = ++watchGen;
    stopWatches();

    // Clear old content immediately, so stale wallpaper doesn't linger.
    outerSurface = null;
    patternSurface = null;
    queueDraw();

    const fill = options.bar.corner.fill.get?.() ?? "image";
    if (fill === "solid") return;

    if (fill === "image") {
      const src = options.bar.corner.outerImage.get();
      if (!src) return;

      const enabled = options.bar.corner.enableTechnique.get();
      const technique = options.bar.corner.technique.get();

      unwatchOuter = imgSvc.watchCornerOuterImage(src, enabled, technique, (outPath) => {
        loadOuterFrom(outPath, gen);
      });
      return;
    }

    if (fill === "pattern") {
      const p = options.bar.corner.patternPath?.get?.() ?? "none";
      if (!p || p === "none") return;

      // convert to png + watch file changes (no technique for patterns)
      unwatchPattern = imgSvc.watch(p, false, "none", "corner-pattern", (outPath) => {
        loadPatternFrom(outPath, gen);
      });
    }
  };

  const subscribeRedraw = () => {
    const unsubs: Array<() => void> = [];

    // geometry changes
    unsubs.push(barsGeometry.subscribe(queueDraw));

    // hole geometry
    unsubs.push(options.bar.corner.gap.subscribe(queueDraw));
    unsubs.push(options.bar.corner.edge.subscribe(queueDraw));
    unsubs.push(options.bar.corner.radius.subscribe(queueDraw));

    // solid
    unsubs.push(options.bar.corner.solidColor.subscribe(queueDraw));
    unsubs.push(options.bar.corner.solidOpacity.subscribe(queueDraw));

    // pattern sizing
    unsubs.push(options.bar.corner.patternSize?.subscribe?.(queueDraw) ?? (() => { }));

    // rebuild when any input that affects sources changes
    const reload = () => rewatchAssets();
    unsubs.push(options.bar.corner.fill.subscribe(reload));
    unsubs.push(options.bar.corner.outerImage.subscribe(reload));
    unsubs.push(options.bar.corner.enableTechnique.subscribe(reload));
    unsubs.push(options.bar.corner.technique.subscribe(reload));
    unsubs.push(options.bar.corner.patternPath?.subscribe?.(reload) ?? (() => { }));

    onCleanup(() => {
      for (const u of unsubs) {
        try { u(); } catch { }
      }
    });
  };

  onCleanup(() => {
    stopWatches();
    try { win.destroy(); } catch { }
  });

  return (
    <window
      name={`corner-${monitorId}`}
      application={app}
      gdkmonitor={gdkmonitor}
      visible={options.bar.corner.enable.as ? options.bar.corner.enable.as(Boolean) : options.bar.corner.enable.get()}
      layer={Astal.Layer.BOTTOM}
      exclusivity={Astal.Exclusivity.IGNORE}
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      css="background: transparent;"
      $={(self) => {
        win = self;
        makeClickThrough(win);
      }}
      onNotifyVisible={({ visible }) => {
        if (visible) win.get_native()?.get_surface()?.set_input_region(new giCairo.Region());
      }}
    >
      <drawingarea
        hexpand
        vexpand
        canFocus={false}
        sensitive={false}
        $={(self: Gtk.DrawingArea) => {
          da = self;
          subscribeRedraw();
          rewatchAssets();

          da.set_draw_func((_area, ctx: any, w: number, h: number) => {
            if (w <= 0 || h <= 0) return;

            clearToTransparent(ctx);

            const fill = options.bar.corner.fill.get?.() ?? "image";
            const solid = parseSolid();

            // --- paint outer area ---
            if (fill === "solid") {
              paintSolid(ctx, w, h, solid);
            } else if (fill === "pattern") {
              if (!patternSurface) {
                // Fallback so you always *see something* while the pattern loads.
                paintSolid(ctx, w, h, solid);
              } else {
                const size = Math.max(1, Number(options.bar.corner.patternSize?.get?.() ?? 12));
                paintTiledPattern(ctx, w, h, patternSurface, patternW, patternH, size, null);
              }
            } else {
              // image
              if (!outerSurface) {
                // Fallback while the image loads.
                paintSolid(ctx, w, h, solid);
              } else {
                paintCoverSurface(ctx, w, h, outerSurface, outerW, outerH);
              }
            }

            // --- punch inner hole (make the frame) ---
            const ins = computeInsets(w, h);
            const x = ins.left;
            const y = ins.top;
            const iw = Math.max(0, w - ins.left - ins.right);
            const ih = Math.max(0, h - ins.top - ins.bottom);

            // Avoid the "clear everything" case (e.g. edge=0 and no bar rects yet).
            const holeIsWholeSurface = x === 0 && y === 0 && iw === w && ih === h;
            if (!holeIsWholeSurface) {
              ctx.setAntialias(giCairo.Antialias.BEST);
              punchRoundedHole(ctx, x, y, iw, ih, ins.radius);
            }
          });
        }}
      />
    </window>
  );
}
