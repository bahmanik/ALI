export const batteryOptions = {
  lowBatteryNotification: false,
  lowBatteryThreshold: 20,
  lowBatteryNotificationTitle: 'Warning: Low battery',
  lowBatteryNotificationText: 'Your battery is running low ($POWER_LEVEL %).\n\nPlease plug in your charger.',
  showLabel: true,
  confirmation: true,
  sleep: 'systemctl suspend',
  reboot: 'systemctl reboot',
  logout: 'hyprctl dispatch exit',
  shutdown: 'systemctl poweroff',
};
