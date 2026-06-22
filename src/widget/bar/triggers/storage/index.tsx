import StorageService from "src/lib/observers/storage"
import { renderResourceLabel } from "./helpers"
import { storageOptions } from "./options"
import { createPoll } from "ags/time"
import type { BarTriggerProps } from "../types"

const { labelType, round, units } = storageOptions

export default function StorageTrigger(_props: BarTriggerProps) {
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
