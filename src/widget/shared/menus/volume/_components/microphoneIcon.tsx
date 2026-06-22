import AstalWp from "gi://AstalWp?version=0.1";
import icons from "src/lib/icons/icons";
import { Gtk } from "ags/gtk4"
import { createBinding, createComputed } from "gnim";

const wp = AstalWp.get_default()!;
const microphone = wp?.audio.defaultMicrophone!;

const micVar = createComputed([
  createBinding(microphone, "description"),
  createBinding(microphone, "volume"),
  createBinding(microphone, "mute"),
]);

export function getMicIcon(mic?: AstalWp.Endpoint) {
  let microphone = mic?.volume;
  let muted = mic?.mute;
  let speakerIcon = mic?.icon;
  if (microphone == null || speakerIcon == null) return "";

  if (microphone === 0 || muted) {
    return icons.audio.mic.muted;
  } else if (microphone < 0.33) {
    return icons.audio.mic.low;
  } else if (microphone < 0.66) {
    return icons.audio.mic.medium;
  } else {
    return icons.audio.mic.high;
  }
}

function MicrophoneIcon() {
  return (
    <image
      iconName={micVar(() => getMicIcon(microphone))}
      pixelSize={20}
      valign={Gtk.Align.CENTER}
      halign={Gtk.Align.START}
    />
  )
}

export default MicrophoneIcon
