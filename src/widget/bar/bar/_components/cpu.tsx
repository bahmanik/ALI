import { createPoll } from "ags/time";
import { CpuObserver } from "src/lib/observers/cpu";

export const Cpu = () => {
  const cpu = new CpuObserver
  const labelBinding = createPoll(0, 1000, () => cpu.getCpuUsage())


  return <box>
    <label label={labelBinding(String)} />
  </box>;
};
export default Cpu
