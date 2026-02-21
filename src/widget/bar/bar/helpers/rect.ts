import type Gtk from "gi://Gtk?version=4.0";
import type Gdk from "gi://Gdk?version=4.0";

import type { BarOptionGroup, BarKind } from "./types";
import { readMargin } from "./margin";
import { setPrimaryRect, setSecondaryRect } from "../../shared";

function widgetSize(w: Gtk.Widget | null) {
  const width = w?.get_allocated_width?.() ?? w?.get_width?.() ?? 0;

  const height = w?.get_allocated_height?.() ?? w?.get_height?.() ?? 0;

  return { width, height };
}

export function computeBarRect(args: {
  gdkmonitor: Gdk.Monitor;
  monitorId: string;
  name: string;
  option: BarOptionGroup;
  root: Gtk.Widget | null;
}) {
  const { gdkmonitor, monitorId, name, option, root } = args;

  const geo = gdkmonitor.get_geometry();
  const mw = geo.width;
  const mh = geo.height;

  const pos = option.position.get();
  const margin = readMargin(option.margin.get());
  const { width: aw, height: ah } = widgetSize(root);

  let x = margin.left;
  let y = margin.top;
  let width = aw;
  let height = ah;

  if (pos === "top") {
    x = margin.left;
    y = margin.top;
    width = mw - margin.left - margin.right;
    height = ah;
  } else if (pos === "bottom") {
    x = margin.left;
    width = mw - margin.left - margin.right;
    height = ah;
    y = mh - margin.bottom - height;
  } else if (pos === "left") {
    x = margin.left;
    y = margin.top;
    width = aw;
    height = mh - margin.top - margin.bottom;
  } else if (pos === "right") {
    width = aw;
    height = mh - margin.top - margin.bottom;
    x = mw - margin.right - width;
    y = margin.top;
  }

  return {
    monitor: monitorId,
    name,
    position: pos,
    x,
    y,
    width: Math.max(0, width),
    height: Math.max(0, height),
  };
}

export function storeBarRect(monitorId: string, kind: BarKind, rect?: any) {
  if (kind === "primary") setPrimaryRect(monitorId, rect);
  else setSecondaryRect(monitorId, rect);
}
