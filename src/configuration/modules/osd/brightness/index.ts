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
      const r = root as any;
      const s = self as any;

      if (!r.osd.enable.get()) return false;
      if (!s.heartbeatPollUser.get()) return false;

      return Boolean(
        r.osd.sources.brightness.get() ||
        r.osd.sources.keyboardBrightness.get(),
      );
    },
  }),

  heartbeatPollMs: opt(1000),
}));

export type OsdBrightnessOptions = ReturnType<typeof brightness>;
export default brightness;
