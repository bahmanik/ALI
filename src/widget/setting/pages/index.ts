export { default as Dashboard } from './dashboard'
export { default as Global } from './global'

export const settingPages = [
  "Global",
  "Dashboard",
] as const;

export type SettingPage = (typeof settingPages)[number];
