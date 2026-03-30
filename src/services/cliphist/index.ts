import GObject, { register } from "ags/gobject";
import { createState } from "ags";
import { monitorFile } from "ags/file";
import GLib from "gi://GLib?version=2.0";
import { subprocess } from "ags/process";
import { options } from "./options";
import { SystemUtilities } from "src/lib/system/SystemUtilities";
import { CACHE, ensureDirectory } from "src/lib/session";

//WARNING: wire options later
@register({ GTypeName: "Cliphist" })
export default class Cliphist extends GObject.Object {
  static instance: Cliphist;

  static get_default() {
    if (!this.instance) this.instance = new Cliphist();
    return this.instance;
  }

  #list = createState<string[]>([]);

  constructor() {
    super();
    if (options.clipboard.enabled) this.start();
  }

  async start() {
    if (!SystemUtilities.checkDependencies("wl-paste", "cliphist")) return;

    try {
      await this.stop();

      const maxItems = options.clipboard.max_items;
      SystemUtilities.bash(`wl-paste --watch cliphist -max-items ${maxItems} store`);
      monitorFile(`${GLib.get_user_cache_dir()}/cliphist/db`, () =>
        this.update(),
      );
    } catch (error) {
      console.error("Failed to start clipboard monitoring:", error);
    }
  }

  async stop() {
    subprocess(`pkill -f "wl-paste.*cliphist"`);
    SystemUtilities.bash(`rm -f ${CACHE}/cliphist/*.png`);
  }

  async update() {
    if (!SystemUtilities.checkDependencies("cliphist")) return;

    try {
      const list = await SystemUtilities.bash("cliphist list");
      this.#list[1](list.split("\n").filter((line) => line.trim()));
    } catch (error) {
      console.error("Failed to update clipboard history:", error);
    }
  }

  async load_image(id: string) {
    if (!SystemUtilities.checkDependencies("cliphist")) return;
    const imagePath = `${CACHE}/cliphist/${id}.png`;

    try {
      ensureDirectory(`${CACHE}/cliphist`);
      await SystemUtilities.bash(`cliphist decode ${id} > ${imagePath}`);
      return imagePath;
    } catch (error) {
      console.error("Failed to load image preview:", error);
    }
  }

  async copy(id: string) {
    if (!SystemUtilities.checkDependencies("cliphist")) return;
    try {
      return await SystemUtilities.bash(`cliphist decode ${id} | wl-copy`);
    } catch (error) {
      console.error("Failed to copy item:", error);
    }
  }

  async clear() {
    if (!SystemUtilities.checkDependencies("cliphist")) return;

    try {
      await SystemUtilities.bash("cliphist wipe");
      await this.update();
    } catch (error) {
      console.error("Failed to clear clipboard history:", error);
    }
  }

  get list() {
    return this.#list[0];
  }
}
