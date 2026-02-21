import Bar from "./Bar";
import Corner from "./corner";
import options from "src/configuration";
import type { Gdk } from "ags/gtk4"
import { With } from "ags"

const secondaryEnabled = options.bar.secondaryBar.enable.as(Boolean)

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
