import { createState } from "gnim";
import { Astal, Gtk } from "ags/gtk4";

import type Gdk from "gi://Gdk?version=4.0";
import giCairo from "cairo";

import options from "src/configuration";
import { calculateAnchor, layoutToAlign } from "src/widget/shared/layout";
import { toGtkRevealerTransitionType } from "src/widget/shared/revealer";
import type { OsdKind, OsdEvent } from "./controller";
import { controllerForKind } from "./controller";

export type OsdProps = {
  name: string;
  gdkmonitor: Gdk.Monitor;
  namespace: string;
  kind: OsdKind;

  /** Optional override: provide a specific controller instance. */
  controller?: ReturnType<typeof controllerForKind>;
};

function osdAnchorFromLayout(layout: string): Astal.WindowAnchor {
  const anchor = calculateAnchor(layout as any);
  if (anchor !== null) return anchor;

  // center: occupy full monitor, align child to center.
  return (
    Astal.WindowAnchor.TOP |
    Astal.WindowAnchor.BOTTOM |
    Astal.WindowAnchor.LEFT |
    Astal.WindowAnchor.RIGHT
  );
}

function makeClickThrough(win: Astal.Window): void {
  setWindowAcceptsInput(win, false);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function setWindowAcceptsInput(win: Astal.Window, accepts: boolean): void {
  // GI surfaces can appear a few ticks after window creation.
  let tries = 0;
  const tick = () => {
    const surf = win.get_native?.()?.get_surface?.();
    if (surf) {
      // null => default input region (accept input)
      // empty region => click-through
      if (accepts) surf.set_input_region(null);
      else surf.set_input_region(new giCairo.Region());
      return;
    }
    if (++tries < 60) setTimeout(tick, 16);
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
  const [uiNorm, setUiNorm] = createState(0);
  const [dragging, setDragging] = createState(false);

  let win: Astal.Window | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let revealTimer: ReturnType<typeof setTimeout> | null = null;
  let hideAnimTimer: ReturnType<typeof setTimeout> | null = null;
  let allowReveal = false;

  let scaleAdj: Gtk.Adjustment | null = null;
  let syncingScale = false;

  const interactiveActive = options.osd.interactive.enable.as((en: boolean) => Boolean(en) && controller.canSet());
  const barVisible = interactiveActive.as((v: boolean) => !v);

  const maxPercent = kind === "sound" || kind === "mic" ? 150 : 100;

  const lockTimeoutWhileDragging = (): boolean => {
    try {
      return Boolean(options.osd.interactive.lockTimeoutWhileDragging.get());
    } catch {
      return true;
    }
  };

  const clearHideTimers = (): void => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (hideAnimTimer) {
      clearTimeout(hideAnimTimer);
      hideAnimTimer = null;
    }
  };

  const syncScaleValue = (v: number): void => {
    if (!scaleAdj) return;
    syncingScale = true;
    try {
      scaleAdj.value = clamp01(v);
    } finally {
      syncingScale = false;
    }
  };

  const updateInputRegion = (): void => {
    if (!win) return;
    const accepts = Boolean(interactiveActive.peek?.() ?? false);
    setWindowAcceptsInput(win, accepts);
  };

  const scheduleHide = () => {
    if (lockTimeoutWhileDragging() && Boolean(dragging.peek?.() ?? false)) return;

    clearHideTimers();

    const timeoutMs = Math.max(0, options.osd.timeoutMs.get());

    hideTimer = setTimeout(() => {
      setRevealed(false);
      hideTimer = null;

      const dur = Math.max(0, Number(options.osd.transitionDurationMs.get() ?? 0));
      hideAnimTimer = setTimeout(() => {
        setVisible(false);
        if (win) makeClickThrough(win);
        hideAnimTimer = null;
      }, dur + 10);
    }, timeoutMs);
  };

  const show = () => {
    if (!options.osd.enable.get()) return;
    if (!allowReveal) return;

    setVisible(true);

    if (win) updateInputRegion();

    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }

    // Let GTK realize the surface before revealing.
    revealTimer = setTimeout(() => {
      setRevealed(true);
      revealTimer = null;
    }, 1);

    scheduleHide();
  };

  const onEvent = (ev: OsdEvent) => {
    // Per-event monitor selection: only the target monitor should show.
    const connector = (gdkmonitor as any).connector;
    if (connector && ev.monitorConnector && connector !== ev.monitorConnector) return;

    const isDragging = Boolean(dragging.peek?.() ?? false);

    setTitle(ev.title);
    setIconName(ev.iconName);

    if (!isDragging) {
      setPercent(ev.percent);
      setValue(clamp01(ev.value));
      setOverflow(Boolean(ev.overflow));

      const n = clamp01((Number(ev.percent) || 0) / maxPercent);
      setUiNorm(n);
      syncScaleValue(n);
    }

    show();
  };

  const unsub = controller.subscribe(onEvent);

  // Startup delay gate.
  const startupDelay = Math.max(0, options.osd.startupDelayMs.get());
  setTimeout(() => {
    allowReveal = true;
  }, startupDelay);

  const margin = options.osd.style.margin.as((m: number) => Math.max(0, Number(m)));
  const gap = options.osd.style.gap.as((g: number) => Math.max(0, Number(g)));

  const bodyOrientation = options.osd.orientation.as((o: string) =>
    o === "vertical" ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL,
  );

  const percentClass = overflow.as((o: boolean) => (o ? "osd-percent overflow" : "osd-percent"));
  const levelClass = overflow.as((o: boolean) => (o ? "osd-level overflow" : "osd-level"));
  const scaleClass = overflow.as((o: boolean) => (o ? "osd-scale overflow" : "osd-scale"));

  return (
    <window
      name={name}
      namespace={namespace}
      class={`osd osd-${kind}`}
      gdkmonitor={gdkmonitor}
      layer={Astal.Layer.OVERLAY}
      keymode={Astal.Keymode.NONE}
      visible={visible}
      anchor={options.osd.location.as(osdAnchorFromLayout)}
      marginTop={margin}
      marginRight={margin}
      marginBottom={margin}
      marginLeft={margin}
      css="background-color: transparent;"
      $={(self: Astal.Window) => {
        win = self;
        makeClickThrough(self);
        updateInputRegion();

        const unsubInteractive = options.osd.interactive.enable.subscribe?.(() => {
          if (self.visible) updateInputRegion();
        });

        self.connect("notify::visible", () => {
          if (self.visible) updateInputRegion();
        });

        self.connect("destroy", () => {
          win = null;
          try {
            unsub?.();
          } catch {
            /* noop */
          }
          try {
            if (typeof unsubInteractive === "function") unsubInteractive();
          } catch {
            /* noop */
          }
          if (hideTimer) clearTimeout(hideTimer);
          if (revealTimer) clearTimeout(revealTimer);
          if (hideAnimTimer) clearTimeout(hideAnimTimer);

          // restore click-through on teardown
          try {
            setWindowAcceptsInput(self, false);
          } catch {
            /* noop */
          }
        });
      }}
    >
      <box
        class="osd-host"
        halign={options.osd.location.as((l: string) => layoutToAlign(l).halign)}
        valign={options.osd.location.as((l: string) => layoutToAlign(l).valign)}
      >
        <Gtk.Revealer
          class="osd-revealer"
          transitionType={options.osd.revealTransitionResolved.as(toGtkRevealerTransitionType)}
          transitionDuration={options.osd.transitionDurationMs.as((ms: number) => Math.max(0, ms))}
          revealChild={revealed}
        >
          <box class="osd-surface" orientation={Gtk.Orientation.VERTICAL}>
            <box class="osd-header" hexpand>
              <label class="osd-title" label={title} hexpand xalign={0} />
              <label
                class={percentClass}
                label={percent.as((p) => `${Math.round(Number(p) || 0)}%`)}
                xalign={1}
              />
            </box>

            <box
              class="osd-body"
              orientation={bodyOrientation}
              spacing={gap}
            >
              <box class="osd-icon" hexpand={false} vexpand={false}>
                <image iconName={iconName} />
              </box>

              <levelbar
                class={levelClass}
                value={value}
                minValue={0}
                maxValue={1}
                orientation={bodyOrientation}
                inverted={options.osd.orientation.as((o: string) => o === "vertical")}
                visible={barVisible}
                hexpand
                vexpand
              />

              <Gtk.Scale
                class={scaleClass}
                visible={interactiveActive}
                orientation={bodyOrientation}
                inverted={options.osd.orientation.as((o: string) => o === "vertical")}
                drawValue={false}
                hexpand
                vexpand
                $={(self: Gtk.Scale) => {
                  const step = Math.max(0.001, Number(options.osd.interactive.step.get()) || 0.02);

                  scaleAdj = new Gtk.Adjustment({
                    lower: 0,
                    upper: 1,
                    stepIncrement: step,
                    pageIncrement: step,
                    pageSize: 0,
                    value: clamp01(uiNorm.peek?.() ?? 0),
                  });
                  self.adjustment = scaleAdj;

                  // Pause hide timer while dragging.
                  const click = new Gtk.GestureClick({
                    button: 0,
                    exclusive: false,
                  });
                  try {
                    (click as any).propagationPhase = Gtk.PropagationPhase.CAPTURE;
                  } catch {
                    /* noop */
                  }

                  click.connect("pressed", () => {
                    setDragging(true);
                    if (lockTimeoutWhileDragging()) {
                      clearHideTimers();
                      updateInputRegion();
                    }
                  });

                  const end = () => {
                    setDragging(false);
                    if (lockTimeoutWhileDragging()) scheduleHide();
                  };

                  click.connect("released", end);
                  click.connect("stopped", end);
                  self.add_controller(click);

                  self.connect("value-changed", () => {
                    if (syncingScale || !scaleAdj) return;

                    const n = clamp01(Number(scaleAdj.value) || 0);
                    setUiNorm(n);

                    try {
                      controller.setNormalized(n);
                    } catch {
                      /* noop */
                    }

                    const pct = Math.round(n * maxPercent);
                    setPercent(pct);
                    setOverflow(pct > 100);
                    setValue(clamp01(pct / 100));

                    // Keep it visible while interacting.
                    if (lockTimeoutWhileDragging() && Boolean(dragging.peek?.() ?? false)) clearHideTimers();
                  });
                }}
              />
            </box>
          </box>
        </Gtk.Revealer>
      </box>
    </window>
  );
}
