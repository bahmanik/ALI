import StorageService from "src/lib/observers/storage"
import { renderResourceLabel } from "./helpers"
import { storageOptions } from "./options"
import { createPoll } from "ags/time"
import type { BarModuleProps } from "../types"

const { labelType, round, units } = storageOptions

function Storage(_props: BarModuleProps) {
  const storage = new StorageService({})
  const sizeUnits = units !== "auto" ? units : undefined

  const labelBinding = createPoll("", 1000, () =>
    renderResourceLabel(labelType, storage.getDriveUsage("/"), round, sizeUnits),
  )

  return (
    <box>
      <label label={labelBinding(String)} />
    </box>
  )
}

export default Storage
