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
  // GI surfaces can appear a few ticks after window creation.
  let tries = 0;
  const tick = () => {
    const surf = win.get_native?.()?.get_surface?.();
    if (surf) {
      // Empty region => window receives NO input => clicks pass through.
      surf.set_input_region(new giCairo.Region());
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

  let win: Astal.Window | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let revealTimer: ReturnType<typeof setTimeout> | null = null;
  let hideAnimTimer: ReturnType<typeof setTimeout> | null = null;
  let allowReveal = false;

  const scheduleHide = () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    if (hideAnimTimer) {
      clearTimeout(hideAnimTimer);
      hideAnimTimer = null;
    }

    const timeoutMs = Math.max(0, options.osd.timeoutMs.get());

    hideTimer = setTimeout(() => {
      setRevealed(false);
      hideTimer = null;

      const dur = Math.max(0, Number(options.osd.transitionDurationMs.get() ?? 0));
      hideAnimTimer = setTimeout(() => {
        setVisible(false);
        hideAnimTimer = null;
      }, dur + 10);
    }, timeoutMs);
  };

  const show = () => {
    if (!options.osd.enable.get()) return;
    if (!allowReveal) return;

    setVisible(true);

    if (win) makeClickThrough(win);

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

    setTitle(ev.title);
    setIconName(ev.iconName);
    setPercent(ev.percent);
    setValue(ev.value);
    setOverflow(ev.overflow);

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

        self.connect("notify::visible", () => {
          if (self.visible) makeClickThrough(self);
        });

        self.connect("destroy", () => {
          win = null;
          try {
            unsub?.();
          } catch {
            /* noop */
          }
          if (hideTimer) clearTimeout(hideTimer);
          if (revealTimer) clearTimeout(revealTimer);
          if (hideAnimTimer) clearTimeout(hideAnimTimer);
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
                hexpand
                vexpand
              />
            </box>
          </box>
        </Gtk.Revealer>
      </box>
    </window>
  );
}
