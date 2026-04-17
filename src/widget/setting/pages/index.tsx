import Dashboard from './dashboard';
import Global from './global';
import Launcher from './launcher';

export { default as Dashboard } from './dashboard'
export { default as Global } from './global'
export { default as Launcher } from './launcher'

export const settingPages = {
  "Global": () => <Global />,
  "Dashboard": () => <Dashboard />,
  "Launcher": () => <Launcher />,
} as const;

export type SettingPage = keyof (typeof settingPages);

export const settingPageNames = Object.keys(settingPages) as SettingPage[]
