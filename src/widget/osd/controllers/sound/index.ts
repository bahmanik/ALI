import AstalWp from "gi://AstalWp";
import icons from "src/lib/icons/icons";
import { clamp01, OsdController, osdEnabled, sourceEnabled, VOLUME_MAX } from "../shared";

export class SoundController extends OsdController {
  #started = false;
  #speaker: AstalWp.Endpoint | null = null;

  constructor() {
    super("sound");
    this.#start();
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;

    // Start listeners even if disabled; the option may be toggled later.
    try {
      const wp = AstalWp.get_default?.();
      const speaker = (wp as any)?.defaultSpeaker;
      if (!speaker) return;

      this.#speaker = speaker as AstalWp.Endpoint;

      const update = () => {
        if (!osdEnabled() || !sourceEnabled("volume")) return;

        const mute = Boolean((speaker as any).mute);
        const vol = Number((speaker as any).volume);
        const rawPct = Math.round((mute ? 0 : vol) * 100);
        const overflow = rawPct > 100;

        const iconName =
          typeof (speaker as any).volumeIcon === "string"
            ? (speaker as any).volumeIcon
            : mute
              ? icons.audio.volume.muted
              : vol > 1
                ? icons.audio.volume.overamplified
                : vol > 0.66
                  ? icons.audio.volume.high
                  : vol > 0.33
                    ? icons.audio.volume.medium
                    : vol > 0
                      ? icons.audio.volume.low
                      : icons.audio.volume.muted;

        this.emit({
          title: "Volume",
          iconName,
          percent: rawPct,
          value: clamp01(rawPct / 100),
          overflow,
        });
      };

      speaker.connect?.("notify::volume", update);
      speaker.connect?.("notify::mute", update);

      // initial snapshot
      update();
    } catch (err) {
      console.warn("[OSD] Sound controller unavailable:", err);
    }
  }

  public override canSet(): boolean {
    return Boolean(this.#speaker);
  }

  public override setNormalized(v: number): void {
    const spk = this.#speaker;
    if (!spk) return;

    const n = clamp01(v);
    const vol = n * VOLUME_MAX;

    try {
      // best-effort: unmute when raising above zero
      if (vol > 0 && Boolean((spk as any).mute)) (spk as any).mute = false;
      (spk as any).volume = vol;
    } catch {
      /* noop */
    }
  }
}

let _soundController: SoundController | null = null;

export function getSoundController(): SoundController {
  if (!_soundController) _soundController = new SoundController();
  return _soundController;
}
