import { menuDefaults } from "src/widget/shared/menus/menuDefaults"
import { buildInstanceOptTree } from "src/lib/options/menus/instanceTree"
import type { InstanceOptTree } from "src/lib/options/menus/instanceTree"

// ─── Global-defaults tier ─────────────────────────────────────────────────────
//
// menuDefaults already contains Opt instances for every MenuKey.
// The registry will walk this object and assign ids like:
//   "menuDefaults.Clock.format"
//   "menuDefaults.Volume.showPercent"
//
// Exposed as `options.menuDefaults` — configurable from Settings UI.

export const menuDefaultsOptions = menuDefaults

// ─── Per-instance overrides tier ──────────────────────────────────────────────
//
// Built once at module-eval time by scanning the raw config on disk.
// The registry will walk the nested tree and assign ids like:
//   "menuInstances.instances.n_vol_m.showPercent"
//   "menuInstances.instances.n_net_m.format"
//
// Exposed as `options.menuInstances` — one subtree per NodeId.

const instancesSubtree: InstanceOptTree = buildInstanceOptTree()

export const menuInstancesOptions = {
  instances: instancesSubtree,
}

// ─── OptionsRoot augmentation ─────────────────────────────────────────────────

declare module "src/lib/options/root" {
  interface OptionsRoot {
    menuDefaults:   typeof menuDefaultsOptions
    menuInstances:  typeof menuInstancesOptions
  }
}
