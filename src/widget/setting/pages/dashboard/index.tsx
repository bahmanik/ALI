import options from "src/configuration"
import GridSetter from "../../optSetters/gridSetter"
import { ALL_DASHBOARD_MODULES } from "src/widget/dashboard/_component"

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
        modulesList={ALL_DASHBOARD_MODULES}
      />
    </box>
  )
}

export default Dashboard
