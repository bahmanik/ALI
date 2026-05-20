import AstalWp from "gi://AstalWp?version=0.1";
import icons from "src/lib/icons/icons";
import { Gtk } from "ags/gtk4"
import { createBinding, createComputed } from "gnim";

const wp = AstalWp.get_default()!;
const speaker = wp?.audio.defaultSpeaker!;

const speakerVar = createComputed([
  createBinding(speaker, "description"),
  createBinding(speaker, "volume"),
  createBinding(speaker, "mute"),
]);

export function getVolumeIcon(speaker?: AstalWp.Endpoint) {
  let volume = speaker?.volume;
  let muted = speaker?.mute;
  let speakerIcon = speaker?.icon;
  if (volume == null || speakerIcon == null) return "";

  if (volume === 0 || muted) {
    return icons.audio.volume.muted;
  } else if (volume < 0.33) {
    return icons.audio.volume.low;
  } else if (volume < 0.66) {
    return icons.audio.volume.medium;
  } else {
    return icons.audio.volume.high;
  }
}

function SpeackerIcon() {
  return (
    <image
      iconName={speakerVar(() => getVolumeIcon(speaker))}
      pixelSize={20}
      valign={Gtk.Align.CENTER}
      halign={Gtk.Align.START}
    />
  )
}

export default SpeackerIcon
