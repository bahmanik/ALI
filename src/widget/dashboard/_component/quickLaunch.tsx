import { Gtk } from "ags/gtk4"
import Cell from "./cell"

function QuickLaunch() {
  return (
    <Cell className={`test${Math.floor(Math.random() * 10) + 1}`}>
      QuickLaunch
    </Cell>
  )
}

export default QuickLaunch
