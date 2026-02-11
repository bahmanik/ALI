import { opt } from "src/lib/options"

export default {
    // Heartbeat polling for external changes (terminal / binds / other daemons)
    heartbeatPollUser: opt(true),

    // Derived runtime flag (DO NOT persist)
    heartbeatPoll: opt(true, {
        deps: [
            "osd.enable",
            "display.brightness.heartbeatPollUser",
        ],
        derive: (o: any) =>
            Boolean(o.osd.enable) && Boolean(o.display.brightness.heartbeatPollUser),
    }),

    heartbeatPollMs: opt(1000),
}
