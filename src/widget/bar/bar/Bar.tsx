import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";
import { onCleanup } from "ags";

import {
  Volume,
  Windowtitle,
  Workspaces,
  Battery,
  Clock,
  Media,
  Tray,
  Wireless
} from "./_components";
import {
  createBarWindowBinds,
  computeBarRect,
  getBarOrientation,
  isBarVertical,
  storeBarRect,
  subscribeOpt,
  watchWidgetSize,
} from "./helpers";

import type { Gdk, Gtk } from "ags/gtk4";
import type { BarLocation } from "src/lib/options/types";
import type { BarOptionGroup as BarOptionGroupT, BarKind } from "./helpers";
import type { Opt } from "src/lib/options";

type BarOptionGroup = BarOptionGroupT & {
  position: { get(): BarLocation; subscribe(cb: () => void): any; as?: any };
  margin: { get(): number[]; subscribe(cb: () => void): any; as?: any };
};

type BarProps = {
  gdkmonitor: Gdk.Monitor;
  name: string;
  option: BarOptionGroup;
  namespace?: string;
  kind?: BarKind;
};

export default function Bar({
  gdkmonitor,
  name,
  option,
  namespace = "bar",
  kind = "primary",
}: BarProps) {
  let win: Astal.Window;
  let root: Gtk.Widget | null = null;

  const isVertical: Opt<boolean> = option.position.as(isBarVertical)

  const monitorId = gdkmonitor.connector;

  const layout = getBarOrientation(option.position);
  const winBinds = createBarWindowBinds(option);

  const recompute = () => {
    if (!win) return;
    const rect = computeBarRect({ gdkmonitor, monitorId, name, option, root });
    storeBarRect(monitorId, kind, rect);
  };

  onCleanup(() => {
    // window is not auto-destroyed
    try {
      win?.destroy();
    } catch {
      // ignore
    }
    storeBarRect(monitorId, kind, undefined);
  });

  return (
    <window
      $={(self) => {
        win = self;

        const stopPos = subscribeOpt(option.position, recompute);
        const stopMargin = subscribeOpt(option.margin, recompute);

        recompute();

        onCleanup(() => {
          stopPos();
          stopMargin();
        });
      }}
      visible
      namespace={namespace}
      name={name}
      class={`bar ${kind === "primary" ? "bar-primary" : "bar-secondary"}`}
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={winBinds.anchor}
      marginTop={winBinds.marginTop}
      marginRight={winBinds.marginRight}
      marginBottom={winBinds.marginBottom}
      marginLeft={winBinds.marginLeft}
      application={app}
      css="background: transparent;"
    >
      <centerbox
        orientation={layout.orientation}
        class="bar-panel"
        $={(self) => {
          root = self;

          const stopWatch = watchWidgetSize(self, recompute);
          recompute();

          onCleanup(() => {
            stopWatch();
          });
        }}
      >
        <box
          $type="start"
          orientation={layout.orientation}
          halign={layout.start.halign}
          valign={layout.start.valign}
        >
        </box>

        <box
          $type="center"
          orientation={layout.orientation}
          halign={layout.start.halign}
          valign={layout.start.valign}
        >
          <Windowtitle />
        </box>

        <box
          $type="end"
          orientation={layout.orientation}
          halign={layout.start.halign}
          valign={layout.start.valign}
        >
          <Volume />
        </box>
      </centerbox>
    </window>
  );
}
