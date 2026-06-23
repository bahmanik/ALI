import type { Opt } from "src/lib/options";
import type { BarButtonsOptions, BarStyleOptions } from "../type";
import type { OverrideScaleResult } from "src/lib/options/factories/overrideScale";
import type { BarLocationType } from "src/configuration/enums";

export interface SecondaryBarOptions extends OverrideScaleResult {
  enable: Opt<boolean>;
  position: Opt<BarLocationType>;
  margin: Opt<number[]>;
  style: BarStyleOptions;
  buttons: BarButtonsOptions;
}
