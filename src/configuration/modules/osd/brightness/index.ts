import { stem } from "src/configuration/helper";
import { dep } from "src/lib/options";

const brightness = stem((opt) => ({
  heartbeatPollUser: opt(true),

  heartbeatPoll: opt(true, {
    deps: [
      dep.root((r) => r.osd.enable),
      dep.root((r) => r.osd.sources.brightness),
      dep.root((r) => r.osd.sources.keyboardBrightness),
      dep.self((s) => s.heartbeatPollUser),
    ],
    derive: ({ root, self }) => {
      if (!root.osd.enable.get()) return false;
      if (!self.heartbeatPollUser.get()) return false;

      // Only poll when at least one brightness source is enabled.
      return Boolean(
        root.osd.sources.brightness.get() || root.osd.sources.keyboardBrightness.get(),
      );
    },
  }),

  heartbeatPollMs: opt(1000),
}));

export type OsdBrightnessOptions = ReturnType<typeof brightness>;

export default brightness;
