import { Opt } from "src/lib/options";
import { ResourceLabelType } from "src/widget/bar/bar/modules/storage/options";
import { CircularProgressOptions } from "src/widget/shared/circularProgress/type";

/**
 * Configuration shape for the CPU bar module.
 *
 * Extends CircularProgressOptions so the circular-progress widget
 * powering the CPU visualisation is fully opt-driven and surfaced
 * in the settings UI alongside the other CPU knobs.
 */
export interface CpuOptions extends CircularProgressOptions {
  /** Whether the module is visible in the bar */
  enable: Opt<boolean>;

  /** How often to sample CPU usage in milliseconds (default: 1000) */
  pollingInterval: Opt<number>;

  /** Show a text label next to / below the ring */
  label: Opt<boolean>;

  /**
   * What the text label renders:
   * - "percentage"  → "42%"
   * - "used"        → raw decimal, 0..100
   * - "used/total"  → "42 / 100"  (always percentage for CPU)
   * - "free"        → "58%"
   */
  labelType: Opt<ResourceLabelType>;

  /** Icon / glyph shown to the left of the ring (Nerd Font code point) */
  icon: Opt<string>;

  /** Round the displayed percentage to the nearest integer */
  round: Opt<boolean>;
}
