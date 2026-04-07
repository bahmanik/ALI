import { bootSession } from "src/lib/session";
import { bootOptions } from "src/lib/options/runtime";
import { bootServices } from "src/services";
import { bootHyprland } from "src/hyprland";
import { bootStyle } from "src/style";

/**
 * Single explicit boot entry.
 *
 * Boot order MUST be:
 *  1) bootSession()
 *  2) bootOptions()
 *  3) bootServices()
 */
export async function boot(): Promise<void> {
  await bootSession();
  await bootOptions();
  await bootStyle();
  // await bootHyprland();
  await bootServices();
}
