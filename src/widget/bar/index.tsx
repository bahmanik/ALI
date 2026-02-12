import { Gdk } from "ags/gtk4";
import Bar from "./Bar";
import Corner from "./corner";
import options from "src/configuration";

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
