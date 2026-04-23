import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib"
import giCairo from "cairo"
import { State } from "gnim"

type Props = {
  value: number | State<number>
  size?: number
  thickness?: number
  stiffness?: number   // spring strength
  damping?: number     // friction
}

export const CircularProgress = ({
  value,
  size = 120,
  thickness = 8,
  stiffness = 0.05,
  damping = 0.7,
}: Props) => {
  const area = new Gtk.DrawingArea()

  area.set_content_width(size)
  area.set_content_height(size)

  const clamp = (v: number) => Math.max(0, Math.min(1, v))

  const getTarget = () =>
    clamp(typeof value === "number" ? value : value[0].peek())
  console.log(typeof value === "number")

  let current = getTarget()
  let velocity = 0
  let ticking = false
  let timeoutId: number | null = null

  const step = () => {
    const target = getTarget()

    const force = (target - current) * stiffness
    velocity += force
    velocity *= damping
    current += velocity

    const done =
      Math.abs(target - current) < 0.001 &&
      Math.abs(velocity) < 0.001

    area.queue_draw()

    if (done) {
      current = target
      velocity = 0
      ticking = false
      timeoutId = null
      return GLib.SOURCE_REMOVE
    }

    return GLib.SOURCE_CONTINUE
  }

  const start = () => {
    if (ticking) return
    ticking = true

    timeoutId = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      16, // ~60fps
      step
    )
  }

  area.set_draw_func((_, ctx: giCairo.Context, width, height) => {
    const p = clamp(current)

    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) / 2 - thickness

    ctx.setLineWidth(thickness)

    // background
    ctx.setSourceRGBA(0.3, 0.3, 0.3, 0.3)
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
    ctx.stroke()

    // progress
    ctx.setSourceRGBA(0.2, 0.7, 1, 1)
    ctx.setLineCap(giCairo.LineCap.ROUND)

    ctx.arc(
      cx,
      cy,
      radius,
      -Math.PI / 2,
      -Math.PI / 2 + p * 2 * Math.PI
    )
    ctx.stroke()

    // center text
    ctx.setFontSize(18)
    ctx.moveTo(cx - 15, cy + 6)
    ctx.showText(`${Math.round(p * 100)}%`)
  })

  // react to value changes
  if (typeof value !== "number") {
    value[0].subscribe(() => {
      start()
    })
  }

  // also animate initial mount if needed
  start()

  return area
}
