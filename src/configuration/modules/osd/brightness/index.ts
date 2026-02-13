import { stem } from "src/configuration/helper";
import { dep } from "src/lib/options";

const brightness = stem((opt) => ({
  heartbeatPollUser: opt(true),

  heartbeatPoll: opt(true, {
    deps: [dep.root((r) => r.osd.enable), dep.self((s) => s.heartbeatPollUser)],
    derive: ({ root, self }) => root.osd.enable.get() && self.heartbeatPollUser.get(),
  }),

  heartbeatPollMs: opt(1000),
}));

export type OsdBrightnessOptions = ReturnType<typeof brightness>;

export default brightness;
