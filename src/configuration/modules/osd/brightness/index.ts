import { stem } from "src/configuration/helper";

const brightness = stem((opt) => ({
  heartbeatPollUser: opt(true),

  heartbeatPoll: opt(true, {
    deps: ["osd.enable", "display.brightness.heartbeatPollUser"],
    derive: ({ root, self }) => root.osd.enable.get() && self.heartbeatPollUser.get(),
  }),

  heartbeatPollMs: opt(1000),
}));

export type OsdBrightnessOptions = ReturnType<typeof brightness>;

export default brightness;
