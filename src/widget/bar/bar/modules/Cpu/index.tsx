import { createPoll } from "ags/time";
import { Gtk } from "ags/gtk4";
import { CpuObserver } from "src/lib/observers/cpu";
import { CircularProgress } from "src/widget/shared/circularProgress";
import options from "src/configuration";

const { cpu } = options.bar.modules;

function renderCpuLabel(percentage: number, round: boolean): string {
  const value = round ? Math.round(percentage) : parseFloat(percentage.toFixed(2));
  return `${value}%`;
}

function Cpu() {
  const observer = new CpuObserver();

  // createPoll matches the user-configured interval.
  // CpuObserver returns 0..100; CircularProgress expects 0..1.
  const cpuUsage = createPoll(0, cpu.pollingInterval.value, () =>
    observer.getCpuUsage(),
  );

  const normalised = cpuUsage((raw) => raw / 100);

  const ring = CircularProgress({
    value: normalised,
    options: cpu,
  });

  const labelWidget = (
    <label
      label={cpuUsage((raw) =>
        renderCpuLabel(raw, cpu.round.value),
      )}
      visible={cpu.label.value}
    />
  );

  const iconWidget = (
    <label
      label={cpu.icon.value}
      visible={cpu.icon.value !== ""}
      cssClasses={["cpu-icon"]}
    />
  );

  return (
    <box
      cssClasses={["cpu-module"]}
      spacing={4}
      halign={Gtk.Align.CENTER}
      valign={Gtk.Align.CENTER}
      visible={cpu.enable.value}
    >
      {iconWidget}
      {ring}
      {labelWidget}
    </box>
  );
}

export default Cpu;
