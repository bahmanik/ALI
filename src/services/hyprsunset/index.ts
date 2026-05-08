import { exec, execAsync } from "ags/process";
import { register, getter, setter } from "ags/gobject";
import GLib from "gi://GLib";
import { SystemUtilities } from "src/lib/system/SystemUtilities";
import { GServiceBase } from "../ServiceBase";

// hyprsunset must exist in PATH
const available = SystemUtilities.checkDependencies("hyprsunset");

function isRunning() {
  try {
    const out = exec("pidof hyprsunset")?.trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

@register({ GTypeName: "Hyprsunset" })
export default class HyprsunsetService extends GServiceBase {
  private static _default: HyprsunsetService | null = null;
  static get_default() {
    if (!this._default) this._default = new HyprsunsetService();
    return this._default;
  }

  #available = available;
  #enabled = false;
  #temperature: number = 6000;  // default fallback

  @getter(Boolean)
  get available() {
    return this.#available;
  }

  @getter(Boolean)
  get enabled() {
    return this.#enabled;
  }

  @getter(Number)
  get temperature() {
    return this.#temperature;
  }

  @setter(Boolean)
  set enabled(v) {
    if (!this.#available) return;

    if (v) {
      this.enable();
    } else {
      this.disable();
    }
  }

  @setter(Number)
  set temperature(t) {
    this.#temperature = t;
    this.notify("temperature");

    if (this.#enabled) {
      console.log('hyprsunset is enable')
      SystemUtilities.bash(`hyprctl hyprsunset temperature ${t}`).then(e => { console.log(e) }).catch(e => { console.warn(e) });
    }
  }

  constructor() {
    super();
  }

  protected async _boot() {
    // Initial state sync
    this.#enabled = isRunning();

    // Poll hyprsunset status every 2s
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
      const running = isRunning();
      if (running !== this.#enabled) {
        this.#enabled = running;
        this.notify("enabled");
      }
      return GLib.SOURCE_CONTINUE;
    });
  }

  enable(temp: number = this.#temperature) {
    if (!this.#available) return;

    execAsync(`hyprsunset -t ${temp}`).then(() => {
      this.#enabled = true;
      this.notify("enabled");
    }).catch((err) => { console.log(err) })
  }

  disable() {
    if (!this.#available) return;

    execAsync("pkill hyprsunset").then(() => {
      this.#enabled = false;
      this.notify("enabled");
    })
  }
}
