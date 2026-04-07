import type { CornerFill, ImageTechnique, Pattern } from "src/configuration/types";
import type { Opt } from "src/lib/options";

export interface BarCornerOptions {
  enable: Opt<boolean>;
  gap: Opt<number>;
  edge: Opt<number>;
  radius: Opt<number>;

  fill: Opt<CornerFill>;

  // overrideImage
  useLocalOuterImage: Opt<boolean>;
  localOuterImage: Opt<string>;
  enableTechnique: Opt<boolean>;
  technique: Opt<ImageTechnique>;
  outerImage: Opt<string>;

  // overridePattern
  patternEnable: Opt<boolean>;
  useLocalPattern: Opt<boolean>;
  localPattern: Opt<Pattern>;
  patternPath: Opt<string>;
  patternSize: Opt<number>;
}
