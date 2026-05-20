import options from "src/configuration";
import Bar from "./Bar";
import Corner from "./corner/Corner";
import { With } from "ags";
import type { Gdk } from "ags/gtk4";
import type { BarSlotLayout } from "src/configuration/widgets/bar/type";
import { opt } from "src/lib/options";

/**
 * Derive a reactive layout Opt for a specific monitor connector.
 *
 * - If `mirrorFirstMonitor` is true → always return the first monitor's layout
 *   (or defaultLayout if there's no per-monitor entry for it).
 * - Otherwise return the per-monitor layout for `connector` if it exists,
 *   falling back to `defaultLayout`.
 */
function resolveMonitorLayout(connector: string) {
  const { defaultLayout, monitorLayouts, mirrorFirstMonitor } = options.bar.modules;

  return opt<BarSlotLayout>(defaultLayout.get(), {
    runtime: true, derive: () => {
      const mirror = mirrorFirstMonitor.get();
      const perMonitor = monitorLayouts.get();
      const def = defaultLayout.get();

      if (mirror) {
        // Use the layout of the first connected monitor (sorted alphabetically)
        const firstConnector = Object.keys(perMonitor).sort()[0];
        return (firstConnector ? perMonitor[firstConnector] : def) ?? def;
      }

      return perMonitor[connector] ?? def;
    }, deps: [
      "bar.modules.defaultLayout",
      "bar.modules.monitorLayouts",
      "bar.modules.mirrorFirstMonitor",
    ]
  });
}

export function PrimaryBar(monitor: Gdk.Monitor) {
  const layout = resolveMonitorLayout(monitor.connector);

  return (
    <Bar
      name={`primary-bar-${monitor.connector}`}
      gdkmonitor={monitor}
      option={options.bar}
      namespace="bar"
      kind="primary"
      layout={layout}
    />
  );
}

export function SecondaryBar(monitor: Gdk.Monitor) {
  const secondaryEnabled = options.bar.secondaryBar.enable.as(Boolean);
  const layout = resolveMonitorLayout(monitor.connector);

  return (
    <With value={secondaryEnabled}>
      {(on) =>
        on && (
          <Bar
            name={`secondary-bar-${monitor.connector}`}
            gdkmonitor={monitor}
            option={options.bar.secondaryBar}
            namespace="secondary-bar"
            kind="secondary"
            layout={layout}
          />
        )
      }
    </With>
  );
}

export { Corner };
