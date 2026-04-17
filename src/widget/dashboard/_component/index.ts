// Define module values as const first
const DASHBOARD_MODULE_VALUES = [
  "Observer",
  "AppLauncher",
  "Avatar",
  "Clock",
  "FileLauncher",
  "Media",
  "Uptime",
  "Weather",
  "QuickLaunch"
] as const

// Export the type derived from values
export type DashboardModules = typeof DASHBOARD_MODULE_VALUES[number]

// Export the values
export const ALL_DASHBOARD_MODULES: DashboardModules[] = [...DASHBOARD_MODULE_VALUES]

// Type guard
export const isDashboardModule = (val: unknown): val is DashboardModules => {
  return typeof val === 'string' && ALL_DASHBOARD_MODULES.includes(val as DashboardModules)
}

export { default as Observer } from './observer'
export { default as AppLauncher } from './appLauncher'
export { default as Avatar } from './avatar'
export { default as Cell } from './cell'
export { default as Clock } from './clock'
export { default as FileLauncher } from './fileLauncher'
export { default as Media } from './media'
export { default as QuickLaunch } from './quickLaunch'
export { default as Uptime } from './uptime'
export { default as Weather } from './weather'
