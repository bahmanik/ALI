import { opt } from "src/lib/options"

export default {
    // Heartbeat polling for external changes (terminal / binds / other daemons)
    heartbeatPollUser: opt(true),

    // Derived runtime flag (DO NOT persist)
    heartbeatPoll: opt<boolean>(true, {
        deps: [
            "osd.enable",
            "display.brightness.heartbeatPollUser",
        ],
        derive: (o) =>
            o.osd.enable.get() && o.display.brightness.heartbeatPollUser.get(),
    }),

    heartbeatPollMs: opt(1000),
}
