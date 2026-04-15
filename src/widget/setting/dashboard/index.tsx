import { Gtk } from "ags/gtk4"
import { Accessor, createState, For } from "gnim"
import options from "src/configuration"
import { ALL_MODULES, isDashboardModule } from "src/widget/dashboard/_component"
import { ModuleMap } from "./helpers"

let cellCounter = 1

function Dashboard() {
  const { rows, cols, modulesList } = options.dashboard
  const moduleMap = new ModuleMap(modulesList.get())

  const [mapModule, setMapModule] = createState<ModuleMap>(moduleMap)

  const handleCellClick = (row: number, col: number): void => {
    const currentMap = mapModule.peek()

    if (currentMap.isFirstCornerNull()) {
      setMapModule(prev => {
        const next = prev
        next.setFirstCorner(row, col)
        return next
      })
    } else {
      setMapModule(prev => {
        const next = prev.clone()
        next.setSecondCorner(row, col)
        next.addModule()
        return next
      })
    }
  }

  const handleModuleSelect = (self: Gtk.Button): void => {
    if (!isDashboardModule(self.name)) {
      console.error("Invalid module name:", self.name)
      return
    }

    setMapModule(prev => {
      const next = prev.clone()
      if (isDashboardModule(self.name))
        next.setModule(self.name)
      return next
    })
  }

  const renderModuleButtons = (): JSX.Element => {
    return (
      <box orientation={Gtk.Orientation.VERTICAL}>
        {ALL_MODULES.map((module) => (
          <button
            name={module}
            class='module-button'
            onClicked={handleModuleSelect}
          >
            {module}
          </button>
        ))}
      </box>
    )
  }

  const renderGrid = (): JSX.Element => {

    const B = ({ row, col }: { row: number, col: number }) => <box
      class='cell'
      orientation={Gtk.Orientation.HORIZONTAL}
    >
      <button onClicked={() => { handleCellClick(row, col) }}>
        <label label={String(row * cols.get() + col)} />
      </button>
    </box>

    const M = ({ moduleName }: { moduleName: string }) => (
      <box
        class='cell'
        orientation={Gtk.Orientation.HORIZONTAL}
      >
        {moduleName}
      </box>
    )

    return (
      <Gtk.Grid
        $={(self) => {
          const currentMap = mapModule.peek()

          const modules = currentMap.getModules()
          for (const module of modules) {
            console.log(module.column, module.row, module.width, module.height)
            self.attach(<M moduleName={module.module} />, module.column, module.row, module.width, module.height)
          }

          const bm = currentMap.getBitMap(5, 10)
          // render the empty Spaces
          for (let i = 0; i < rows.get(); i++) {
            for (let j = 0; j < cols.get(); j++) {
              if (!bm[i][j])
                self.attach(<B row={i} col={j} />, j, i, 1, 1)
            }
          }
        }}
      >

      </Gtk.Grid>
    )
  }

  return (
    <box halign={Gtk.Align.CENTER} class='dashboard-frame'>
      {renderModuleButtons()}
      {renderGrid()}
    </box>
  )
}

export default Dashboard
