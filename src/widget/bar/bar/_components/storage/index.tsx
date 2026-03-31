import StorageService from "src/lib/observers/storage";
import { renderResourceLabel } from "./helpers";
import { storageOptions } from "./options";
import { createPoll } from "ags/time";

const {
  label,
  labelType,
  icon,
  round,
  pollingInterval,
  units,
  tooltipStyle,
  paths,
} = storageOptions


const Storage = () => {
  const storage = new StorageService({})
  const sizeUnits = units !== 'auto' ? units : undefined;

  const labelBinding = createPoll('', 1000, () => renderResourceLabel(labelType, storage.getDriveUsage('/'), round, sizeUnits))

  return <box>
    <label label={labelBinding(String)} />
  </box>;
}

export default Storage
