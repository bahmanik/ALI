import options from "src/configuration";
import giCairo from "cairo";
import { Astal, Gdk } from "ags/gtk4";
import { onCleanup } from "ags";
import type { Gtk } from "ags/gtk4";

import { barsGeometry } from "../shared";
import type { BarsOnMonitor } from "../shared";
import { TechniqueImageService } from "src/services/image/TechniqueImageService";

import {
  clearToTransparent,
  computeInsets,
  forceClickThrough,
  makeClickThrough,
  paintCoverSurface,
  paintSolid,
  paintTiledPattern,
  parseSolidColor,
  punchRoundedHole,
} from "./helpers";

import { CornerWindow } from "./_components";

export default function Corner(gdkmonitor: Gdk.Monitor) {
  let win: Astal.Window;
  let da: Gtk.DrawingArea;

  const monitorId = gdkmonitor.connector;
  const imgSvc = TechniqueImageService.getInstance();

  // --- caches ---
  let outerSurface: giCairo.ImageSurface | null = null;
  let outerW = 1;
  let outerH = 1;

  let patternSurface: giCairo.ImageSurface | null = null;
  let patternW = 1;
  let patternH = 1;

  // --- watch management (path may remain the same while file content changes) ---
  let unwatchOuter: (() => void) | null = null;
  let unwatchPattern: (() => void) | null = null;
  let watchGen = 0;

  const queueDraw = () => {
    try {
      da?.queue_draw();
    } catch {
      // ignore
    }
  };

  const readSolid = () =>
    parseSolidColor(options.bar.corner.solidColor.get?.() ?? "#111318", options.bar.corner.solidOpacity.get?.() ?? 100);

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
    try {
      unwatchOuter?.();
    } catch {
      // ignore
    }
    try {
      unwatchPattern?.();
    } catch {
      // ignore
    }
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

    const fill = options.bar.corner.fill.get?.() ?? "solid";
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
        try {
          u();
        } catch {
          // ignore
        }
      }
    });
  };

  onCleanup(() => {
    stopWatches();
    try {
      win.destroy();
    } catch {
      // ignore
    }
  });

  const visible = options.bar.corner.enable.as ? options.bar.corner.enable.as(Boolean) : options.bar.corner.enable.get();

  return (
    <CornerWindow
      monitorId={monitorId}
      gdkmonitor={gdkmonitor}
      visible={visible}
      onWindow={(self) => {
        win = self;
        makeClickThrough(win);
      }}
      onNotifyVisible={(v) => {
        if (v) forceClickThrough(win);
      }}
      onArea={(self) => {
        da = self;
        subscribeRedraw();
        rewatchAssets();

        da.set_draw_func((_area, ctx: any, w: number, h: number) => {
          if (w <= 0 || h <= 0) return;

          clearToTransparent(ctx);

          const fill = options.bar.corner.fill.get?.() ?? "image";
          const solid = readSolid();

          // --- paint outer area ---
          if (fill === "solid") {
            paintSolid(ctx, w, h, solid);
          } else if (fill === "pattern") {
            if (!patternSurface) {
              // Fallback so you always *see something* while the pattern loads.
              paintSolid(ctx, w, h, solid);
            } else {
              const size = Math.max(1, Number(options.bar.corner.patternSize?.get?.() ?? 12));
              paintTiledPattern(ctx, w, h, patternSurface, patternW, patternH, size);
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
          const geo = barsGeometry.get()[monitorId] ?? {};
          const ins = computeInsets({
            w,
            h,
            // keep runtime compatibility: geo is a plain object at runtime
            geo: geo as BarsOnMonitor,
            gap: options.bar.corner.gap.get(),
            edge: options.bar.corner.edge.get(),
            radius: options.bar.corner.radius.get(),
          });
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
  );
}
