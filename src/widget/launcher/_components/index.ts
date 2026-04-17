export * from "./AnimatedAppRow"
export * from "./FavoritesRow"
export * from "./LauncherAppList"
export * from "./LauncherEntry"
export * from "./LauncherPanel"

// Define module values as const first
const LAUNCHER_MODULE_VALUES = [
  "LauncherPanel",
  "LauncherEntry",
  "FavoritesRow",
] as const

// Export the type derived from values
export type LauncherModules = typeof LAUNCHER_MODULE_VALUES[number]

// Export the values
export const ALL_Launcher_MODULES: LauncherModules[] = [...LAUNCHER_MODULE_VALUES]

// Type guard
export const isDashboardModule = (val: unknown): val is LauncherModules => {
  return typeof val === 'string' && ALL_Launcher_MODULES.includes(val as LauncherModules)
}
