import { bootStyle } from "src/style";

/**
 * Single explicit boot entry.
 *
 * Boot order MUST be:
 *  1) bootStyle()
 *  2) bootHyprland()
 *  3) bootServices()
 */
export async function boot(): Promise<void> {
  await bootStyle();
  // await bootHyprland();
}
