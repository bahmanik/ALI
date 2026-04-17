export interface SystemAction {
  name: string;
  description: string;
  icon: string;
  command: string;
  confirm?: boolean; // Whether to show confirmation dialog
}

// Pre-defined system actions
export const SYSTEM_ACTIONS: SystemAction[] = [
  {
    name: "Power Off",
    description: "Shut down the computer",
    icon: "system-shutdown-symbolic",
    command: "systemctl poweroff",
    confirm: true
  },
  {
    name: "Reboot",
    description: "Restart the computer",
    icon: "system-reboot-symbolic",
    command: "systemctl reboot",
    confirm: true
  },
  {
    name: "Suspend",
    description: "Put computer to sleep",
    icon: "system-suspend-symbolic",
    command: "systemctl suspend"
  },
  {
    name: "Lock Screen",
    description: "Lock the current session",
    icon: "system-lock-screen-symbolic",
    command: "hyprlock"
  },
  {
    name: "Log Out",
    description: "End the current session",
    icon: "system-log-out-symbolic",
    command: "hyprctl dispatch exit",
    confirm: true
  },
  {
    name: "Hibernate",
    description: "Save session to disk and power off",
    icon: "system-hibernate-symbolic",
    command: "systemctl hibernate",
    confirm: true
  },
  {
    name: "Reload Config",
    description: "Reload Hyprland configuration",
    icon: "view-refresh-symbolic",
    command: "hyprctl reload"
  },
  {
    name: "Change Wallpaper",
    description: "Open wallpaper selector",
    icon: "preferences-desktop-wallpaper-symbolic",
    command: "ags request 'window toggle desktop-wallpaper'"
  },
  {
    name: "Open Setting",
    description: "Open ALI setting",
    icon: "preferences-desktop-wallpaper-symbolic",
    command: "ags request 'window toggle setting'"
  },
];
