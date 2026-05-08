import BrightnessService from "src/services/brightness";
import icons from "src/lib/icons/icons";
import { clamp01, OsdController, osdEnabled, sourceEnabled } from "../shared";

export class BrightnessController extends OsdController {
  #started = false;
  #brightness: BrightnessService | null = null;

  constructor() {
    super("brightness");
    this.#start();
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;

    try {
      const brightness = BrightnessService.get_default();
      this.#brightness = brightness;

      const update = () => {
        if (!osdEnabled() || !sourceEnabled("brightness")) return;
        if (!brightness.available) return;

        const pct = Number(brightness.screenPercent);
        const rawPct = Math.round(Number.isFinite(pct) ? pct : 0);

        this.emit({
          title: "Brightness",
          iconName: icons.brightness.screen,
          percent: rawPct,
          value: clamp01(rawPct / 100),
          overflow: rawPct > 100,
        });
      };

      brightness.connect?.("notify::screen", update);
      update();
      console.log("brightness")
    } catch (err) {
      console.warn("[OSD] Brightness controller unavailable:", err);
    }
  }

  public override canSet(): boolean {
    const b = this.#brightness;
    return Boolean(b?.available);
  }

  public override setNormalized(v: number): void {
    const b = this.#brightness;
    if (!b?.available) return;

    try {
      b.screen = clamp01(v);
    } catch {
      /* noop */
    }
  }
}

let _brightnessController: BrightnessController | null = null;

export function getBrightnessController(): BrightnessController {
  if (!_brightnessController) _brightnessController = new BrightnessController();
  return _brightnessController;
}
