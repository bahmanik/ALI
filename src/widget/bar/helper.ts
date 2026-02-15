import { Astal } from "ags/gtk4"
import { BarLocation } from "src/lib/options/types"

function getBarPos(pos: BarLocation) {
  const { TOP, LEFT, RIGHT, BOTTOM } = Astal.WindowAnchor

  switch (pos) {
    case "bottom": return BOTTOM | LEFT | RIGHT
    case "top": return TOP | LEFT | RIGHT
    case "left": return LEFT | TOP | BOTTOM
    case "right": return RIGHT | TOP | BOTTOM
  }
}

/** True for left/right bars (stacked vertically). */
export function isBarVertical(pos: BarLocation) {
  return pos === "left" || pos === "right"
}

import Gtk from "gi://Gtk?version=4.0"
import type Gdk from "gi://Gdk?version=4.0"
import { setPrimaryRect, setSecondaryRect } from "./geometry"
import { Opt } from "src/lib/options"

export type BarOptionGroup = {
  position: Opt<BarLocation>
  margin: Opt<number[]>
}

export type BarKind = "primary" | "secondary"

export type Margin = { top: number; right: number; bottom: number; left: number }

function safe(fn: () => void) {
  try { fn() } catch { }
}

export function bind<T, V>(opt: Opt<T>, map: (v: T) => V) {
  return opt.as ? opt.as(map) : map(opt.get())
}

export function marginAt(raw: unknown, idx: 0 | 1 | 2 | 3) {
  if (!Array.isArray(raw)) return 0
  const v = raw[idx]
  return typeof v === "number" ? v : 0
}

export function readMargin(raw: unknown): Margin {
  return {
    top: marginAt(raw, 0),
    right: marginAt(raw, 1),
    bottom: marginAt(raw, 2),
    left: marginAt(raw, 3),
  }
}

export function bindMarginSide(opt: Opt<number[]>, idx: 0 | 1 | 2 | 3) {
  return opt.as ? opt.as((m) => marginAt(m, idx)) : marginAt(opt.get(), idx)
}

export function createBarWindowBinds(option: BarOptionGroup) {
  return {
    anchor: bind(option.position, (p) => getBarPos(p)),
    marginTop: bindMarginSide(option.margin, 0),
    marginRight: bindMarginSide(option.margin, 1),
    marginBottom: bindMarginSide(option.margin, 2),
    marginLeft: bindMarginSide(option.margin, 3),
  }
}

export function getBarOrientation(option: BarOptionGroup) {
  const orientation = bind(option.position, (p) =>
    isBarVertical(p) ? Gtk.Orientation.VERTICAL : Gtk.Orientation.HORIZONTAL,
  )

  const start = {
    halign: bind(option.position, (p) => (isBarVertical(p) ? Gtk.Align.CENTER : Gtk.Align.START)),
    valign: bind(option.position, (p) => (isBarVertical(p) ? Gtk.Align.START : Gtk.Align.CENTER)),
  }

  const end = {
    halign: bind(option.position, (p) => (isBarVertical(p) ? Gtk.Align.CENTER : Gtk.Align.END)),
    valign: bind(option.position, (p) => (isBarVertical(p) ? Gtk.Align.END : Gtk.Align.CENTER)),
  }

  return { orientation, start, end }
}

function widgetSize(w: Gtk.Widget | null) {
  const width =
    w?.get_allocated_width?.() ??
    w?.get_width?.() ??
    0

  const height =
    w?.get_allocated_height?.() ??
    w?.get_height?.() ??
    0

  return { width, height }
}

export function computeBarRect(args: {
  gdkmonitor: Gdk.Monitor
  monitorId: string
  name: string
  option: BarOptionGroup
  root: Gtk.Widget | null
}) {
  const { gdkmonitor, monitorId, name, option, root } = args

  const geo = gdkmonitor.get_geometry()
  const mw = geo.width
  const mh = geo.height

  const pos = option.position.get()
  const margin = readMargin(option.margin.get())
  const { width: aw, height: ah } = widgetSize(root)

  let x = margin.left
  let y = margin.top
  let width = aw
  let height = ah

  if (pos === "top") {
    x = margin.left
    y = margin.top
    width = mw - margin.left - margin.right
    height = ah
  } else if (pos === "bottom") {
    x = margin.left
    width = mw - margin.left - margin.right
    height = ah
    y = mh - margin.bottom - height
  } else if (pos === "left") {
    x = margin.left
    y = margin.top
    width = aw
    height = mh - margin.top - margin.bottom
  } else if (pos === "right") {
    width = aw
    height = mh - margin.top - margin.bottom
    x = mw - margin.right - width
    y = margin.top
  }

  return {
    monitor: monitorId,
    name,
    position: pos,
    x,
    y,
    width: Math.max(0, width),
    height: Math.max(0, height),
  }
}

export function storeBarRect(monitorId: string, kind: BarKind, rect?: any) {
  if (kind === "primary") setPrimaryRect(monitorId, rect)
  else setSecondaryRect(monitorId, rect)
}

export function subscribeOpt(opt: Opt<any>, cb: () => void) {
  const unsub = opt.subscribe?.(cb)
  return () => safe(() => (typeof unsub === "function" ? unsub() : undefined))
}

/**
 * GTK4 has no ::size-allocate signal.
 * We prefer WidgetPaintable::invalidate-size, with a tick callback fallback.
 */
export function watchWidgetSize(widget: Gtk.Widget, onChange: () => void) {
  let lastW = -1
  let lastH = -1

  const fireIfChanged = () => {
    const w = widget.get_width?.() ?? widget.get_allocated_width?.() ?? 0
    const h = widget.get_height?.() ?? widget.get_allocated_height?.() ?? 0
    if (w !== lastW || h !== lastH) {
      lastW = w
      lastH = h
      onChange()
    }
  }

  try {
    // @ts-ignore
    const paintable: Gtk.WidgetPaintable =
      // @ts-ignore
      Gtk.WidgetPaintable.new?.(widget) ?? new Gtk.WidgetPaintable({ widget })

    const hid = paintable.connect("invalidate-size", fireIfChanged)
    // initial
    fireIfChanged()

    return () => safe(() => paintable.disconnect(hid))
  } catch {
    const tickId = widget.add_tick_callback(() => {
      fireIfChanged()
      return true
    })

    // initial
    fireIfChanged()

    return () => safe(() => widget.remove_tick_callback(tickId))
  }
}
