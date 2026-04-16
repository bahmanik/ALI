import Dashboard from './dashboard';
import Global from './global';

export { default as Dashboard } from './dashboard'
export { default as Global } from './global'

export const settingPages = {
  "Global": () => <Global />,
  "Dashboard": () => <Dashboard />,
} as const;

export type SettingPage = keyof (typeof settingPages);

export const settingPageNames = Object.keys(settingPages) as SettingPage[]
