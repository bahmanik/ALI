import type { Opt } from "src/lib/options";

export interface OsdBrightnessOptions {
  heartbeatPollUser: Opt<boolean>;
  heartbeatPoll: Opt<boolean>;
  heartbeatPollMs: Opt<number>;
}
