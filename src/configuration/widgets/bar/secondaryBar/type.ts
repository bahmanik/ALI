import type { Opt } from "src/lib/options";
import type { BarBorderLocation, BarLocation, HexColor } from "src/configuration/types";

export interface SecondaryBarOptions {
  enable: Opt<boolean>;
  position: Opt<BarLocation>;
  margin: Opt<number[]>;

  style: {
    floating: Opt<boolean>;
    transparent: Opt<boolean>;

    bg: Opt<HexColor>;
    bgOpacity: Opt<number>;

    height: Opt<number>;
    radius: Opt<number>;
    paddingX: Opt<number>;
    paddingY: Opt<number>;
    marginTop: Opt<number>;
    marginBottom: Opt<number>;
    marginSides: Opt<number>;

    borderEnable: Opt<boolean>;
    borderLocation: Opt<BarBorderLocation>;
    borderWidth: Opt<number>;
    borderColor: Opt<HexColor>;

    shadowEnable: Opt<boolean>;
    shadowMargin: Opt<number>;
    shadowX: Opt<number>;
    shadowY: Opt<number>;
    shadowBlur: Opt<number>;
    shadowSpread: Opt<number>;
    shadowColor: Opt<string>;
  };

  buttons: {
    bg: Opt<HexColor>;
    bgOpacity: Opt<number>;
    bgHoverOpacity: Opt<number>;

    radius: Opt<number>;
    spacing: Opt<number>;
    paddingX: Opt<number>;
    paddingY: Opt<number>;
  };

  // overrideScale
  useLocalScale: Opt<boolean>;
  localScale: Opt<number>;
  scale: Opt<number>;
}
