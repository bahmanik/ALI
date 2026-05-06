import AstalWp from "gi://AstalWp";
import icons from "src/lib/icons/icons";
import { clamp01, OsdController, osdEnabled, sourceEnabled, VOLUME_MAX } from "../shared";

export class MicController extends OsdController {
  #started = false;
  #mic: AstalWp.Endpoint | null = null;

  constructor() {
    super("mic");
    this.#start();
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;

    try {
      const wp = AstalWp.get_default();
      const mic = (wp as any)?.defaultMicrophone ?? (wp as any)?.audio?.defaultMicrophone;
      if (!mic) return;

      this.#mic = mic as AstalWp.Endpoint;

      const update = () => {
        if (!osdEnabled() || !sourceEnabled("microphone")) return;

        const mute = Boolean((mic as any).mute);
        const vol = Number((mic as any).volume);
        const rawPct = Math.round((mute ? 0 : vol) * 100);
        const overflow = rawPct > 100;

        const iconName =
          mute
            ? icons.audio.mic.muted
            : vol > 0.66
              ? icons.audio.mic.high
              : vol > 0.33
                ? icons.audio.mic.medium
                : vol > 0
                  ? icons.audio.mic.low
                  : icons.audio.mic.muted;

        this.emit({
          title: "Microphone",
          iconName,
          percent: rawPct,
          value: clamp01(rawPct / 100),
          overflow,
        });
      };

      mic.connect?.("notify::volume", update);
      mic.connect?.("notify::mute", update);

      update();
    } catch (err) {
      console.warn("[OSD] Microphone controller unavailable:", err);
    }
  }

  public override canSet(): boolean {
    return Boolean(this.#mic);
  }

  public override setNormalized(v: number): void {
    const mic = this.#mic;
    if (!mic) return;

    const n = clamp01(v);
    const vol = n * VOLUME_MAX;

    try {
      if (vol > 0 && Boolean((mic as any).mute)) (mic as any).mute = false;
      (mic as any).volume = vol;
    } catch {
      /* noop */
    }
  }
}

let _micController: MicController | null = null;

export function getMicController(): MicController {
  if (!_micController) _micController = new MicController();
  return _micController;
}
