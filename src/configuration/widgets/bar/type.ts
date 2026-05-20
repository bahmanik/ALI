import type { Opt } from "src/lib/options";
import type { BarBorderLocation, BarLocation, HexColor, RgbaColor } from "src/configuration/types";
import type { SecondaryBarOptions } from "./secondaryBar/type";
import type { BarCornerOptions } from "./corner/type";
import type { CpuOptions } from "./modules/cpu/type";
import type { BarModules } from "src/widget/bar/modules";

export interface BarSlotLayout {
  start: BarModules[];
  center: BarModules[];
  end: BarModules[];
}

export interface BarModulesOptions {
  cpu: CpuOptions;
  /** Default layout used for any monitor that doesn't have a custom layout. */
  defaultLayout: Opt<BarSlotLayout>;
  /**
   * Per-monitor layouts keyed by connector name (e.g. "eDP-1", "HDMI-A-1").
   * Only monitors that are currently connected will appear in the settings UI.
   */
  monitorLayouts: Opt<Record<string, BarSlotLayout>>;
  /**
   * When true every bar (regardless of monitor) renders the layout of the
   * first / primary monitor instead of its own per-monitor layout.
   */
  mirrorFirstMonitor: Opt<boolean>;
}

export interface BarOptions {
  position: Opt<BarLocation>;
  margin: Opt<number[]>;
  secondaryBar: SecondaryBarOptions;
  corner: BarCornerOptions;
  modules: BarModulesOptions;

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
    shadowColor: Opt<RgbaColor>;
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

export interface BarOptions {
  position: Opt<BarLocation>;
  margin: Opt<number[]>;
  secondaryBar: SecondaryBarOptions;
  corner: BarCornerOptions;
  modules: BarModulesOptions;

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
    shadowColor: Opt<RgbaColor>;
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
