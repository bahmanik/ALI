import options from "src/configuration"
import GridSetter from "../../optSetters/gridSetter"
import { ALL_Launcher_MODULES } from "src/widget/launcher/_components"

type LauncherProps = JSX.IntrinsicElements["box"]

const Launcher = (props: LauncherProps) => {
  const { cols, rows, modulesList } = options.launcher.grid

  return (
    <box
      {...props}
    >
      <GridSetter
        cols={cols}
        rows={rows}
        modulesMap={modulesList}
        modulesList={ALL_Launcher_MODULES}
      />
    </box>
  )
}

export default Launcher 
