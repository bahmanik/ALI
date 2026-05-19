import app from "ags/gtk4/app";
import { Astal } from "ags/gtk4";
import { For, onCleanup } from "ags";

import { barModuleMap } from "./modules";
import type { BarModules } from "./modules";

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
import type { BarOptionGroup as BarOptionGroupT, BarKind } from "./helpers";
import type { Opt } from "src/lib/options";
import type { BarSlotLayout } from "src/configuration/widgets/bar/type";
import { BarLocation } from "src/configuration/types";

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
  layout: Opt<BarSlotLayout>;
};

export default function Bar({
  gdkmonitor,
  name,
  option,
  namespace = "bar",
  kind = "primary",
  layout,
}: BarProps) {
  let win: Astal.Window;
  let root: Gtk.Widget | null = null;

  const isVertical: Opt<boolean> = option.position.as(isBarVertical);

  const monitorId = gdkmonitor.connector;

  const barOrientation = getBarOrientation(option.position);
  const winBinds = createBarWindowBinds(option);

  // Derive a reactive accessor for each slot from the layout opt.
  // layout.as() returns an Accessor — For can consume that directly.
  const startModules = layout.as((l) => l.start);
  const centerModules = layout.as((l) => l.center);
  const endModules = layout.as((l) => l.end);

  const recompute = () => {
    if (!win) return;
    const rect = computeBarRect({ gdkmonitor, monitorId, name, option, root });
    storeBarRect(monitorId, kind, rect);
  };

  onCleanup(() => {
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
        orientation={barOrientation.orientation}
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
          orientation={barOrientation.orientation}
          halign={barOrientation.start.halign}
          valign={barOrientation.start.valign}
        >
          <For each={startModules}>
            {(modName: BarModules) => {
              const Component = barModuleMap[modName];
              if (!Component) return <box />;
              return <Component verticalState={isVertical} />;
            }}
          </For>
        </box>

        <box
          $type="center"
          orientation={barOrientation.orientation}
          halign={barOrientation.start.halign}
          valign={barOrientation.start.valign}
        >
          <For each={centerModules}>
            {(modName: BarModules) => {
              const Component = barModuleMap[modName];
              if (!Component) return <box />;
              return <Component verticalState={isVertical} />;
            }}
          </For>
        </box>

        <box
          $type="end"
          orientation={barOrientation.orientation}
          halign={barOrientation.start.halign}
          valign={barOrientation.start.valign}
        >
          <For each={endModules}>
            {(modName: BarModules) => {
              const Component = barModuleMap[modName];
              if (!Component) return <box />;
              return <Component verticalState={isVertical} />;
            }}
          </For>
        </box>
      </centerbox>
    </window>
  );
}
