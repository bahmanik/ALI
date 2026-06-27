import options from "src/configuration"
import GridSetter from "../../inputs/gridSetter"
import { ALL_MENU_KEYS } from "src/widget/shared/menus"

type DashboardProps = JSX.IntrinsicElements["box"]

function Dashboard(props: DashboardProps) {
  const { cols, rows, modulesList } = options.dashboard.grid

  return (
    <box
      {...props}
    >
      <GridSetter
        cols={cols}
        rows={rows}
        modulesMap={modulesList}
        modulesList={ALL_MENU_KEYS}
      />
    </box>
  )
}

export default Dashboard
