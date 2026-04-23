import { Accessor } from "gnim"
import { Gtk } from "ags/gtk4"

type CalendarProps = JSX.IntrinsicElements["box"]

const Calendar = (props: CalendarProps) => {
  return (
    <box
      orientation={Gtk.Orientation.VERTICAL}
      {...props}
    >
      Calendar
    </box>
  )
}

export default Calendar
