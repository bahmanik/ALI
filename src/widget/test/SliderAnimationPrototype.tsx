import Gtk from "gi://Gtk?version=4.0"
import GLib from "gi://GLib"
import giCairo from "cairo"

export const SliderAnimation = () => {
  const overlay = new Gtk.Overlay()
  const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 20 })
  const area = new Gtk.DrawingArea()

  overlay.set_child(box)
  overlay.add_overlay(area)

  area.set_content_width(400)
  area.set_content_height(200)

  // --- sliders ---
  const s1 = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL })
  const s2 = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL })
  const s3 = new Gtk.Scale({ orientation: Gtk.Orientation.HORIZONTAL })

  s1.set_range(0, 1)
  s2.set_range(0, 1)
  s3.set_range(0, 1)

  s1.set_value(0.2)
  s2.set_value(0.5)
  s3.set_value(0.8)

  const button = new Gtk.Button({ label: "Save electricity" })

  box.append(s1)
  box.append(s2)
  box.append(s3)
  box.append(button)

  // --- animation state ---
  let t = 0
  let velocity = 0
  let ticking = false

  const lerp = (a: number, b: number, t: number) =>
    a + (b - a) * t

  // get slider handle position relative to overlay
  const getSliderPos = (slider: Gtk.Scale) => {
    const alloc = slider.get_allocation()

    const value = slider.get_value()
    const min = slider.get_adjustment().get_lower()
    const max = slider.get_adjustment().get_upper()

    const percent = (value - min) / (max - min)

    const x = alloc.x + percent * alloc.width
    const y = alloc.y + alloc.height / 2

    return [x, y] as [number, number]
  }

  const getPos = () => {
    const p1 = getSliderPos(s1)
    const p2 = getSliderPos(s2)
    const p3 = getSliderPos(s3)

    if (t < 1) {
      return [
        lerp(p1[0], p2[0], t),
        lerp(p1[1], p2[1], t),
      ]
    } else {
      return [
        lerp(p2[0], p3[0], t - 1),
        lerp(p2[1], p3[1], t - 1),
      ]
    }
  }

  const step = () => {
    const target = 2

    velocity += (target - t) * 0.12
    velocity *= 0.8
    t += velocity

    const done =
      Math.abs(target - t) < 0.001 &&
      Math.abs(velocity) < 0.001

    area.queue_draw()

    return done ? GLib.SOURCE_REMOVE : GLib.SOURCE_CONTINUE
  }

  const start = () => {
    console.log("the button was clicked")
    if (ticking) return
    ticking = true
    t = 0
    velocity = 0

    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 16, step)
  }

  button.connect("clicked", start)

  // --- drawing ---
  area.set_draw_func((_, cr: giCairo.Context) => {
    const [x, y] = getPos()

    // draw simple line trail
    cr.setLineWidth(3)
    cr.setSourceRGBA(0.2, 0.7, 1, 1)

    const p1 = getSliderPos(s1)
    cr.moveTo(p1[0], p1[1])
    cr.lineTo(x, y)
    cr.stroke()

    // draw moving point
    cr.arc(x, y, 5, 0, 2 * Math.PI)
    cr.fill()
  })

  return overlay
}
