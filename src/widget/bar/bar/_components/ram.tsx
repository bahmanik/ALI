import { createPoll } from "ags/time";
import { RamObserver } from "src/lib/observers/ram";

export const Ram = () => {
  const ram = new RamObserver
  const labelBinding = createPoll(0, 1000, () => ram.getRamUsage().percentage)

  return <box>
    <label label={labelBinding(String)} />
  </box>;
};
export default Ram
