import { AnchorLayout, RevealTransitionWithAuto } from "src/lib/options/types";

export const powerOptions: PowerOptions = {
  layout: "center",
  revealTransition: "SWING_DOWN",
  transitionDuration: 0.18,
  confirmation: true,
  sleep: 'systemctl suspend',
  reboot: 'systemctl reboot',
  logout: 'hyprctl dispatch exit',
  shutdown: 'systemctl poweroff',
}

type PowerOptions = {
  layout: AnchorLayout;
  revealTransition: RevealTransitionWithAuto;
  transitionDuration: number;
  sleep: string,
  reboot: string,
  logout: string,
  shutdown: string,
  confirmation: true,
}
