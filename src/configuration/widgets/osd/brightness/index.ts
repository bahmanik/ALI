import { opt } from "src/lib/options";
import type { OsdBrightnessOptions } from "./type";

const brightnessModule: OsdBrightnessOptions = {
  heartbeatPollUser: opt(true),

  heartbeatPoll: opt(true, {
    deps: [
      'osd.enable',
      'osd.sources.brightness',
      'osd.sources.keyboardBrightness',
      'osd.brightness.heartbeatPollUser',
    ],
    derive: ({ root }) => {
      if (!root.osd.enable.get()) return false;
      if (!root.osd.brightness.heartbeatPollUser.get()) return false;

      return Boolean(
        root.osd.sources.brightness.get() ||
        root.osd.sources.keyboardBrightness.get(),
      );
    },
  }),

  heartbeatPollMs: opt(1000),
};

export default brightnessModule;
