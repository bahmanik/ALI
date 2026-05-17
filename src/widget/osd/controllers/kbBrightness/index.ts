import BrightnessService from "src/services/brightness";
import icons from "src/lib/icons/icons";
import { clamp01, OsdController, osdEnabled, sourceEnabled } from "../shared";

export class KeyboardBrightnessController extends OsdController {
  #started = false;
  #brightness: BrightnessService | null = null;
  #lastPct: number | null = null;

  constructor() {
    super("keyboardBrightness");
    this.#start();
  }

  #start(): void {
    if (this.#started) return;
    this.#started = true;

    try {
      const brightness = BrightnessService.get_default();
      this.#brightness = brightness;

      const update = () => {
        if (!osdEnabled() || !sourceEnabled("keyboardBrightness")) return;
        if (!brightness.available) return;

        const pct = Math.round((Number(brightness.kbdPercent) || 0) * 100);

        if (this.#lastPct === null) { this.#lastPct = pct; return; }
        if (pct === this.#lastPct) return;
        this.#lastPct = pct;

        this.emit({
          title: "Keyboard",
          iconName: icons.brightness.keyboard,
          percent: pct,
          value: clamp01(pct / 100),
          overflow: pct > 100,
        });
      };

      brightness.connect?.("notify::kbd-percent", update);

    } catch (err) {
      console.warn("[OSD] Keyboard brightness controller unavailable:", err);
    }
  }

  public override canSet(): boolean {
    const b = this.#brightness;
    return Boolean(b?.available && Number(b.kbdMax) > 0);
  }

  public override setNormalized(v: number): void {
    const b = this.#brightness;
    if (!b?.available) return;

    const max = Number(b.kbdMax) || 0;
    if (max <= 0) return;

    const raw = Math.round(clamp01(v) * max);
    try {
      b.kbd = raw;
    } catch {
      /* noop */
    }
  }
}

let _keyboardBrightnessController: KeyboardBrightnessController | null = null;

export function getKdBrightnessController(): KeyboardBrightnessController {
  if (!_keyboardBrightnessController) _keyboardBrightnessController = new KeyboardBrightnessController();
  return _keyboardBrightnessController;
}
