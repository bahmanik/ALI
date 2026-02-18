import { stem } from "src/configuration/helper";
import { dep } from "src/lib/options";
import type { OsdBrightnessOptions } from "./type";

const brightnessModule = stem((opt): OsdBrightnessOptions => ({
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

      return Boolean(
        root.osd.sources.brightness.get() ||
        root.osd.sources.keyboardBrightness.get(),
      );
    },
  }),

  heartbeatPollMs: opt(1000),
}));

export default brightnessModule;
