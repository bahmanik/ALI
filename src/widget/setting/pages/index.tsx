import Calendar from './calendar';
import Dashboard from './dashboard';
import Global from './global';
import Launcher from './launcher';
import Bar from './bar';
import Hyprland from './hyprland';

export { default as Dashboard } from './dashboard'
export { default as Global } from './global'
export { default as Launcher } from './launcher'
export { default as Bar } from './bar'
export { default as Hyprland } from './hyprland'

type PageComponentProps = { name?: string, $type?: string }

export const settingPages = {
  "Global": (props: PageComponentProps) => <Global {...props} />,
  "Dashboard": (props: PageComponentProps) => <Dashboard {...props} />,
  "Launcher": (props: PageComponentProps) => <Launcher {...props} />,
  "Calendar": (props: PageComponentProps) => <Calendar {...props} />,
  "Bar": (props: PageComponentProps) => <Bar {...props} />,
  "Hyprland": (props: PageComponentProps) => <Hyprland {...props} />,
} as const;

export type SettingPage = keyof (typeof settingPages);

export const settingPageNames = Object.keys(settingPages) as SettingPage[]
