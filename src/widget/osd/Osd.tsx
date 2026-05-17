import options from "src/configuration";
import giCairo from "cairo";
import { createState } from "gnim";
import { Astal, Gtk } from "ags/gtk4";
import { layoutToAlign, toRevealerTransitionWithAuto } from "../shared/helpers";
import { controllerForKind } from "./controllers";
import type Gdk from "gi://Gdk?version=4.0";
import type { Accessor } from "gnim";
import type { OsdEvent, OsdKind } from "./controllers/shared";

export type OsdProps = {
  name: string;
  gdkmonitor: Gdk.Monitor;
  namespace: string;
  kind: OsdKind;
  controller?: ReturnType<typeof controllerForKind>;
};

const FULL_ANCHOR: Astal.WindowAnchor =
  Astal.WindowAnchor.TOP |
  Astal.WindowAnchor.BOTTOM |
  Astal.WindowAnchor.LEFT |
  Astal.WindowAnchor.RIGHT;

type Rect = { x: number; y: number; w: number; h: number };

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function boolPeek(acc: Accessor<boolean>): boolean {
  try {
    return Boolean(acc?.peek?.());
  } catch {
    try {
      return Boolean(acc?.peek?.());
    } catch {
      return Boolean(acc);
    }
  }
}

function translateXY(from: Gtk.Widget, to: Gtk.Widget): { x: number; y: number } | null {
  try {
    const tr = (from).translate_coordinates?.(to, 0, 0);

    if (Array.isArray(tr)) {
      // [ok, x, y]
      if (tr.length >= 3 && typeof tr[0] === "boolean") {
        if (!tr[0]) return null;
        return { x: Number(tr[1]) || 0, y: Number(tr[2]) || 0 };
      } else {
        throw "type of corrdinate should be [ok, x, y]"
      }
    } return null;
  } catch {
    return null;
  }
}

function widgetRectIn(child: Gtk.Widget, dest: Gtk.Widget): Rect | null {
  const p = translateXY(child, dest);
  if (!p) return null;

  const w = Math.max(0, Number((child).get_allocated_width?.() ?? 0));
  const h = Math.max(0, Number((child).get_allocated_height?.() ?? 0));
  return { x: p.x, y: p.y, w, h };
}

function rectContains(r: Rect, px: number, py: number): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function setWindowAcceptsInput(
  win: Astal.Window,
  accepts: boolean,
  opts?: { maxTries?: number; warnIfVisible?: boolean },
): void {
  const maxTries = Math.max(1, opts?.maxTries ?? 60);
  const warnIfVisible = Boolean(opts?.warnIfVisible ?? false);

  let tries = 0;

  const tick = () => {
    const surf = win.get_native?.()?.get_surface?.();
    if (surf) {
      try {
        if (accepts) surf.set_input_region(null);
        else surf.set_input_region(new giCairo.Region());
      } catch {
        // ignore: failing here is rare and noisy; if it happens consistently you'll notice
      }
      return;
    }

    if (++tries < maxTries) {
      setTimeout(tick, 16);
      return;
    }

    if (warnIfVisible && win.visible) {
      console.warn(`[osd] set_input_region failed: no surface while visible`);
    }
  };

  tick();
}

export default function Osd(props: OsdProps) {
  const { name, gdkmonitor, namespace, kind } = props;
  const controller = props.controller ?? controllerForKind(kind);

  const [visible, setVisible] = createState(false);
  const [revealed, setRevealed] = createState(false);

  const [title, setTitle] = createState("OSD");
  const [iconName, setIconName] = createState("dialog-information-symbolic");

  const [percent, setPercent] = createState(0);
  const [value, setValue] = createState(0);
  const [overflow, setOverflow] = createState(false);

  let win: Astal.Window | null = null;
  let overlay: Gtk.Widget | null = null; // click area
  let surface: Gtk.Widget | null = null; // osd card

  let acceptingInput = false;
  let hovering = false;
  let dragging = false;
  let allowReveal = false;

  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let revealTimer: ReturnType<typeof setTimeout> | null = null;
  let hideAnimTimer: ReturnType<typeof setTimeout> | null = null;

  const maxPercent = kind === "sound" || kind === "mic" ? 150 : 100;

  const interactiveEnabled = options.osd.interactive.enable.as(
    (en: boolean) => Boolean(en) && controller.canSet(),
  );

  const clearHideTimers = (): void => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;

    if (hideAnimTimer) clearTimeout(hideAnimTimer);
    hideAnimTimer = null;
  };

  const setAccepting = (accept: boolean) => {
    if (!win) return;
    if (accept === acceptingInput) return;
    acceptingInput = accept;

    // Don't spam logs: only warn when visible.
    setWindowAcceptsInput(win, accept, {
      maxTries: accept ? 60 : 5,
      warnIfVisible: accept,
    });
  };

  const refreshAccepting = () => {
    const wants = boolPeek(interactiveEnabled);
    const vis = Boolean(win?.visible ?? false);
    setAccepting(Boolean(wants && vis));
  };

  const scheduleHide = () => {
    const wants = boolPeek(interactiveEnabled);
    if (wants && (hovering || dragging)) return;

    clearHideTimers();

    const timeoutMs = Math.max(0, options.osd.timeoutMs.get());
    hideTimer = setTimeout(() => {
      setRevealed(false);
      hideTimer = null;

      const dur = Math.max(0, Number(options.osd.transitionDurationMs.get() ?? 0));
      hideAnimTimer = setTimeout(() => {
        setVisible(false);

        hovering = false;
        dragging = false;
        setAccepting(false);

        hideAnimTimer = null;
      }, dur + 10);
    }, timeoutMs);
  };

  const hideNow = () => {
    clearHideTimers();

    hovering = false;
    dragging = false;

    setRevealed(false);

    const dur = Math.max(0, Number(options.osd.transitionDurationMs.get() ?? 0));
    hideAnimTimer = setTimeout(() => {
      setVisible(false);
      setAccepting(false);
      hideAnimTimer = null;
    }, dur + 10);
  };

  const applyNormalized = (nRaw: number) => {
    if (!boolPeek(interactiveEnabled)) return;

    const n = clamp01(nRaw);

    try {
      controller.setNormalized(n);
    } catch {
      // ignore; controller may reject some kinds
    }

    const pct = Math.round(n * maxPercent);
    setPercent(pct);
    setOverflow(pct > 100);
    setValue(clamp01(pct / 100));

    clearHideTimers();
  };

  const show = () => {
    if (!options.osd.enable.get()) return;
    if (!allowReveal) return;

    setVisible(true);

    // the window becomes “visible” async; do best-effort now + in notify::visible
    setTimeout(refreshAccepting, 0);

    if (revealTimer) clearTimeout(revealTimer);
    revealTimer = setTimeout(() => {
      setRevealed(true);
      revealTimer = null;
    }, 1);

    scheduleHide();
  };

  const onEvent = (ev: OsdEvent) => {
    // per-event monitor selection
    const connector = (gdkmonitor).connector;
    if (connector && ev.monitorConnector && connector !== ev.monitorConnector) return;

    setTitle(ev.title);
    setIconName(ev.iconName);

    if (!dragging) {
      const pct = Number(ev.percent) || 0;
      setPercent(pct);
      setOverflow(Boolean(ev.overflow));

      const evValue = Number((ev).value);
      const norm = Number.isFinite(evValue) ? clamp01(evValue) : clamp01(pct / maxPercent);
      setValue(norm);
    }

    show();
  };

  const unsub = controller.subscribe(onEvent);

  setTimeout(() => {
    allowReveal = true;
  }, Math.max(0, options.osd.startupDelayMs.get()));

  const margin = options.osd.style.margin.as((m: number) => Math.max(0, Number(m)));
  const gap = options.osd.style.gap.as((g: number) => Math.max(0, Number(g)));

  const percentClass = overflow.as((o: boolean) => (o ? "osd-percent overflow" : "osd-percent"));
  const levelClass = overflow.as((o: boolean) => (o ? "osd-level overflow" : "osd-level"));

  const { revealTransition, location } = options.osd
  const transition = toRevealerTransitionWithAuto(revealTransition.get(), location.get())

  return (
    <window
      name={name}
      namespace={namespace}
      class={`osd osd-${kind}`}
      gdkmonitor={gdkmonitor}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.NONE}
      visible={visible}
      anchor={FULL_ANCHOR}
      css="background-color: transparent;"
      $={(self: Astal.Window) => {
        win = self;

        // silent at init
        setWindowAcceptsInput(self, false, { maxTries: 5, warnIfVisible: false });

        const unsubInteractive = options.osd.interactive.enable.subscribe?.(() => {
          refreshAccepting();
          scheduleHide();
        });

        self.connect("notify::visible", () => {
          if (self.visible) refreshAccepting();
          else setAccepting(false);
        });

        self.connect("destroy", () => {
          win = null;
          overlay = null;
          surface = null;

          clearHideTimers();

          try {
            unsub?.();
          } catch {
            // ignore
          }
          try {
            if (typeof unsubInteractive === "function") unsubInteractive();
          } catch {
            // ignore
          }

          if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
          }

          try {
            setWindowAcceptsInput(self, false, { maxTries: 1, warnIfVisible: false });
          } catch {
            // ignore
          }
        });
      }}
    >
      <box
        class="osd-overlay"
        hexpand
        vexpand
        $={(w: Gtk.Widget) => {
          overlay = w;
        }}
      >
        {/* Outside click closes ONLY in interactive mode */}
        <Gtk.GestureClick
          onReleased={({ widget: w }, _n, x, y) => {
            if (!boolPeek(interactiveEnabled)) return false;
            if (!acceptingInput) return false;
            if (!surface) return false;

            const r = widgetRectIn(surface, w) ?? (overlay ? widgetRectIn(surface, overlay) : null);
            if (!r) return false;

            if (!rectContains(r, x, y)) {
              hideNow();
              return true;
            }
            return false;
          }}
        />

        <box
          class="osd-host"
          halign={options.osd.location.as((l: string) => layoutToAlign(l).halign)}
          valign={options.osd.location.as((l: string) => layoutToAlign(l).valign)}
          marginTop={margin}
          marginBottom={margin}
          marginStart={margin}
          marginEnd={margin}
        >
          <revealer
            class="osd-revealer"
            transitionType={transition}
            transitionDuration={options.osd.transitionDurationMs.as((ms: number) => Math.max(0, ms))}
            revealChild={revealed}
          >
            <box
              class="osd-surface"
              orientation={Gtk.Orientation.VERTICAL}
              $={(w: Gtk.Widget) => {
                surface = w;

                // hover pause (interactive only). this works because we accept input while visible.
                const motion = new Gtk.EventControllerMotion();
                motion.connect("enter", () => {
                  if (!boolPeek(interactiveEnabled)) return;
                  hovering = true;
                  clearHideTimers();
                });
                motion.connect("leave", () => {
                  hovering = false;
                  scheduleHide();
                });
                w.add_controller(motion);
              }}
            >
              <box class="osd-header" hexpand>
                <label class="osd-title" label={title} hexpand xalign={0} />
                <label class={percentClass} label={percent.as((p) => `${Math.round(Number(p) || 0)}%`)} xalign={1} />
              </box>

              <box class="osd-body" orientation={Gtk.Orientation.HORIZONTAL} spacing={gap}>
                <box class="osd-icon" hexpand={false} vexpand={false}>
                  <image iconName={iconName} />
                </box>

                <levelbar
                  class={levelClass}
                  value={value}
                  minValue={0}
                  maxValue={1}
                  orientation={Gtk.Orientation.HORIZONTAL}
                  inverted={false}
                  hexpand
                  vexpand
                  $={(bar) => {
                    const click = new Gtk.GestureClick({ button: 0, exclusive: false });
                    try {
                      (click).propagationPhase = Gtk.PropagationPhase.CAPTURE;
                    } catch { }

                    click.connect("pressed", (_g, _n: number, x: number) => {
                      if (!acceptingInput) return;
                      const w = Math.max(1, bar.get_allocated_width?.() ?? 1);
                      dragging = true;
                      clearHideTimers();
                      applyNormalized(x / w);
                    });

                    const end = () => {
                      dragging = false;
                      scheduleHide();
                    };

                    click.connect("released", end);
                    click.connect("stopped", end);
                    bar.add_controller(click);

                    const drag = new Gtk.GestureDrag({ button: 0, exclusive: false });
                    try {
                      (drag).propagationPhase = Gtk.PropagationPhase.CAPTURE;
                    } catch { }

                    let startX = 0;
                    let width = 1;

                    drag.connect("drag-begin", (_g, x: number) => {
                      if (!acceptingInput) return;
                      dragging = true;
                      clearHideTimers();
                      startX = x;
                      width = Math.max(1, bar.get_allocated_width?.() ?? 1);
                      applyNormalized(startX / width);
                    });

                    drag.connect("drag-update", (_g, dx: number) => {
                      if (!acceptingInput) return;
                      applyNormalized((startX + dx) / width);
                    });

                    drag.connect("drag-end", end);

                    bar.add_controller(drag);
                  }}
                />
              </box>
            </box>
          </revealer>
        </box>
      </box>
    </window>
  );
}
