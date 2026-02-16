import Bar from "./Bar";
import Corner from "./corner";
import options from "src/configuration";
import type { Gdk } from "ags/gtk4"

export function PrimaryBar(monitor: Gdk.Monitor) {
    return (
        <Bar
            name={`primary-bar-${monitor.connector}`
            }
            gdkmonitor={monitor}
            option={options.bar}
            namespace="bar"
            kind="primary"
        />
    );
}

export function SecondaryBar(monitor: Gdk.Monitor) {
    return (
        <Bar
            name={`secondary-bar-${monitor.connector}`
            }
            gdkmonitor={monitor}
            option={options.bar.secondaryBar}
            namespace="secondary-bar"
            kind="secondary"
        />
    );
}

export { Corner };
