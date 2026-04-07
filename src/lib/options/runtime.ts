import { startOnce } from "src/services/startOnce";
import type { ConfigManager } from "./configManager";
import type { OptionRegistry } from "./optionRegistry";
import { OptionsObject } from "./types";

let _configManager: ConfigManager | null = null;
let _registry: OptionRegistry<OptionsObject> | null = null;

/**
 * Called by mkOptions() to expose runtime state to the boot layer.
 * No IO, no monitoring.
 */
export function registerOptionsRuntime(registry: OptionRegistry<OptionsObject>, configManager: ConfigManager): void {
  _registry = registry;
  _configManager = configManager;
}

/**
 * Explicit options boot:
 * - starts config monitoring
 * - hydrates option values from disk
 * - sets up derived recomputation + config change plumbing
 */
export const bootOptions = startOnce(async () => {
  if (!_registry || !_configManager) {
    throw new Error("[options] bootOptions() called before mkOptions() registered runtime");
  }

  // Hydrate first, then enable monitoring (so we don't miss our own initial writes).
  await _registry.boot();
  _configManager.startMonitoring();
});
