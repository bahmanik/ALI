import options from "src/configuration";
import Bar from "./bar/Bar";
import Corner from "./corner/Corner";
import { With } from "ags"
import type { Gdk } from "ags/gtk4"

export function PrimaryBar(monitor: Gdk.Monitor) {
    return (
        <Bar
            name={`primary-bar-${monitor.connector}`}
            gdkmonitor={monitor}
            option={options.bar}
            namespace="bar"
            kind="primary"
        />
    );
}

export function SecondaryBar(monitor: Gdk.Monitor) {
    const secondaryEnabled = options.bar.secondaryBar.enable.as(Boolean)

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
                    />
                )
            }
        </With>
    )
}

export { Corner };
