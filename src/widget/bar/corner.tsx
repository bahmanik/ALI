import app from "ags/gtk4/app";
import { Astal, Gtk } from "ags/gtk4";
import Gdk from "gi://Gdk?version=4.0";
import giCairo from "cairo";
import { onCleanup } from "ags";

import options from "../../configuration";
import { barsGeometry } from "./geometry";
import { TechniqueImageService } from "../../service/image/TechniqueImageService";

function makeClickThrough(win: Astal.Window) {
  let tries = 0;
  const tick = () => {
    const surf = win.get_native()?.get_surface();
    if (surf) {
      // Empty region => window receives NO input => clicks pass through
      surf.set_input_region(new giCairo.Region());
      return;
    }

    if (++tries < 60) setTimeout(tick, 16);
  };
  tick();
}

function roundedRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  const pi2 = Math.PI / 2;
  ctx.newPath();
  ctx.arc(x + w - r, y + r, r, -pi2, 0);
  ctx.arc(x + w - r, y + h - r, r, 0, pi2);
  ctx.arc(x + r, y + h - r, r, pi2, Math.PI);
  ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
  ctx.closePath();
}

export default function Corner(gdkmonitor: Gdk.Monitor) {
  let win: Astal.Window;
  let da: Gtk.DrawingArea;

  const monitorId = gdkmonitor.connector;
  const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor;

  // Gate painting until drawingarea has a real allocation
  const monGeo = gdkmonitor.get_geometry?.();
  const MON_W = monGeo?.width ?? 0;
  const MON_H = monGeo?.height ?? 0;
  const MONITOR_ALLOC_RATIO = 0.85;
  const MIN_W = MON_W ? Math.floor(MON_W * MONITOR_ALLOC_RATIO) : 800;
  const MIN_H = MON_H ? Math.floor(MON_H * MONITOR_ALLOC_RATIO) : 600;

  const imgSvc = TechniqueImageService.getInstance();

  // Outer image surface cache
  let surface: any = null;
  let surfaceW = 1;
  let surfaceH = 1;

  // Watch management (important: path can stay the same while file content changes)
  let unwatch: (() => void) | null = null;
  let watchGen = 0;

  const queueDraw = () => {
    try { da?.queue_draw(); } catch { }
  };

  const computeInsets = (w: number, h: number) => {
    const geo = barsGeometry.get()[monitorId] ?? {};
    const rects = [geo.primary, geo.secondary].filter(Boolean) as any[];

    let top = 0, bottom = 0, left = 0, right = 0;
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

  const loadSurfaceFrom = (outPath: string, gen: number) => {
    if (gen !== watchGen) return;

    try {
      // Reload even if outPath string is identical (file may have been overwritten)
      surface = giCairo.ImageSurface.createFromPNG(outPath);
      surfaceW = surface.getWidth();
      surfaceH = surface.getHeight();
      queueDraw();
    } catch (e) {
      console.error("corner outerImage load failed:", e);
    }
  };

  const rewatchImage = () => {
    // bump generation so late callbacks are ignored
    const gen = ++watchGen;

    // stop old watch
    unwatch?.();
    unwatch = null;

    // clear immediately (so old wallpaper doesn't linger)
    surface = null;
    queueDraw();

    const src = options.bar.corner.outerImage.get();
    if (!src) return;

    const enabled = options.bar.corner.enableTechnique.get();
    const technique = options.bar.corner.technique.get();

    unwatch = imgSvc.watchCornerOuterImage(src, enabled, technique, (outPath) => {
      loadSurfaceFrom(outPath, gen);
    });
  };

  const wireRedraw = () => {
    const unsubs: Array<() => void> = [];

    // redraw when bar geometry changes
    unsubs.push(barsGeometry.subscribe(queueDraw));

    // redraw when corner config changes
    unsubs.push(options.bar.corner.gap.subscribe(queueDraw));
    unsubs.push(options.bar.corner.edge.subscribe(queueDraw));
    unsubs.push(options.bar.corner.radius.subscribe(queueDraw));

    // rebuild/reload image when its inputs change (path/technique/enable)
    const reload = () => rewatchImage();
    unsubs.push(options.bar.corner.outerImage.subscribe(reload));
    unsubs.push(options.bar.corner.enableTechnique.subscribe(reload));
    unsubs.push(options.bar.corner.technique.subscribe(reload));

    onCleanup(() => {
      for (const u of unsubs) {
        try { u(); } catch { }
      }
    });
  };

  onCleanup(() => {
    unwatch?.();
    unwatch = null;
    win.destroy();
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
          wireRedraw();
          rewatchImage();

          da.set_draw_func((_area, ctx: any, w: number, h: number) => {
            // Clear buffer to transparent (prevents flash/garbage frames)
            ctx.setOperator(giCairo.Operator.CLEAR);
            ctx.paint();

            if (!surface) return;

            // Gate: wait for a "real" allocation
            if (w < MIN_W || h < MIN_H) return;

            // Gate: wait until bar geometry exists
            const ins = computeInsets(w, h);
            if (ins.rectCount === 0) return;

            // --- draw outer image as "cover" ---
            const scale = Math.max(w / surfaceW, h / surfaceH);
            const drawW = surfaceW * scale;
            const drawH = surfaceH * scale;
            const offX = (w - drawW) / 2;
            const offY = (h - drawH) / 2;

            ctx.setOperator(giCairo.Operator.OVER);
            ctx.save();
            ctx.translate(offX, offY);
            ctx.scale(scale, scale);
            ctx.setSourceSurface(surface, 0, 0);
            ctx.paint();
            ctx.restore();

            // --- cutout (inner hole) based on current bar geometry ---
            const x = ins.left;
            const y = ins.top;
            const iw = Math.max(0, w - ins.left - ins.right);
            const ih = Math.max(0, h - ins.top - ins.bottom);

            ctx.setAntialias(giCairo.Antialias.BEST);
            ctx.setOperator(giCairo.Operator.CLEAR);
            roundedRect(ctx, x, y, iw, ih, ins.radius);
            ctx.fill();
          });
        }}
      />
    </window>
  );
}
