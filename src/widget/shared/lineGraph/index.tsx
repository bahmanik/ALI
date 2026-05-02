import Gtk from "gi://Gtk?version=4.0"
import giCairo from "cairo"
import { State } from "gnim"

type Props = {
  values: State<number[]>
  width?: number
  height?: number
  thickness?: number
}

export const LineGraph = ({
  values,
  width = 200,
  height = 60,
  thickness = 2,
}: Props) => {
  const area = new Gtk.DrawingArea()

  area.set_content_width(width)
  area.set_content_height(height)

  const getValues = (): number[] => {
    return values[0].peek()
  }

  const clamp = (v: number) => Math.max(0, Math.min(1, v))

  area.set_draw_func((_, ctx: giCairo.Context, w, h) => {
    const data = getValues()

    if (data.length < 2) return

    const stepX = w / (data.length - 1)

    ctx.setLineWidth(thickness)
    ctx.setSourceRGBA(0.2, 0.7, 1, 1)
    ctx.setLineJoin(giCairo.LineJoin.ROUND)
    ctx.setLineCap(giCairo.LineCap.ROUND)

    data.forEach((v: number, i: number) => {
      const x = i * stepX
      const y = h - clamp(v) * h

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()
  })

  values[0].subscribe(() => area.queue_draw())

  return area
}
